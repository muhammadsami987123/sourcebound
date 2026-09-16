"""Text chunking with configurable size/overlap.

Avoids empty chunks, excessively small fragments, and duplicate chunks.
"""
from __future__ import annotations

from typing import List

from app.config import settings

MIN_CHUNK_CHARS = 20


def chunk_text(text: str, chunk_size: int | None = None, chunk_overlap: int | None = None) -> List[str]:
    """Split text into overlapping chunks.

    Returns a list of chunk strings, filtering out empty/tiny/duplicate chunks.
    """
    if not text or not text.strip():
        return []

    chunk_size = chunk_size or settings.CHUNK_SIZE
    chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    if chunk_size <= 0:
        chunk_size = 1000
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        chunk_overlap = min(150, chunk_size // 4)

    text = text.strip()
    step = chunk_size - chunk_overlap

    raw_chunks: List[str] = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end].strip()
        if chunk:
            raw_chunks.append(chunk)
        if end >= length:
            break
        start += step

    # Filter empty/tiny fragments and de-duplicate while preserving order
    seen = set()
    final_chunks: List[str] = []
    for chunk in raw_chunks:
        if len(chunk) < MIN_CHUNK_CHARS:
            continue
        key = chunk.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        final_chunks.append(chunk)

    return final_chunks
