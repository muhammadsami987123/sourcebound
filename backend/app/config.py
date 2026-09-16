"""Application configuration loaded from environment variables (.env)."""
from __future__ import annotations

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load .env from the backend/ directory (parent of app/)
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def _get_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    val = os.getenv(name)
    if val is None or val.strip() == "":
        return default
    try:
        return int(val)
    except ValueError:
        return default


def _get_list(name: str, default: List[str]) -> List[str]:
    val = os.getenv(name)
    if val is None or val.strip() == "":
        return default
    return [item.strip() for item in val.split(",") if item.strip()]


class Settings:
    """Central application settings."""

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")
    OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    # Backend
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = _get_int("PORT", 8000)

    # Pipeline configuration
    CHUNK_SIZE: int = _get_int("CHUNK_SIZE", 1000)
    CHUNK_OVERLAP: int = _get_int("CHUNK_OVERLAP", 150)
    TOP_K_RESULTS: int = _get_int("TOP_K_RESULTS", 5)

    # Limits
    MAX_UPLOAD_SIZE_MB: int = _get_int("MAX_UPLOAD_SIZE_MB", 10)
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    MAX_URL_CONTENT_SIZE_MB: int = _get_int("MAX_URL_CONTENT_SIZE_MB", 10)
    MAX_URL_CONTENT_SIZE_BYTES: int = MAX_URL_CONTENT_SIZE_MB * 1024 * 1024
    URL_REQUEST_TIMEOUT_SECONDS: int = _get_int("URL_REQUEST_TIMEOUT_SECONDS", 15)
    MAX_URL_LENGTH: int = _get_int("MAX_URL_LENGTH", 2048)
    MAX_CHAT_MESSAGE_LENGTH: int = _get_int("MAX_CHAT_MESSAGE_LENGTH", 2000)

    # Allowed upload extensions / mime types
    ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}
    ALLOWED_MIME_TYPES = {
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/x-markdown",
        "application/octet-stream",  # fallback, extension is authoritative
    }

    # CORS
    CORS_ORIGINS: List[str] = _get_list("CORS_ORIGINS", ["*"])

    # Storage paths
    DATA_DIR: Path = BACKEND_DIR / "data"
    UPLOADS_DIR: Path = BACKEND_DIR / "uploads"
    EMBEDDINGS_DIR: Path = DATA_DIR / "embeddings"
    SOURCES_FILE: Path = DATA_DIR / "sources.json"
    CHUNKS_FILE: Path = DATA_DIR / "chunks.json"

    APP_NAME: str = "Sourcebound"
    APP_VERSION: str = "1.0.0"

    def ensure_directories(self) -> None:
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        self.EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_directories()
