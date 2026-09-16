"""Shared pytest fixtures: isolate storage to a temp dir and stub OpenAI credentials."""
from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("OPENAI_API_KEY", "test-key-not-real")

import pytest

from app.config import settings


@pytest.fixture(autouse=True)
def isolated_storage(tmp_path, monkeypatch):
    """Redirect all storage paths to a per-test temp directory."""
    data_dir = tmp_path / "data"
    uploads_dir = tmp_path / "uploads"
    embeddings_dir = data_dir / "embeddings"

    data_dir.mkdir(parents=True, exist_ok=True)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    embeddings_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(settings, "DATA_DIR", data_dir)
    monkeypatch.setattr(settings, "UPLOADS_DIR", uploads_dir)
    monkeypatch.setattr(settings, "EMBEDDINGS_DIR", embeddings_dir)
    monkeypatch.setattr(settings, "SOURCES_FILE", data_dir / "sources.json")
    monkeypatch.setattr(settings, "CHUNKS_FILE", data_dir / "chunks.json")

    yield

    # cleanup handled by tmp_path automatically
