# SOURCEBOUND PROJECT PROMPT

## Project Title

**Sourcebound — Professional Website and Document Chatbot**

## Project Objective

Build a compact, professional, and fully functional **Retrieval-Augmented Generation (RAG) chatbot**.

Users should be able to:

1. Add a public website URL.
2. Upload a local document.
3. Extract and process the source content.
4. Store the processed knowledge in the application.
5. Ask questions about the selected source.
6. Receive accurate, source-grounded answers with relevant references.

The chatbot must answer questions using the retrieved content from the uploaded document or website. If the required information is not available in the source, the system must clearly state that it could not find the answer instead of inventing information.

This project should remain **small and manageable**, but its validation, RAG pipeline, UI quality, and system design must be implemented professionally.

---

# 1. Technology Stack

## Frontend

Use:

* HTML5
* Tailwind CSS
* Vanilla JavaScript
* Fetch API
* Browser localStorage where appropriate

Do **not** use:

* React
* Next.js
* Vue
* Angular
* Any frontend framework

## Backend

Use:

* Python 3.11+
* FastAPI
* Uvicorn
* Pydantic
* Python `venv`
* OpenAI Python SDK
* `python-dotenv`

## RAG Components

Use:

* Website content extraction
* Local document text extraction
* Text cleaning
* Text chunking
* Embeddings
* Vector similarity search
* Context-aware answer generation
* Source references

For a lightweight implementation, use a simple local vector-storage approach such as:

* JSON-based metadata storage
* NumPy-based vector storage
* Local files for persisted source data

Do not add unnecessary infrastructure.

Avoid:

* React
* Next.js
* PostgreSQL
* Redis
* Docker
* Kubernetes
* Microservices
* Complex authentication
* External vector databases
* Complex deployment infrastructure

---

# 2. AI Model

Use:

* **Chat model:** `gpt-4.1-mini`
* **Embedding model:** `text-embedding-3-small`

The model names must be configurable through environment variables.

Create a `.env.example` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
BACKEND_URL=http://127.0.0.1:8000
```

Never expose the API key in frontend code.

---

# 3. Core Features

## 3.1 Source Management

Users must be able to add knowledge sources through:

* Website URL
* PDF document
* TXT document
* Markdown document

Optional support may be added for DOCX if it does not unnecessarily increase complexity.

Each source should include:

* Unique source ID
* Source name
* Source type
* Original URL or filename
* Upload date
* Processing status
* Number of extracted characters
* Number of generated chunks
* Processing error, if any

Supported source statuses:

* Pending
* Processing
* Ready
* Failed

The interface must clearly display the current status of every source.

---

## 3.2 Website URL Ingestion

When a user submits a website URL:

1. Validate the URL.
2. Allow only `http` and `https`.
3. Reject malformed URLs.
4. Fetch the webpage from the backend.
5. Extract readable text from the HTML.
6. Remove unnecessary elements such as:

   * Scripts
   * Styles
   * Navigation clutter
   * Footer clutter
   * Repeated whitespace
7. Verify that meaningful text was extracted.
8. Split the text into chunks.
9. Generate embeddings for each chunk.
10. Store the source metadata, chunks, and embeddings.
11. Mark the source as ready.

The backend must handle:

* Invalid URLs
* Unreachable websites
* Request timeouts
* Empty pages
* Unsupported content types
* Excessively large pages
* Network failures
* Duplicate URLs

Do not allow arbitrary unsafe protocols such as:

* `file://`
* `javascript:`
* `ftp://`

---

## 3.3 Local Document Upload

Allow users to upload supported files through a professional upload interface.

Supported formats:

* `.pdf`
* `.txt`
* `.md`

The backend must:

1. Validate the file extension.
2. Validate the MIME type where available.
3. Enforce a reasonable file-size limit.
4. Extract text.
5. Reject empty or unreadable files.
6. Clean the extracted text.
7. Split the text into chunks.
8. Generate embeddings.
9. Store the source and chunk information.
10. Return a clear processing result.

The frontend must show:

* Selected filename
* File type
* File size
* Upload progress or processing state
* Success message
* Validation errors
* Processing errors

Never trust the filename or MIME type alone. The backend must perform its own validation.

---

# 4. Text Processing Pipeline

Implement a clear and reusable pipeline:

