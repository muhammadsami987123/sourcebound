# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Copilot Workspace, etc.) contributing to **Sourcebound**.

## What this project is

A compact RAG (Retrieval-Augmented Generation) knowledge chatbot: users add a website URL or upload a PDF/TXT/MD document, the backend extracts + cleans + chunks + embeds the content into local storage, and the chat UI answers questions grounded strictly in the retrieved chunks for the selected source. See `task.md` at the repo root for the full spec — it is authoritative for behavior, API contracts, and acceptance criteria.

## Hard constraints

1. **No frontend framework.** Frontend is HTML5 + Tailwind CSS + vanilla JS + Fetch API only. Do not add React, Next.js, Vue, Angular, or a bundler/build step.
2. **No database, no Docker, no external vector store.** Persistence is local JSON (`backend/data/sources.json`, `backend/data/chunks.json`) plus NumPy embedding files. Keep it that way.
3. **Backend-only secrets.** `OPENAI_API_KEY` and other secrets live only in `backend/.env` (never committed — see `.gitignore`) and are read via `backend/app/config.py`. Never expose them to the frontend.
4. **Grounded answers only.** The chat pipeline must answer strictly from retrieved chunks. If retrieval returns nothing relevant, the assistant must say so rather than inventing an answer.

## Where things live

| Concern | Location |
|---|---|
| FastAPI app entrypoint | `backend/app/main.py` |
| Env/config loading | `backend/app/config.py` |
| Request/response models | `backend/app/schemas/` |
| HTTP routes | `backend/app/routes/{health,sources,chat}.py` |
| Extraction / cleaning / chunking / embeddings / retrieval / storage | `backend/app/services/` |
| Shared validation + error envelope | `backend/app/utils/{validation,errors}.py` |
| Pages | `frontend/{index,dashboard,sources,source-details,chat,settings}.html` |
| Shared frontend fetch wrapper | `frontend/assets/js/api.js` |
| Shared frontend nav/shell | `frontend/assets/js/navigation.js` |
| Reusable render functions (cards, badges, modals, toasts...) | `frontend/assets/js/components.js` |
| Tests (mocked OpenAI calls) | `tests/` |

## Workflow expectations

- Before changing behavior, read the relevant section of `task.md`.
- Add or update a Pydantic schema whenever you change a request/response shape.
- Add or update a test in `tests/` for any backend behavior change; the suite must keep passing without a real `OPENAI_API_KEY` (mock `services/embeddings.py` and the chat-completion call).
- Reuse `frontend/assets/js/api.js` for backend calls and `components.js` for UI pieces — don't duplicate `fetch()` calls or markup across pages.
- Escape/encode any user- or source-derived text before inserting into the DOM.
- Keep error responses structured (never raw stack traces) and use the status codes defined in `task.md` section 11.

## Commands

```bash
# Backend install + run
cd backend && pip install -r requirements.txt
copy .env.example .env   # fill in OPENAI_API_KEY
uvicorn app.main:app --reload

# Backend tests
cd backend && pip install pytest && pytest ../tests -v

# Frontend (static server, from frontend/)
python -m http.server 5500
```

## Definition of done for a change

- Matches the relevant requirements in `task.md`.
- Backend: passes `pytest`, returns correct status codes, no secrets leaked, no unvalidated input reaches a service function.
- Frontend: no framework/build-step introduced, no duplicated fetch/UI logic, responsive at desktop/tablet/mobile, loading/empty/error states present for any new async action.
