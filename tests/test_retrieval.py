"""Tests for embedding creation (mocked) and similarity retrieval."""
from unittest.mock import MagicMock, patch

import numpy as np

from app.services import embeddings, retriever, storage


def _mock_embedding_response(vectors):
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=v) for v in vectors]
    return mock_response


def test_embedding_creation_mocked():
    with patch("app.services.embeddings.get_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.embeddings.create.return_value = _mock_embedding_response([[0.1, 0.2, 0.3]])
        mock_get_client.return_value = mock_client

        result = embeddings.generate_embeddings(["hello world"])
        assert result == [[0.1, 0.2, 0.3]]
        mock_client.embeddings.create.assert_called_once()


def test_embedding_creation_empty_input():
    assert embeddings.generate_embeddings([]) == []


def test_cosine_similarity_ranking():
    query = np.array([1.0, 0.0])
    matrix = np.array([
        [1.0, 0.0],   # identical -> similarity 1
        [0.0, 1.0],   # orthogonal -> similarity 0
        [-1.0, 0.0],  # opposite -> similarity -1
    ])
    scores = retriever.cosine_similarity(query, matrix)
    assert scores[0] > scores[1] > scores[2]
    assert scores[0] == 1.0


def test_top_k_retrieval():
    source_id = "source_topk"
    storage.upsert_source({
        "id": source_id, "title": "T", "source_type": "txt", "origin": "t.txt",
        "status": "ready", "created_at": "2024-01-01T00:00:00Z",
        "char_count": 10, "chunk_count": 3, "error": None,
    })
    chunks = [
        {"id": "c1", "source_id": source_id, "chunk_index": 0, "text": "apple fruit", "char_count": 11},
        {"id": "c2", "source_id": source_id, "chunk_index": 1, "text": "car engine", "char_count": 10},
        {"id": "c3", "source_id": source_id, "chunk_index": 2, "text": "banana fruit", "char_count": 12},
    ]
    storage.append_chunks(source_id, chunks)
    vectors = [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.9, 0.1, 0.0],
    ]
    storage.save_embeddings(source_id, vectors)

    query_embedding = [1.0, 0.0, 0.0]
    results = retriever.retrieve_top_k(source_id, query_embedding, top_k=2)

    assert len(results) == 2
    assert results[0].chunk["id"] == "c1"
    assert results[0].score >= results[1].score


def test_no_result_handling_when_no_chunks():
    results = retriever.retrieve_top_k("source_without_chunks", [1.0, 0.0], top_k=5)
    assert results == []