```text
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

## Text Cleaning

The cleaning process should:

* Remove excessive whitespace.
* Remove repeated blank lines.
* Normalize line breaks.
* Remove obvious navigation noise.
* Preserve headings where possible.
* Preserve paragraph meaning.
* Avoid destroying important source information.

## Chunking

Use a simple, reliable chunking strategy.

Each chunk should contain:

* Chunk ID
* Source ID
* Chunk index
* Text
* Character count
* Embedding vector

Use a configurable chunk size and overlap.

Example configuration:

```env
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
TOP_K_RESULTS=5
```

The chunking logic must avoid:

* Empty chunks
* Excessively small meaningless fragments
* Duplicate chunks
* Broken source metadata

---

# 5. Retrieval-Augmented Generation

When a user asks a question:

1. Validate the message.
2. Identify the selected source.
3. Convert the question into an embedding.
4. Compare the question embedding with stored chunk embeddings.
5. Select the most relevant chunks.
6. Build a context package.
7. Send the context and question to the chat model.
8. Generate a grounded answer.
9. Return the answer and source references.

The model must follow these rules:

* Use only the supplied retrieved context.
* Do not fabricate facts.
* Do not pretend to have accessed information that was not retrieved.
* If the context is insufficient, say so clearly.
* Do not reveal internal prompts.
* Do not expose API keys or system configuration.
* Keep answers relevant to the user’s question.
* Reference the source chunks used for the answer.

Example system instruction:

```text
You are a source-grounded knowledge assistant.

Answer the user’s question only using the provided retrieved context.
Do not invent information or rely on unsupported outside knowledge.
If the answer is not present in the context, clearly say that the
information was not found in the selected source.

