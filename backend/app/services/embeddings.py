"""OpenAI embeddings generation wrapper."""
from __future__ import annotations

from typing import List

from openai import OpenAI

from app.config import settings

_client: OpenAI | None = None


class EmbeddingError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts using the configured model."""
    if not texts:
        return []
    try:
        client = get_client()
        response = client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]
    except Exception as exc:
        raise EmbeddingError(f"Failed to generate embeddings: {exc}")


def generate_embedding(text: str) -> List[float]:
    result = generate_embeddings([text])
    return result[0] if result else []
