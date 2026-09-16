# Sourcebound

A compact, professional **Retrieval-Augmented Generation (RAG) knowledge chatbot**. Add a website URL or upload a document, and ask questions that are answered strictly from that source's content — with references back to the exact chunks used.

> Portfolio-quality by design: no database, no Docker, no frontend framework. Just FastAPI, local JSON/NumPy storage, and plain HTML/Tailwind/vanilla JS.

## Overview

Sourcebound lets a user:

1. Add a public website URL, or upload a local `.pdf` / `.txt` / `.md` document.
2. Have the backend extract, clean, chunk, and embed the content.
3. Select that source in the chat interface and ask questions about it.
4. Get answers grounded only in the retrieved chunks, with source references — and a clear "not found in this source" response when the answer isn't in the content, instead of a fabricated one.

## Quick Start

```powershell
git clone https://github.com/muhammadsami987123/sourcebound.git
cd sourcebound

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# edit backend\.env and set OPENAI_API_KEY
cd ..

.\start-dev.ps1
```

Then open `http://127.0.0.1:5500/dashboard.html`. `start-dev.ps1` runs the FastAPI backend (`http://127.0.0.1:8000`) and the static frontend (`http://127.0.0.1:5500`) together in one terminal — press `Ctrl+C` to stop both. See [Installation & Running](#installation--running-windows) below for macOS/Linux and the two-terminal alternative.

## Main Features

- Website URL ingestion with protocol/size/timeout safety checks and readable-text extraction.
- Local document upload (PDF, TXT, Markdown) with extension + MIME + size validation.
- Text cleaning, normalization, and configurable chunking with overlap.
- OpenAI embeddings + local NumPy cosine-similarity retrieval (no external vector DB).
- Source-grounded chat with per-answer references (source, chunk, excerpt, relevance).
- Dashboard, sources list with search/filter, source detail view, chat, and settings pages.
- Full loading / empty / validation-error / network-error / backend-error states throughout.
- Professional, responsive, framework-free frontend (light/dark theme, purple accent) with a collapsible/closable sidebar and a fixed-position chat composer.
- Per-answer "Sources" button opens a popup with the exact reference passages used to ground that answer.

## Technology Stack

**Frontend:** HTML5, Tailwind CSS, vanilla JavaScript, Fetch API, `localStorage` for preferences.

**Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic, OpenAI Python SDK, `python-dotenv`.

**RAG components:** website/document text extraction, cleaning, chunking, OpenAI embeddings (`text-embedding-3-small` by default), NumPy-based vector similarity search, grounded answer generation (`gpt-4.1-mini` by default).

**Storage:** local JSON files (`backend/data/sources.json`, `backend/data/chunks.json`) + NumPy embedding files under `backend/data/embeddings/`, uploads under `backend/uploads/`.

## RAG Workflow

```
Source Input
    ↓
Validation
    ↓
Content Extraction
    ↓
Text Cleaning
    ↓
Text Normalization
    ↓
Chunking
    ↓
Embedding Generation
    ↓
Local Vector Storage
    ↓
Ready for Retrieval
```

At query time: the question is embedded, compared against the selected source's chunk embeddings, the top-k most relevant chunks are assembled into a context package, and the chat model generates an answer constrained to that context, returned alongside the supporting chunk references.

## Project Structure

```
sourcebound/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── schemas/        # source.py, chat.py, common.py
│   │   ├── routes/         # health.py, sources.py, chat.py
│   │   ├── services/       # url_loader, document_loader, text_cleaner,
│   │   │                   # chunker, embeddings, retriever, rag_service, storage
│   │   └── utils/          # validation.py, errors.py
│   ├── data/                # sources.json, chunks.json, embeddings/ (runtime, gitignored)
│   ├── uploads/              # stored uploads (runtime, gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── sources.html
│   ├── source-details.html
│   ├── chat.html
│   ├── settings.html
│   ├── assets/
│   │   ├── css/styles.css
│   │   └── js/  # api.js, app.js, navigation.js, sources.js, chat.js, settings.js, components.js
│   └── README.md
├── tests/
│   ├── test_validation.py
│   ├── test_chunking.py
│   ├── test_storage.py
│   ├── test_retrieval.py
│   └── test_api.py
├── task.md          # full product specification
├── CLAUDE.md         # guidance for Claude Code when working in this repo
├── AGENTS.md         # guidance for AI coding agents generally
├── LICENSE
└── README.md
```

## Environment Setup

Copy the example environment file and fill in your OpenAI API key:

```bash
cd backend
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

`.env` variables:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
BACKEND_URL=http://127.0.0.1:8000
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
TOP_K_RESULTS=5
```

The API key is read on the backend only and is never exposed to the frontend.

## Installation & Running (Windows)

**First-time setup:**

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# edit backend\.env and set OPENAI_API_KEY
```

**One-command start (backend + frontend, single terminal):**

```powershell
.\start-dev.ps1
```

Run this from the project root. It starts the FastAPI backend at `http://127.0.0.1:8000` (docs at `/docs`) and the frontend static server at `http://127.0.0.1:5500/dashboard.html`, streaming both logs into the same terminal. Press `Ctrl+C` to stop both.

**Or run them separately, in two terminals:**

```powershell
# Terminal 1 — backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

```powershell
# Terminal 2 — frontend
cd frontend
python -m http.server 5500
```

Then open `http://127.0.0.1:5500/dashboard.html` in a browser.

### Standard terminal (macOS/Linux)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

```bash
cd frontend
python3 -m http.server 5500
```

## Supported File Formats

| Format | Extension | Notes |
|---|---|---|
| PDF | `.pdf` | Text-based PDFs; scanned/image-only PDFs may extract no text |
| Plain text | `.txt` | UTF-8 |
| Markdown | `.md` | Headings preserved where possible |

Website URLs (`http://` / `https://` only) are also supported as a source type.

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Backend status + app info |
| GET | `/api/sources` | List all sources |
| POST | `/api/sources/url` | Add a website source |
| POST | `/api/sources/upload` | Upload a document source |
| GET | `/api/sources/{source_id}` | Get one source |
| DELETE | `/api/sources/{source_id}` | Delete a source (cascades chunks/embeddings) |
| GET | `/api/sources/{source_id}/status` | Get processing status |
| GET | `/api/sources/{source_id}/chunks` | List a source's chunks |
| POST | `/api/chat` | Ask a question about a source |

Example chat request/response:

```json
POST /api/chat
{
  "source_id": "source_123",
  "message": "What is this website about?",
  "conversation_id": "conversation_123"
}
```

```json
{
  "answer": "The website explains...",
  "source_id": "source_123",
  "references": [
    {
      "chunk_id": "chunk_001",
      "source_title": "Example Website",
      "excerpt": "Relevant source text..."
    }
  ]
}
```

Full interactive docs are available at `http://127.0.0.1:8000/docs` once the backend is running.

## Validation Rules

**URL:** required, valid structure, `http`/`https` only (no `file://`, `javascript:`, `ftp://`), reasonable length, duplicates rejected.

**File:** presence required, extension in `.pdf/.txt/.md`, MIME type checked, size-limited, empty/corrupted files rejected — never trusted by filename/MIME alone.

**Chat:** `source_id` required and must reference an existing, `ready` source; `message` required and length-limited; `conversation_id` optional but validated when provided.

**API:** every endpoint validates with Pydantic and returns structured errors with `400` (invalid input), `404` (missing source), `413` (file too large), `422` (validation error), or `500` (unexpected error) — never a raw stack trace.

## Testing

```bash
cd backend
pip install -r requirements.txt
pip install pytest
pytest ../tests -v
```

All OpenAI calls (embeddings + chat) are mocked in the test suite — a real `OPENAI_API_KEY` is not required to run the tests.

## Known Limitations

- Local JSON/NumPy storage is suited to a single-user, single-machine, modest-scale deployment — not concurrent multi-writer production use.
- No authentication/authorization — intended for local/personal use.
- PDF extraction relies on embedded text; scanned/image-only PDFs are not OCR'd.
- Conversation history is session/local-state based rather than a persisted multi-turn store.

## Future Improvements

- Optional DOCX support.
- Streaming chat responses.
- Multi-source (cross-document) chat.
- Pluggable vector store backend for larger corpora.
- Basic auth for shared/hosted deployments.

## License

MIT — see [LICENSE](./LICENSE).
