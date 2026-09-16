"""Pydantic schemas for source management."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

SourceType = Literal["url", "pdf", "txt", "md"]
SourceStatus = Literal["pending", "processing", "ready", "failed"]


class SourceURLCreate(BaseModel):
    url: str = Field(..., min_length=1, description="Website URL to ingest")


class SourceOut(BaseModel):
    id: str
    title: str
    source_type: SourceType
    origin: str = Field(..., description="Original URL or filename")
    status: SourceStatus
    created_at: str
    char_count: int = 0
    chunk_count: int = 0
    error: Optional[str] = None


class SourceListResponse(BaseModel):
    sources: List[SourceOut]
    total: int


class SourceStatusResponse(BaseModel):
    id: str
    status: SourceStatus
    error: Optional[str] = None
    char_count: int = 0
    chunk_count: int = 0


class ChunkOut(BaseModel):
    id: str
    source_id: str
    chunk_index: int
    text: str
    char_count: int


class ChunksResponse(BaseModel):
    source_id: str
    chunks: List[ChunkOut]
    total: int


class DeleteResponse(BaseModel):
    id: str
    deleted: bool = True
