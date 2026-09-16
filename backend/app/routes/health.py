"""Health check endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        chat_model=settings.OPENAI_CHAT_MODEL,
        embedding_model=settings.OPENAI_EMBEDDING_MODEL,
    )
