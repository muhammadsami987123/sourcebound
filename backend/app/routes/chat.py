"""Chat / RAG endpoint."""
from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse, ReferenceOut
from app.services import rag_service, storage
from app.utils.errors import AppError

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    source = storage.get_source(payload.source_id)
    if not source:
        raise AppError(404, "The selected source was not found.")

    if source["status"] != "ready":
        status = source["status"]
        if status == "failed":
            message = f"This source failed to process: {source.get('error') or 'unknown error'}."
        elif status in ("pending", "processing"):
            message = "This source is still processing. Please wait until it is ready."
        else:
            message = "This source is not ready for chat."
        raise AppError(409, message)

    try:
        result = rag_service.answer_question(
            source,
            payload.message,
            top_k=payload.top_k,
            response_style=payload.response_style,
        )
    except rag_service.RAGError as exc:
        raise AppError(500, "Failed to generate an answer. Please try again.")

    conversation_id = payload.conversation_id or f"conversation_{uuid.uuid4().hex[:12]}"

    references = [ReferenceOut(**ref) for ref in result["references"]]

    return ChatResponse(
        answer=result["answer"],
        source_id=payload.source_id,
        conversation_id=conversation_id,
        references=references,
    )
