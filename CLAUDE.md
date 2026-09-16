# CLAUDE.md

Guidance for Claude Code (and other AI coding agents) working in this repository.

## Project

**Sourcebound** — a compact, professional Retrieval-Augmented Generation chatbot. Users add a website URL or upload a document (PDF/TXT/MD), the backend extracts, cleans, chunks, and embeds the content, and the chat interface answers questions grounded only in the retrieved chunks from the selected source.

The full functional specification lives in `task.md` at the repo root — treat it as the source of truth for behavior, validation rules, API shape, and acceptance criteria. Re-read the relevant section of `task.md` before changing behavior in that area.

## Stack (do not introduce alternatives)

- **Frontend:** HTML5 + Tailwind CSS + vanilla JavaScript + Fetch API. No React/Next.js/Vue/Angular or any frontend framework or build step.
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic, `python-dotenv`, OpenAI Python SDK.
- **Storage:** local JSON files + NumPy vectors under `backend/data/`. No database, no Docker, no external vector store, no microservices.
- **Models:** chat model and embedding model are env-configurable (`OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`), defaulting to `gpt-4.1-mini` and `text-embedding-3-small`.

## Project structure

```
backend/app/{main.py,config.py,schemas/,routes/,services/,utils/}
backend/data/            # sources.json, chunks.json, embeddings/ (gitignored contents)
backend/uploads/         # user-uploaded files (gitignored contents)
frontend/{*.html, assets/css/, assets/js/}
tests/                   # pytest suite, mocks all OpenAI calls
```

## Key rules when modifying this codebase

- Keep API keys backend-only. Never reference `OPENAI_API_KEY` from frontend code.
- Every backend endpoint validates input with Pydantic and returns structured errors with correct status codes (400/404/413/422/500) — never leak raw stack traces or filesystem paths to the client.
- The RAG answer generation must stay strictly grounded in retrieved chunks: no fabricated facts, and a clear "not found in this source" response when context is insufficient.
- All frontend API calls go through `frontend/assets/js/api.js` — don't add ad-hoc `fetch()` calls elsewhere. All shared UI (cards, badges, modals, toasts, forms) goes through `frontend/assets/js/components.js` — don't duplicate markup/logic across pages.
- Escape all user-/source-derived text before inserting into the DOM; never use raw `innerHTML` with untrusted content.
- Uploaded filenames are untrusted: validate extension + MIME type on the backend, store under a generated safe filename, and guard against path traversal.
- Restrict URL ingestion to `http`/`https` only; reject `file://`, `javascript:`, `ftp://`, and enforce request timeouts and response-size limits.
- Storage writes to `backend/data/*.json` must be atomic (write temp file, then rename) to avoid corruption; deleting a source must cascade-delete its chunks and embeddings.

## Testing

```bash
cd backend
pip install -r requirements.txt
pip install pytest
pytest ../tests -v
```

Tests mock all OpenAI (chat + embeddings) calls — a real `OPENAI_API_KEY` is never required to run the suite. When you add backend behavior, add or update the matching test in `tests/`.

## Running locally

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # then fill in OPENAI_API_KEY
uvicorn app.main:app --reload

# Frontend (separate terminal, from frontend/)
python -m http.server 5500
```

## Scope discipline

This is intentionally a small, portfolio-quality project. When asked to extend it, prefer the simplest approach consistent with `task.md` (section 19, "Final Acceptance Criteria") over adding new infrastructure, frameworks, or a database.
