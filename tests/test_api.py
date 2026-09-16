"""API-level tests using FastAPI's TestClient. All OpenAI calls are mocked."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import url_loader

client = TestClient(app)


def _mock_embedding_response(n, dim=3):
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1 * (i + 1)] * dim) for i in range(n)]
    return mock_response


@pytest.fixture
def mock_openai_embeddings():
    with patch("app.services.embeddings.get_client") as mock_get_client:
        mock_client = MagicMock()

        def create_side_effect(model, input):
            return _mock_embedding_response(len(input))

        mock_client.embeddings.create.side_effect = create_side_effect
        mock_get_client.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_openai_chat():
    with patch("app.services.rag_service._get_client") as mock_get_client:
        mock_client = MagicMock()
        mock_message = MagicMock()
        mock_message.content = "This is a grounded test answer based on the context."
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_response
        mock_get_client.return_value = mock_client
        yield mock_client


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "chat_model" in data
    assert "embedding_model" in data


def test_source_listing_empty():
    response = client.get("/api/sources")
    assert response.status_code == 200
    data = response.json()
    assert data["sources"] == []
    assert data["total"] == 0


def test_url_ingestion_success(mock_openai_embeddings):
    fake_result = url_loader.URLFetchResult(
        text="This is meaningful extracted website content about a fictional product. " * 5,
        title="Example Domain",
        char_count=100,
    )
    with patch("app.routes.sources.url_loader.fetch_and_extract", return_value=fake_result):
        response = client.post("/api/sources/url", json={"url": "https://example.com"})
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "ready"
    assert data["source_type"] == "url"
    assert data["chunk_count"] >= 1


def test_url_ingestion_invalid_url():
    response = client.post("/api/sources/url", json={"url": "not-a-valid-url"})
    assert response.status_code == 400


def test_url_ingestion_unsupported_protocol():
    response = client.post("/api/sources/url", json={"url": "javascript:alert(1)"})
    assert response.status_code == 400


def test_url_ingestion_duplicate(mock_openai_embeddings):
    fake_result = url_loader.URLFetchResult(
        text="Duplicate content test for the ingestion pipeline validation. " * 5,
        title="Dup Example",
        char_count=100,
    )
    with patch("app.routes.sources.url_loader.fetch_and_extract", return_value=fake_result):
        first = client.post("/api/sources/url", json={"url": "https://dup-example.com"})
        assert first.status_code == 201
        second = client.post("/api/sources/url", json={"url": "https://dup-example.com"})
    assert second.status_code == 400


def test_url_ingestion_unreachable_marks_failed():
    with patch(
        "app.routes.sources.url_loader.fetch_and_extract",
        side_effect=url_loader.URLLoadError("The website could not be reached (connection failed)."),
    ):
        response = client.post("/api/sources/url", json={"url": "https://unreachable-example.com"})
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "failed"
    assert data["error"]


def test_file_upload_txt_success(mock_openai_embeddings):
    content = b"This is a plain text document with enough meaningful content to be processed. " * 5
    response = client.post(
        "/api/sources/upload",
        files={"file": ("notes.txt", content, "text/plain")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "ready"
    assert data["source_type"] == "txt"


def test_file_upload_unsupported_extension():
    response = client.post(
        "/api/sources/upload",
        files={"file": ("archive.zip", b"fake-zip-bytes", "application/zip")},
    )
    assert response.status_code == 400


def test_file_upload_empty_file():
    response = client.post(
        "/api/sources/upload",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400


def test_source_listing_and_deletion(mock_openai_embeddings):
    content = b"Deletable source content that is long enough to process successfully. " * 5
    create_resp = client.post(
        "/api/sources/upload",
        files={"file": ("deleteme.txt", content, "text/plain")},
    )
    assert create_resp.status_code == 201
    source_id = create_resp.json()["id"]

    list_resp = client.get("/api/sources")
    assert any(s["id"] == source_id for s in list_resp.json()["sources"])

    delete_resp = client.delete(f"/api/sources/{source_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["deleted"] is True

    get_resp = client.get(f"/api/sources/{source_id}")
    assert get_resp.status_code == 404


def test_delete_nonexistent_source():
    response = client.delete("/api/sources/source_does_not_exist")
    assert response.status_code == 404


def test_chat_request_success(mock_openai_embeddings, mock_openai_chat):
    content = b"Chat testing content describing a fictional space exploration program. " * 5
    create_resp = client.post(
        "/api/sources/upload",
        files={"file": ("chat_source.txt", content, "text/plain")},
    )
    source_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "ready"

    chat_resp = client.post("/api/chat", json={"source_id": source_id, "message": "What is this about?"})
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert data["answer"]
    assert data["source_id"] == source_id
    assert isinstance(data["references"], list)


def test_chat_invalid_source_handling():
    response = client.post("/api/chat", json={"source_id": "nonexistent", "message": "Hello?"})
    assert response.status_code == 404


def test_chat_unready_source_handling():
    # Create a source stuck at "processing" via a failing extraction mock is easiest via direct storage.
    from app.services import storage

    storage.upsert_source({
        "id": "source_unready", "title": "Unready", "source_type": "txt",
        "origin": "unready.txt", "status": "processing", "created_at": "2024-01-01T00:00:00Z",
        "char_count": 0, "chunk_count": 0, "error": None,
    })
    response = client.post("/api/chat", json={"source_id": "source_unready", "message": "Hello?"})
    assert response.status_code == 409


def test_chat_empty_message_validation_error():
    response = client.post("/api/chat", json={"source_id": "source_x", "message": ""})
    assert response.status_code == 422


def test_chat_missing_source_id_validation_error():
    response = client.post("/api/chat", json={"message": "Hello?"})
    assert response.status_code == 422
