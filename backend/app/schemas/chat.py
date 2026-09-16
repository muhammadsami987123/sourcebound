"""Pydantic schemas for the chat / RAG endpoint."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.config import settings


class ChatRequest(BaseModel):
    source_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    top_k: Optional[int] = Field(default=None, ge=1, le=20)
    response_style: Optional[Literal["concise", "balanced", "detailed"]] = None

    @field_validator("message")
    @classmethod
    def validate_message_length(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message is required.")
        if len(v) > settings.MAX_CHAT_MESSAGE_LENGTH:
            raise ValueError(
                f"Message exceeds maximum length of {settings.MAX_CHAT_MESSAGE_LENGTH} characters."
            )
        return v.strip()

    @field_validator("conversation_id")
    @classmethod
    def validate_conversation_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if len(v) > 128:
            raise ValueError("conversation_id is too long.")
        return v


class ReferenceOut(BaseModel):
    chunk_id: str
    source_title: str
    excerpt: str
    chunk_index: int
    score: float


class ChatResponse(BaseModel):
    answer: str
    source_id: str
    conversation_id: Optional[str] = None
    references: List[ReferenceOut] = Field(default_factory=list)
