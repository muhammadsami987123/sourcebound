"""Local JSON/NumPy-based storage layer.

Handles atomic writes, safe loads with missing-file defaults, and
cascade-deletion of chunks/embeddings when a source is removed.
"""
from __future__ import annotations

import json
import os
import tempfile
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.config import settings

_lock = threading.Lock()


def _atomic_write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=str(path.parent), prefix=".tmp_", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


def _safe_load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return default
            return json.loads(content)
    except (json.JSONDecodeError, OSError):
        return default


# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------

def load_sources() -> List[Dict[str, Any]]:
    return _safe_load_json(settings.SOURCES_FILE, [])


def save_sources(sources: List[Dict[str, Any]]) -> None:
    with _lock:
        _atomic_write_json(settings.SOURCES_FILE, sources)


def get_source(source_id: str) -> Optional[Dict[str, Any]]:
    for s in load_sources():
        if s.get("id") == source_id:
            return s
    return None


def upsert_source(source: Dict[str, Any]) -> None:
    with _lock:
        sources = load_sources()
        found = False
        for i, s in enumerate(sources):
            if s.get("id") == source["id"]:
                sources[i] = source
                found = True
                break
        if not found:
            sources.append(source)
        _atomic_write_json(settings.SOURCES_FILE, sources)


def update_source_fields(source_id: str, **fields: Any) -> Optional[Dict[str, Any]]:
    with _lock:
        sources = load_sources()
        updated = None
        for s in sources:
            if s.get("id") == source_id:
                s.update(fields)
                updated = s
                break
        if updated is not None:
            _atomic_write_json(settings.SOURCES_FILE, sources)
        return updated


def find_source_by_origin(origin: str, source_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
    for s in load_sources():
        if s.get("origin") == origin and (source_type is None or s.get("source_type") == source_type):
            return s
    return None


def delete_source(source_id: str) -> bool:
    with _lock:
        sources = load_sources()
        new_sources = [s for s in sources if s.get("id") != source_id]
        deleted = len(new_sources) != len(sources)
        if deleted:
            _atomic_write_json(settings.SOURCES_FILE, new_sources)

        # Cascade delete chunks
        chunks = _safe_load_json(settings.CHUNKS_FILE, [])
        new_chunks = [c for c in chunks if c.get("source_id") != source_id]
        if len(new_chunks) != len(chunks):
            _atomic_write_json(settings.CHUNKS_FILE, new_chunks)

        # Cascade delete embeddings file
        emb_path = settings.EMBEDDINGS_DIR / f"{source_id}.npy"
        if emb_path.exists():
            try:
                emb_path.unlink()
            except OSError:
                pass

        return deleted


# ---------------------------------------------------------------------------
# Chunks
# ---------------------------------------------------------------------------

def load_chunks() -> List[Dict[str, Any]]:
    return _safe_load_json(settings.CHUNKS_FILE, [])


def save_chunks(chunks: List[Dict[str, Any]]) -> None:
    with _lock:
        _atomic_write_json(settings.CHUNKS_FILE, chunks)


def get_chunks_for_source(source_id: str) -> List[Dict[str, Any]]:
    return [c for c in load_chunks() if c.get("source_id") == source_id]


def append_chunks(source_id: str, new_chunks: List[Dict[str, Any]]) -> None:
    with _lock:
        chunks = load_chunks()
        # Remove any existing chunks for this source first (reprocessing safety)
        chunks = [c for c in chunks if c.get("source_id") != source_id]
        chunks.extend(new_chunks)
        _atomic_write_json(settings.CHUNKS_FILE, chunks)


# ---------------------------------------------------------------------------
# Embeddings (stored per-source as a single .npy matrix, rows aligned to
# the order of get_chunks_for_source(source_id))
# ---------------------------------------------------------------------------

def save_embeddings(source_id: str, embeddings: List[List[float]]) -> None:
    settings.EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    arr = np.array(embeddings, dtype=np.float32)
    path = settings.EMBEDDINGS_DIR / f"{source_id}.npy"
    tmp_path = settings.EMBEDDINGS_DIR / f".tmp_{source_id}.npy"
    with _lock:
        np.save(tmp_path, arr)
        os.replace(tmp_path, path)


def load_embeddings(source_id: str) -> Optional[np.ndarray]:
    path = settings.EMBEDDINGS_DIR / f"{source_id}.npy"
    if not path.exists():
        return None
    try:
        return np.load(path)
    except (OSError, ValueError):
        return None
