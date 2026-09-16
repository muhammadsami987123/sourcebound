"""Shared/common Pydantic schemas."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: bool = True
    status_code: int
    message: str
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    chat_model: str
    embedding_model: str
