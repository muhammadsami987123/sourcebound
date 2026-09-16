"""Shared error handling helpers — clean error envelopes, no raw stack traces."""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("sourcebound")


class AppError(Exception):
    """Application-level error that maps cleanly to an HTTP response."""

    def __init__(self, status_code: int, message: str, details: Optional[Any] = None):
        self.status_code = status_code
        self.message = message
        self.details = details
        super().__init__(message)


def error_envelope(status_code: int, message: str, details: Optional[Any] = None) -> dict:
    body: dict = {
        "error": True,
        "status_code": status_code,
        "message": message,
    }
    if details is not None:
        body["details"] = details
    return body


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=error_envelope(exc.status_code, exc.message, exc.details))


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content=error_envelope(exc.status_code, detail))


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_envelope(422, "Validation failed", details=exc.errors()),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=error_envelope(500, "An unexpected server error occurred."),
    )
