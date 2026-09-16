"""Source management endpoints: URL ingestion, file upload, listing, details, deletion."""
from __future__ import annotations

import os
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.config import settings
from app.schemas.source import (
    ChunkOut,
    ChunksResponse,
    DeleteResponse,
    SourceListResponse,
    SourceOut,
    SourceStatusResponse,
    SourceURLCreate,
)
from app.services import chunker, document_loader, embeddings, storage, text_cleaner, url_loader
from app.utils.errors import AppError
from app.utils.validation import (
    ValidationError,
    sanitize_filename_component,
    validate_file_extension,
    validate_file_size,
    validate_mime_type,
    validate_url,
)

router = APIRouter(prefix="/api/sources", tags=["sources"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_source_out(source: dict) -> SourceOut:
    return SourceOut(
        id=source["id"],
        title=source.get("title", source.get("origin", "Untitled")),
        source_type=source["source_type"],
        origin=source["origin"],
        status=source["status"],
        created_at=source["created_at"],
        char_count=source.get("char_count", 0),
        chunk_count=source.get("chunk_count", 0),
        error=source.get("error"),
    )


def _process_pipeline(source_id: str, raw_text: str) -> None:
    """Run cleaning -> normalization -> chunking -> embeddings -> storage for a source.

    On any failure, marks the source as failed with an error message. Never leaves
    a source stuck at 'processing'.
    """
    try:
        cleaned = text_cleaner.clean_text(raw_text)
        normalized = text_cleaner.normalize_text(cleaned)

        if not text_cleaner.is_meaningful_text(normalized):
            storage.update_source_fields(
                source_id,
                status="failed",
                error="No meaningful text could be extracted from this source.",
            )
            return

        chunks = chunker.chunk_text(normalized)
        if not chunks:
            storage.update_source_fields(
                source_id,
                status="failed",
                error="The source did not produce any usable chunks.",
            )
            return

        try:
            vectors = embeddings.generate_embeddings(chunks)
        except embeddings.EmbeddingError as exc:
            storage.update_source_fields(source_id, status="failed", error=exc.message)
            return

        chunk_records = []
        for idx, (chunk_text_value, vector) in enumerate(zip(chunks, vectors)):
            chunk_records.append({
                "id": f"chunk_{uuid.uuid4().hex[:12]}",
                "source_id": source_id,
                "chunk_index": idx,
                "text": chunk_text_value,
                "char_count": len(chunk_text_value),
            })

        storage.append_chunks(source_id, chunk_records)
        storage.save_embeddings(source_id, vectors)

        storage.update_source_fields(
            source_id,
            status="ready",
            char_count=len(normalized),
            chunk_count=len(chunk_records),
            error=None,
        )
    except Exception as exc:  # never leave source stuck processing
        storage.update_source_fields(source_id, status="failed", error=f"Processing failed: {exc}")


@router.get("", response_model=SourceListResponse)
async def list_sources() -> SourceListResponse:
    sources = storage.load_sources()
    sources_sorted = sorted(sources, key=lambda s: s.get("created_at", ""), reverse=True)
    return SourceListResponse(sources=[_to_source_out(s) for s in sources_sorted], total=len(sources_sorted))


@router.post("/url", response_model=SourceOut, status_code=201)
async def add_url_source(payload: SourceURLCreate) -> SourceOut:
    try:
        clean_url = validate_url(payload.url)
    except ValidationError as exc:
        raise AppError(400, exc.message)

    existing = storage.find_source_by_origin(clean_url, "url")
    if existing:
        raise AppError(400, "This URL has already been added as a source.")

    source_id = f"source_{uuid.uuid4().hex[:12]}"
    source = {
        "id": source_id,
        "title": clean_url,
        "source_type": "url",
        "origin": clean_url,
        "status": "processing",
        "created_at": _now_iso(),
        "char_count": 0,
        "chunk_count": 0,
        "error": None,
    }
    storage.upsert_source(source)

    try:
        result = url_loader.fetch_and_extract(clean_url)
    except url_loader.URLLoadError as exc:
        storage.update_source_fields(source_id, status="failed", error=exc.message)
        return _to_source_out(storage.get_source(source_id))

    storage.update_source_fields(source_id, title=result.title or clean_url)
    _process_pipeline(source_id, result.text)

    return _to_source_out(storage.get_source(source_id))


@router.post("/upload", response_model=SourceOut, status_code=201)
async def upload_file_source(file: UploadFile = File(...)) -> SourceOut:
    original_name = file.filename or ""

    try:
        extension = validate_file_extension(original_name)
    except ValidationError as exc:
        raise AppError(400, exc.message)

    validate_mime_type(file.content_type, extension)

    contents = await file.read()
    size = len(contents)

    if size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise AppError(413, f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    try:
        validate_file_size(size)
    except ValidationError as exc:
        raise AppError(400, exc.message)

    safe_display_name = sanitize_filename_component(original_name)

    source_type_map = {".pdf": "pdf", ".txt": "txt", ".md": "md"}
    source_type = source_type_map[extension]

    # Generate a safe random filename for storage; never trust the original.
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    stored_path = settings.UPLOADS_DIR / stored_filename

    # Prevent path traversal: resolve and ensure it stays within uploads dir.
    resolved = stored_path.resolve()
    if settings.UPLOADS_DIR.resolve() not in resolved.parents and resolved != settings.UPLOADS_DIR.resolve():
        raise AppError(400, "Invalid file path.")

    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    with open(stored_path, "wb") as f:
        f.write(contents)

    source_id = f"source_{uuid.uuid4().hex[:12]}"
    source = {
        "id": source_id,
        "title": safe_display_name,
        "source_type": source_type,
        "origin": safe_display_name,
        "status": "processing",
        "created_at": _now_iso(),
        "char_count": 0,
        "chunk_count": 0,
        "error": None,
        "stored_filename": stored_filename,
    }
    storage.upsert_source(source)

    try:
        extract_result = document_loader.extract_text(stored_path, extension)
    except document_loader.DocumentLoadError as exc:
        storage.update_source_fields(source_id, status="failed", error=exc.message)
        return _to_source_out(storage.get_source(source_id))

    _process_pipeline(source_id, extract_result.text)

    return _to_source_out(storage.get_source(source_id))


@router.get("/{source_id}", response_model=SourceOut)
async def get_source_detail(source_id: str) -> SourceOut:
    source = storage.get_source(source_id)
    if not source:
        raise AppError(404, "Source not found.")
    return _to_source_out(source)


@router.delete("/{source_id}", response_model=DeleteResponse)
async def delete_source(source_id: str) -> DeleteResponse:
    source = storage.get_source(source_id)
    if not source:
        raise AppError(404, "Source not found.")

    # Also remove uploaded file if present
    stored_filename = source.get("stored_filename")
    if stored_filename:
        file_path = settings.UPLOADS_DIR / stored_filename
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass

    storage.delete_source(source_id)
    return DeleteResponse(id=source_id, deleted=True)


@router.get("/{source_id}/status", response_model=SourceStatusResponse)
async def get_source_status(source_id: str) -> SourceStatusResponse:
    source = storage.get_source(source_id)
    if not source:
        raise AppError(404, "Source not found.")
    return SourceStatusResponse(
        id=source["id"],
        status=source["status"],
        error=source.get("error"),
        char_count=source.get("char_count", 0),
        chunk_count=source.get("chunk_count", 0),
    )


@router.get("/{source_id}/chunks", response_model=ChunksResponse)
async def get_source_chunks(source_id: str) -> ChunksResponse:
    source = storage.get_source(source_id)
    if not source:
        raise AppError(404, "Source not found.")

    chunks = storage.get_chunks_for_source(source_id)
    chunk_out = [
        ChunkOut(
            id=c["id"],
            source_id=c["source_id"],
            chunk_index=c["chunk_index"],
            text=c["text"],
            char_count=c["char_count"],
        )
        for c in sorted(chunks, key=lambda c: c["chunk_index"])
    ]
    return ChunksResponse(source_id=source_id, chunks=chunk_out, total=len(chunk_out))
