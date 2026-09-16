"""Vector similarity retrieval over stored chunk embeddings."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

import numpy as np

from app.config import settings
from app.services import storage


@dataclass
class RetrievedChunk:
    chunk: dict
    score: float


def cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between a query vector and a matrix of vectors."""
    if matrix.size == 0:
        return np.array([])
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return np.zeros(matrix.shape[0])
    matrix_norms = np.linalg.norm(matrix, axis=1)
    matrix_norms[matrix_norms == 0] = 1e-10
    similarities = (matrix @ query_vec) / (matrix_norms * query_norm)
    return similarities


def retrieve_top_k(source_id: str, query_embedding: List[float], top_k: int | None = None) -> List[RetrievedChunk]:
    """Return the top-k most similar chunks for a source, or [] if none exist."""
    top_k = top_k or settings.TOP_K_RESULTS

    chunks = storage.get_chunks_for_source(source_id)
    if not chunks:
        return []

    embeddings = storage.load_embeddings(source_id)
    if embeddings is None or embeddings.shape[0] == 0:
        return []

    n = min(len(chunks), embeddings.shape[0])
    chunks = chunks[:n]
    embeddings = embeddings[:n]

    query_vec = np.array(query_embedding, dtype=np.float32)
    scores = cosine_similarity(query_vec, embeddings)
    if scores.size == 0:
        return []

    top_k = min(top_k, len(chunks))
    top_indices = np.argsort(-scores)[:top_k]

    results = [RetrievedChunk(chunk=chunks[i], score=float(scores[i])) for i in top_indices]
    return results
