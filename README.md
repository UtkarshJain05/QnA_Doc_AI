# QnA Doc AI - Intelligent PDF Assistant (RAG Pipeline)

**QnA Doc AI** is a full-stack, Retrieval-Augmented Generation (RAG) application that allows users to seamlessly upload PDF documents and ask context-aware questions about their contents. It features a modern, interactive frontend designed with React, Tailwind CSS, and Shadcn UI, backed by a robust, highly-integrated FastAPI service in Python.

The backend architecture ensures accurate responses using state-of-the-art embedding models (HuggingFace), semantic search (Supabase pgvector), and large language models (Groq's LLaMA-based models), with resilient fallback parsing for complex scanned PDFs using OCR.

---

## 🏗️ Architecture & Tech Stack

This project is separated into two cleanly divided codebases: a **Frontend Developer Environment** and a **Backend API Service**.

### 📂 Directory Architecture

```text
QnA-Doc-AI
│
├── backend
│   │
│   ├── app
│   │   ├── api
│   │   │   └── routes.py
│   │   │
│   │   ├── services
│   │   │   ├── pdf_processor.py
│   │   │   └── rag_pipeline.py
│   │   │
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── uploads/          # Temporary PDF storage (ignored in git)
│   ├── requirements.txt
│   └── .env
│
├── frontend
│   │
│   ├── public
│   │   ├── favicon.png
│   │   └── robots.txt
│   │
│   ├── src
│   │   ├── components
│   │   ├── hooks
│   │   ├── lib
│   │   ├── pages
│   │   │   ├── UploadPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── NotFound.tsx
│   │   │
│   │   ├── services
│   │   │   └── api.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

### Frontend Stack (Vite + React)

- **Framework:** React 18, bootstrapped with Vite for instant server start and lightning-fast HMR.
- **Styling & UI Components:**
  - Tailwind CSS for utility-first styling.
  - Shadcn UI via Radix UI primitives for accessible, unstyled, and customizable foundational components (buttons, toasts, dialogs, etc.).
- **Icons & Animations:** Lucide React for modern iconography, combined with `tailwindcss-animate` for smooth enter/exit transitions.
- **Routing:** React Router v6 mapping `/` to file uploads and `/chat` to the conversational interface.
- **State Management:** Functional React Hooks (`useState`, `useRef`, `useCallback`) alongside local storage for persistent document sessions across reloads.
- **Package Manager:** `npm` (with explicit package locks).

### Backend Stack (FastAPI + LangChain)

- **Web Framework:** FastAPI with Uvicorn, enabling high-performance async REST APIs and automatic OpenAPI documentation.
- **Document Processing (Hybrid Strategy):**
  - **Primary:** `pypdf` for direct text extraction from digitally generated PDFs.
  - **Fallback OCR:** `pdf2image` and `pytesseract` to parse scanned or image-based PDF pages seamlessly if direct text parsing yields insufficient text.
- **RAG Execution (LangChain framework):**
  - **Chunking:** `RecursiveCharacterTextSplitter` with ~800 character chunks and overlap for context preservation.
  - **Embeddings:** `HuggingFaceEndpointEmbeddings` (specifically utilizing `sentence-transformers/all-MiniLM-L6-v2`) to convert text into fast, dense vector representations.
  - **Database:** Supabase, acting as a cloud Postgres instance utilizing the `pgvector` extension for storing and performing similarity searches (`match_documents` RPC).
  - **LLM Inferencing:** `ChatGroq` utilizing Groq's blazing-fast inference endpoints running `llama-3.3-70b-versatile` under a zero-temperature strict setting.

---

## ⚙️ Core Application Flows

Understanding how data travels through this project is vital for extending its capabilities.

### 1. Document Ingestion Flow (`/upload`)

1. **Frontend Validation:** User selects a PDF on `UploadPage.tsx`. The frontend checks that the file size is under 20MB. If it passes, an ongoing or stale `session_id` is immediately purged.
2. **API Receipt:** FastAPI receives the binary upload in `routes.py`, re-validates the 20MB guard, and temporarily stores the PDF using a generated UUID on the local server disk (`/uploads`).
3. **Extraction & OCR:** The document paths through `extract_text_from_pdf()`. It analyzes pages individually; if text density is low, it spins up Tesseract OCR to read text directly from rendered images.
4. **Chunking & Limit Protection:** `rag_pipeline.py` splits the mass text into small 800-word chunks. To prevent database explosion or cost overruns, it asserts a strict **1500 chunk limit**.
5. **Embedding & Storage:** Chunks are vectorized utilizing HuggingFace and synchronously inserted into a Supabase `documents` table alongside the `session_id` and metadata.
6. **Cleanup:** Python's `finally` block ensures the temporary physical PDF on disk is deleted, resolving potential memory/disk leaks. The frontend is handed back the session UUID and transitions the user to the chat view.

### 2. Conversational Retrieval Flow (`/ask`)

1. **User Prompt Dispatch:** User types a question on `ChatPage.tsx`. The frontend fires a JSON payload containing the `question` and active `session_id` to the `/ask` endpoint.
2. **Greeting Bypass & Similarity Search:** The backend first checks for basic greetings (e.g., "hi"). If not a greeting, the user's string is converted into a vector identical to the document embeddings. It executes the `retrieve_similar()` RPC call to Supabase, filtering strictly by the `session_id`.
3. **Context Injection:** Supabase returns the top N most similar text chunks based on Cosine/Inner Product similarity. These blocks are joined into a massive string context.
4. **Strict Prompting:** A highly opinionated LLM Prompt Template instructs Groq's LLaMA 3.3 to act as "QnA Bot", specifically forbidding the model from relying on generalized knowledge outside of the injected context.
5. **Response Generation:** The generated strict response is logged (utilizing the native `logging` library for safety debugging) and passed back to the frontend to render sequentially in the UI.

### 3. Session Teardown Flow (`/session/{id}`)

- To keep the vector database lean and ensure absolute data privacy, whenever the user clicks "Start Over", uploads a new PDF, or ends the session, the frontend automatically fires a `DELETE` request.
- The backend identifies the active UUID in Supabase and permanently erases all embedded chunks affiliated with that ID.

---

## 🚀 Setup & Local Deployment Guide

To deploy or develop this platform locally, follow these strict execution environments.

### Prerequisites

- Node.js & npm (Frontend).
- Python 3.10+ (Backend).
- Optionally, system installations for Tesseract (e.g., macOS `$ brew install tesseract` or Windows `.exe`) and Poppler for the PDF-to-Image conversions.

### Environment Configurations

You must create a `.env` file located directly in the `/backend` directory matching these requirements:

```env
# 1. Supabase Postgres connection matching your pgvector configuration
SUPABASE_URL=https://[YOUR_INSTANCE].supabase.co
SUPABASE_KEY=ey...[YOUR_SERVICE_KEY]

# 2. Embedding Model Endpoint
HUGGINGFACEHUB_API_TOKEN=hf_...

# 3. Fast LLM Inference
GROQ_API_KEY=gsk_...

# 4. For system environments (Optional, depending on your path variables)
TESSERACT_PATH=/path/to/tesseract
POPPLER_PATH=/path/to/poppler/bin
```

### Starting the Backend Services

1. Open a terminal and navigate to the `/backend` directory.
2. Initialize and activate a localized Python virtual environment:
   - Windows: `python -m venv venv` and `venv\Scripts\activate`
   - Mac/Linux: `python3 -m venv venv` and `source venv/bin/activate`
3. Install strict lockfile dependencies: `pip install -r requirements.txt`
4. Spool up the Uvicorn webserver: `uvicorn app.main:app --reload`
   - _Should broadcast on `http://127.0.0.1:8000`_

### Starting the Frontend UI

1. Open a separate, secondary terminal and navigate to the `/frontend` directory.
2. Cleanly install node modules: `npm install`
3. Spin up the Vite dev server: `npm run dev`
   - _Should map immediately to `http://localhost:5173` or similar. Any changes across `.tsx` components will trigger Hot Module Reloading._

---

## ✅ API Endpoint Reference Map

If you intend to decouple the frontend from the backend, these are the exposed boundaries.

- `POST /upload`: Expects `multipart/form-data` with key `file` (must be `.pdf`). Returns structured JSON containing `session_id` and `chunks_created`.
- `POST /ask`: Expects JSON payload with shape `{ "question": string, "session_id": string }`. Returns `{ "answer": string, "session_id": string }`.
- `DELETE /session/{session_id}`: Standard REST destroy endpoint. Clears corresponding Postgres vectors.

---