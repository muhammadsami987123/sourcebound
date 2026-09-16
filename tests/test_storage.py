"""Tests for the local JSON/NumPy storage layer."""
import numpy as np

from app.services import storage


def _make_source(source_id="source_abc"):
    return {
        "id": source_id,
        "title": "Test Source",
        "source_type": "url",
        "origin": "https://example.com",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00Z",
        "char_count": 0,
        "chunk_count": 0,
        "error": None,
    }


def test_save_and_load_source():
    source = _make_source()
    storage.upsert_source(source)
    loaded = storage.get_source("source_abc")
    assert loaded is not None
    assert loaded["origin"] == "https://example.com"


def test_load_sources_empty_when_missing():
    assert storage.load_sources() == []


def test_update_status():
    source = _make_source()
    storage.upsert_source(source)
    updated = storage.update_source_fields("source_abc", status="ready", char_count=500)
    assert updated["status"] == "ready"
    assert updated["char_count"] == 500

    reloaded = storage.get_source("source_abc")
    assert reloaded["status"] == "ready"


def test_save_chunks_and_retrieve():
    source = _make_source()
    storage.upsert_source(source)
    chunks = [
        {"id": "chunk_1", "source_id": "source_abc", "chunk_index": 0, "text": "Hello", "char_count": 5},
        {"id": "chunk_2", "source_id": "source_abc", "chunk_index": 1, "text": "World", "char_count": 5},
    ]
    storage.append_chunks("source_abc", chunks)
    loaded_chunks = storage.get_chunks_for_source("source_abc")
    assert len(loaded_chunks) == 2


def test_delete_source_and_related_chunks():
    source = _make_source()
    storage.upsert_source(source)
    chunks = [{"id": "chunk_1", "source_id": "source_abc", "chunk_index": 0, "text": "Hello", "char_count": 5}]
    storage.append_chunks("source_abc", chunks)
    storage.save_embeddings("source_abc", [[0.1, 0.2, 0.3]])

    deleted = storage.delete_source("source_abc")
    assert deleted is True
    assert storage.get_source("source_abc") is None
    assert storage.get_chunks_for_source("source_abc") == []
    assert storage.load_embeddings("source_abc") is None


def test_missing_storage_file_handling():
    # No files created yet; should return safe defaults, not raise.
    assert storage.load_sources() == []
    assert storage.load_chunks() == []
    assert storage.load_embeddings("nonexistent") is None


def test_delete_nonexistent_source_returns_false():
    assert storage.delete_source("does_not_exist") is False


def test_save_and_load_embeddings():
    vectors = [[1.0, 2.0], [3.0, 4.0]]
    storage.save_embeddings("source_xyz", vectors)
    loaded = storage.load_embeddings("source_xyz")
    assert isinstance(loaded, np.ndarray)
    assert loaded.shape == (2, 2)