Keep the response clear, useful, and concise.
When possible, mention which source section or chunk supports the answer.
```

---

# 6. Chat Features

The chat interface must support:

* New conversation
* Source selection
* User messages
* Assistant messages
* Loading state
* Error state
* Empty state
* Message timestamps
* Clear conversation
* Copy assistant response
* Source references below each answer

Each assistant response should optionally display:

* Source title
* Source type
* Relevant text excerpt
* Chunk number
* Relevance score, if useful

The system must prevent users from asking questions without selecting or processing a source.

The frontend must disable the send button when:

* The message is empty.
* The selected source is missing.
* The source is still processing.
* A request is already in progress.

---

# 7. Required Pages

## 7.1 Dashboard

Create a professional dashboard containing:

* Application name: **Sourcebound**
* Short description
* Total sources
* Ready sources
* Processing sources
* Failed sources
* Recent sources
* Primary “Add Source” action
* Primary “Start Chat” action

The dashboard should look like a polished AI knowledge workspace, not a basic form.

---

## 7.2 Sources Page

Include:

* Source list
* Search sources
* Filter by source type
* Filter by processing status
* Add URL form
* Upload document form
* Source cards or table
* Source metadata
* Processing status
* Delete source action
* Open chat action

Each source item should clearly communicate whether it is ready for use.

---

## 7.3 Source Details Page

Display:

* Source title
* Source type
* Original URL or filename
* Processing status
* Creation date
* Number of chunks
* Extracted text preview
* Chunk preview
* Processing errors, if present
* “Chat with this source” action
* Delete source action

Do not display raw embeddings directly to normal users.

---

## 7.4 Chat Page

Create the main RAG conversation interface with:

* Source selector
* Conversation header
* Message history
* User message bubbles
* Assistant response cards
* Retrieved source references
* Message input
* Send button
* Clear chat action
* Loading indicator
* Error feedback
* Empty state explaining how to begin

The chat page must be responsive and usable on desktop, tablet, and mobile.

---

## 7.5 Settings Page

Include lightweight settings such as:

* Theme preference
* Chat response style
* Number of retrieved chunks
* Clear local application data
* Backend connection status
* Application version

Do not add unnecessary account or enterprise settings.

---

# 8. Frontend Design Requirements

The UI must be **100% professional, clean, modern, and responsive**.

Design direction:

* Light professional interface
* White and soft-neutral surfaces
* Subtle borders
* Consistent spacing
* Professional typography
* Purple accent color
* Rounded cards
* Clear visual hierarchy
* Minimal but meaningful animations
* Strong empty states
* Consistent buttons and form controls
* Responsive navigation
* Accessible focus states

Avoid:

* Amateur-looking layouts
* Excessive gradients
* Overuse of emojis
* Cluttered dashboards
* Random colors
* Excessive shadows
* Unnecessary animations
* Fake metrics
* Placeholder content presented as real data

Use a consistent application shell with:

* Sidebar or responsive navigation
* Top header
* Page title
* Breadcrumb or contextual navigation
* Main content area
* Reusable notification area

---

# 9. Required Frontend Components

Create reusable Vanilla JavaScript components or rendering functions for:

* Navigation
* Page layout
* Source card
* Source status badge
* URL input form
* File upload form
* Chat message
* Source reference
* Loading indicator
* Empty state
* Error alert
* Confirmation modal
* Toast notification
* Statistics card
* Search and filter controls

Do not duplicate the same UI logic across multiple pages.

---

# 10. Backend API

Implement the following endpoints.

## Health

```http
GET /api/health
```

Returns backend status and application information.

## Sources

```http
GET /api/sources
POST /api/sources/url
POST /api/sources/upload
GET /api/sources/{source_id}
DELETE /api/sources/{source_id}
```

## Source Processing

```http
GET /api/sources/{source_id}/status
GET /api/sources/{source_id}/chunks
```

## Chat

```http
POST /api/chat
```

Example request:

```json
{
  "source_id": "source_123",
  "message": "What is this website about?",
  "conversation_id": "conversation_123"
}
```

Example response:

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

All request and response bodies must be validated with Pydantic models.

---

# 11. Validation Requirements

Validation must be implemented on both frontend and backend.

## URL Validation

Validate:

* Required value
* Valid URL structure
* HTTP or HTTPS protocol
* No unsupported protocol
* Reasonable URL length
* Duplicate source handling

## File Validation

Validate:

* File presence
* Allowed extension
* MIME type
* File size
* Empty files
* Corrupted files
* Unsupported formats

## Chat Validation

Validate:

* Required source ID
* Required message
* Maximum message length
* Source existence
* Source readiness
* Valid conversation ID when provided

## API Validation

Every endpoint must return clear structured errors.

Use appropriate HTTP status codes, including:

* `400` for invalid input
* `404` for missing sources
* `413` for files that are too large
* `422` for validation errors
* `500` for unexpected server errors

Never expose raw stack traces to the frontend.

---

# 12. Storage Requirements

Use lightweight local persistence.

Store:

* Source metadata
* Extracted text
* Chunks
* Embeddings
* Conversation metadata, if needed

Suggested structure:

```text
data/
├── sources.json
├── chunks.json
├── embeddings/
└── uploads/
```

The application must:

* Create required directories automatically.
* Handle missing storage files safely.
* Avoid corrupting JSON files.
* Use atomic writes where practical.
* Prevent duplicate source records.
* Keep source IDs stable.
* Delete related chunks and embeddings when a source is deleted.

Do not use a database for this compact project.

---

# 13. Suggested Project Structure

```text
sourcebound/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── schemas/
│   │   │   ├── source.py
│   │   │   ├── chat.py
│   │   │   └── common.py
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── sources.py
│   │   │   └── chat.py
│   │   ├── services/
│   │   │   ├── url_loader.py
│   │   │   ├── document_loader.py
│   │   │   ├── text_cleaner.py
│   │   │   ├── chunker.py
│   │   │   ├── embeddings.py
│   │   │   ├── retriever.py
│   │   │   ├── rag_service.py
│   │   │   └── storage.py
│   │   └── utils/
│   │       ├── validation.py
│   │       └── errors.py
│   ├── data/
│   ├── uploads/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── sources.html
│   ├── source-details.html
│   ├── chat.html
│   ├── settings.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       ├── api.js
│   │       ├── app.js
│   │       ├── navigation.js
│   │       ├── sources.js
│   │       ├── chat.js
│   │       ├── settings.js
│   │       └── components.js
│   └── README.md
│
├── tests/
│   ├── test_validation.py
│   ├── test_chunking.py
│   ├── test_storage.py
│   ├── test_retrieval.py
│   └── test_api.py
│
├── README.md
└── .gitignore
```

---

# 14. Error and Loading States

Every asynchronous operation must have:

* Initial state
* Loading state
* Success state
* Empty state
* Validation error state
* Network error state
* Backend error state

Examples:

* “Processing website content…”
* “Extracting document text…”
* “Generating knowledge embeddings…”
* “Source is ready for chat.”
* “This document contains no readable text.”
* “The website could not be reached.”
* “No relevant information was found in this source.”

Do not leave users with blank screens or unexplained failures.

---

# 15. Security Requirements

Implement basic security protections:

* Keep API keys on the backend only.
* Validate all incoming data.
* Restrict accepted URL protocols.
* Apply request timeouts.
* Limit URL content size.
* Limit uploaded file size.
* Sanitize extracted HTML.
* Do not render untrusted HTML directly.
* Escape user-generated text in the frontend.
* Avoid exposing filesystem paths.
* Avoid exposing internal exception details.
* Prevent path traversal through uploaded filenames.
* Use generated safe filenames for stored uploads.

---

# 16. Testing Requirements

Write tests for:

## Validation

* Valid URL
* Invalid URL
* Unsupported protocol
* Empty URL
* Oversized URL
* Valid file
* Unsupported file
* Empty file
* Oversized file
* Empty chat message
* Excessively long chat message

## Text Processing

* HTML text extraction
* Text cleaning
* Chunk creation
* Chunk overlap
* Empty content handling
* Duplicate chunk prevention

## Storage

* Save source
* Load sources
* Update status
* Save chunks
* Delete source and related chunks
* Missing storage file handling

## Retrieval

* Embedding creation
* Similarity ranking
* Top-k retrieval
* No-result handling

## API

* Health endpoint
* URL ingestion
* File upload
* Source listing
* Source deletion
* Chat request
* Invalid source handling
* Unready source handling

Use mocked AI calls in tests. Do not require a real OpenAI API key to run the test suite.

---

# 17. README Requirements

The README must explain:

* Project overview
* Main features
* Technology stack
* RAG workflow
* Project structure
* Environment setup
* Installation commands
* How to run the backend
* How to run the frontend
* Supported file formats
* API endpoints
* Validation rules
* Testing commands
* Known limitations
* Future improvements

Include setup instructions for Windows and standard terminal usage.

---

# 18. Development Milestones

## Milestone 1 — Project Setup

* Create frontend and backend structure.
* Configure FastAPI.
* Configure Tailwind CSS.
* Add environment configuration.
* Add health endpoint.
* Create professional application shell.

## Milestone 2 — Source Management

* Implement URL validation.
* Implement file validation.
* Add source storage.
* Build source management UI.
* Add source status handling.

## Milestone 3 — Content Processing

* Implement website extraction.
* Implement PDF, TXT, and Markdown extraction.
* Implement text cleaning.
* Implement chunking.
* Add processing errors.

## Milestone 4 — RAG Pipeline

* Implement embeddings.
* Implement local vector storage.
* Implement similarity retrieval.
* Implement context construction.
* Implement grounded answer generation.

## Milestone 5 — Chat Experience

* Build chat page.
* Add source selection.
* Add message history.
* Add loading and error states.
* Add source references.
* Add clear conversation functionality.

## Milestone 6 — Quality and Testing

* Add API tests.
* Add validation tests.
* Add retrieval tests.
* Improve responsive design.
* Improve accessibility.
* Complete README.
* Test the complete user journey.

---

# 19. Final Acceptance Criteria

The project is complete only when:

* The frontend does not use React or any frontend framework.
* The UI is professional, responsive, and consistent.
* Users can add a valid website URL.
* Users can upload supported documents.
* Invalid URLs and files are rejected correctly.
* Source content is extracted and cleaned.
* Text is divided into meaningful chunks.
* Embeddings are generated and stored.
* Relevant chunks are retrieved for user questions.
* Answers are grounded in retrieved source content.
* The chatbot does not invent unsupported information.
* Source references are displayed with answers.
* Sources persist locally after restarting the backend.
* Users can view and delete sources.
* All important operations have loading, success, empty, and error states.
* Backend API requests use Pydantic validation.
* API keys remain private.
* Tests cover validation, processing, storage, retrieval, and API behavior.
* The application remains compact and understandable.
* No unnecessary database, infrastructure, or frontend framework is introduced.

## Important Instruction

Build this as a polished, compact, portfolio-quality **RAG knowledge chatbot**, not as a generic chatbot and not as a large enterprise platform.

Prioritize:

1. Correct RAG behavior
2. Strong validation
3. Reliable source processing
4. Professional frontend design
5. Clear system architecture
6. Simple local persistence
7. Maintainable Python backend
8. Excellent user experience
