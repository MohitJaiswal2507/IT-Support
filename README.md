# Veridian — Internal IT Support Agent

> An AI-powered internal IT support agent for the fictional company **Veridian**, built as a multi-phase internship assignment. The agent answers employee IT questions, retrieves relevant knowledge, classifies intent, makes policy-grounded decisions, executes controlled IT actions, and generates auditable LLM responses — all through a clean administrative dashboard.

---

## Table of Contents

1. [What is Veridian?](#1-what-is-veridian)
2. [System Architecture](#2-system-architecture)
3. [Complete Request & Data Flow](#3-complete-request--data-flow)
4. [Technology Stack](#4-technology-stack)
5. [Project Folder Structure](#5-project-folder-structure)
6. [Prerequisites](#6-prerequisites)
7. [Environment Variables](#7-environment-variables)
8. [Local Setup Instructions](#8-local-setup-instructions)
9. [Running the Backend](#9-running-the-backend)
10. [Running the Frontend](#10-running-the-frontend)
11. [Building the Retrieval Index](#11-building-the-retrieval-index)
12. [API Reference](#12-api-reference)
13. [Agent Pipeline](#13-agent-pipeline)
14. [Frontend Views](#14-frontend-views)
15. [Phase Completion Reports](#15-phase-completion-reports)

---

## 1. What is Veridian?

**Veridian** is an internal IT support agent that replaces a traditional helpdesk ticketing system. Employees submit queries in natural language; the agent classifies their intent, retrieves relevant knowledge base articles, policies, and historical tickets using semantic search, makes a grounded decision (resolve / escalate / clarify), and generates an auditable response powered by an LLM.

Key characteristics:

- **Deterministic core** — every step (classification, retrieval, decision) is rule-based and auditable before the LLM layer runs.
- **RAG-powered** — a FAISS vector index over knowledge base articles, IT policies, and historical tickets gives the LLM grounded, traceable context.
- **Controlled action layer** — the agent can create support tickets and submit IT action requests (e.g., password resets, software installs) on behalf of employees, each with an approval workflow.
- **Admin dashboard** — a Next.js SPA gives IT admins visibility into agent interactions, tickets, requests, policies, assets, and pending action approvals.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js Frontend                │
│  (Single-Page App — TypeScript + TailwindCSS)│
│                                             │
│  Dashboard · Agent · Tickets · Requests     │
│  Knowledge · Policies · Assets · Actions    │
└────────────────────┬────────────────────────┘
                     │  HTTP (REST JSON)
                     ▼
┌─────────────────────────────────────────────┐
│           FastAPI Backend (Python)           │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │          Agent Workflow              │   │
│  │  Understanding → Classify → Retrieve │   │
│  │  → Decide → LLM Generate → Action   │   │
│  └────────────────┬─────────────────────┘   │
│                   │                         │
│  ┌────────────────▼─────────────────────┐   │
│  │   Retrieval Layer (RAG)              │   │
│  │   FAISS Vector Index                 │   │
│  │   all-MiniLM-L6-v2 Embeddings        │   │
│  └────────────────┬─────────────────────┘   │
│                   │                         │
│  ┌────────────────▼─────────────────────┐   │
│  │   SQLite Database (SQLAlchemy ORM)   │   │
│  │   Knowledge Base · Policies          │   │
│  │   Tickets · Requests · Assets        │   │
│  └──────────────────────────────────────┘   │
│                   │                         │
│  ┌────────────────▼─────────────────────┐   │
│  │   OpenAI GPT-4o-mini (LLM Layer)     │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 3. Complete Request & Data Flow

```
Employee Query
     │
     ▼
[1] Request Understanding
    - Normalize & sanitize query text
    - Detect empty / unusable input → early clarification
    - Detect underspecified query (single keyword, no context)

     │
     ▼
[2] Intent Classification
    - Rule-based keyword + pattern matching
    - Categories: PASSWORD_RESET · SOFTWARE_REQUEST · HARDWARE_ISSUE
                  NETWORK_ISSUE · ACCOUNT_ACCESS · POLICY_INQUIRY
                  GENERAL_IT · UNKNOWN
    - Returns: intent, confidence score, reasoning string

     │
     ▼
[3] Early Clarification Check
    - If underspecified → ClarificationManager generates context-aware question
    - LLM layer refines clarification response
    - Returns early (no retrieval or decision needed)

     │
     ▼
[4] Retrieval (RAG)
    - Query is embedded with all-MiniLM-L6-v2 (SentenceTransformers)
    - FAISS top-K=5 nearest neighbour search across:
        • Knowledge Base articles
        • IT Policy documents
        • Historical resolved tickets
    - Results grouped into: policy · knowledge · ticket_history

     │
     ▼
[5] Decision Engine
    - Evaluates: intent confidence, policy evidence, retrieval success
    - Output: RESOLVE · ESCALATE · CLARIFY

     │
     ▼
[6] Deterministic Response Generation
    - Builds a structured base response from evidence and decision
    - Used as fallback if LLM call fails

     │
     ▼
[7] LLM Response Generation (OpenAI GPT-4o-mini)
    - System prompt enforces grounded, policy-cited response
    - Context includes retrieved chunks + decision
    - Falls back to deterministic response on error

     │
     ▼
[8] Action Execution (Optional)
    - ActionDetector checks query for actionable intent
    - Supported actions: CREATE_TICKET · PASSWORD_RESET
                         SOFTWARE_INSTALL · HARDWARE_REQUEST
    - High-risk actions → PENDING_APPROVAL status
    - Low-risk actions → COMPLETED immediately
    - Audit note appended to response

     │
     ▼
AgentState returned to frontend
(response · intent · confidence · sources · action · decision)
```

---

## 4. Technology Stack

### Backend

| Component | Technology |
|-----------|-----------|
| API Framework | FastAPI >= 0.115 |
| ASGI Server | Uvicorn |
| ORM | SQLAlchemy >= 2.0 |
| Database | SQLite (veridian.db) |
| Data Validation | Pydantic >= 2.9 / pydantic-settings |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector Search | FAISS (faiss-cpu >= 1.8) |
| LLM | OpenAI API (gpt-4o-mini) |
| HTTP Client | httpx |
| Testing | pytest |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS v4 |
| UI Icons | lucide-react |
| Class Utilities | clsx, tailwind-merge |
| Runtime | React 19 |

---

## 5. Project Folder Structure

```
IT-Support/
├── .env                          # Root env (NEXT_PUBLIC_API_URL)
├── .env.example                  # Root env template
├── .gitignore
├── run.bat                       # Windows one-click dev launcher
├── veridian.db                   # SQLite database (root copy)
│
├── backend/
│   ├── .env.example              # Backend env template
│   ├── main.py                   # Uvicorn entrypoint (local dev)
│   ├── vercel.json               # Vercel routing config
│   ├── requirements.txt          # Python dependencies
│   ├── pytest.ini
│   ├── veridian.db               # SQLite database (backend copy)
│   │
│   ├── api/
│   │   └── index.py              # Vercel serverless entrypoint
│   │
│   ├── data/                     # Source JSON seed files
│   │   ├── knowledge_base.json
│   │   ├── policies.json
│   │   └── tickets.json
│   │
│   ├── storage/
│   │   └── vector_store/         # Persisted FAISS index files
│   │       ├── index.faiss
│   │       └── metadata.pkl
│   │
│   ├── app/
│   │   ├── main.py               # FastAPI app + CORS + lifespan
│   │   ├── __init__.py
│   │   │
│   │   ├── core/
│   │   │   └── config.py         # Pydantic settings (env vars)
│   │   │
│   │   ├── db/
│   │   │   ├── database.py       # SQLAlchemy engine + session
│   │   │   ├── models.py         # ORM models
│   │   │   └── seed.py           # Database seeder
│   │   │
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   │
│   │   ├── api/
│   │   │   ├── router.py         # API prefix router
│   │   │   └── routes/
│   │   │       ├── health.py
│   │   │       ├── knowledge_base.py
│   │   │       ├── policies.py
│   │   │       ├── requests.py
│   │   │       ├── tickets.py
│   │   │       ├── retrieval.py
│   │   │       ├── agent.py
│   │   │       └── actions.py
│   │   │
│   │   ├── retrieval/
│   │   │   ├── documents.py      # Document loader (DB + JSON)
│   │   │   ├── chunker.py        # Deterministic text chunker
│   │   │   ├── embeddings.py     # SentenceTransformer manager
│   │   │   ├── vector_store.py   # FAISS index wrapper
│   │   │   ├── service.py        # Retrieval service (query -> chunks)
│   │   │   └── build_index.py    # Index build script
│   │   │
│   │   ├── agent/
│   │   │   ├── state.py          # AgentState dataclass
│   │   │   ├── understanding.py  # Query normalization
│   │   │   ├── classifier.py     # Intent classifier
│   │   │   ├── clarification.py  # Clarification question generator
│   │   │   ├── evidence.py       # Retrieval -> GroupedEvidence
│   │   │   ├── decision.py       # Decision engine (RESOLVE/ESCALATE/CLARIFY)
│   │   │   ├── policy.py         # Policy checker
│   │   │   ├── response.py       # Deterministic response generator
│   │   │   ├── tickets.py        # Ticket creation helper
│   │   │   └── workflow.py       # Main AgentWorkflow orchestrator
│   │   │
│   │   ├── llm/
│   │   │   └── generator.py      # OpenAI GPT-4o-mini response layer
│   │   │
│   │   ├── actions/
│   │   │   ├── detector.py       # Action intent detector
│   │   │   └── service.py        # Action executor + approval logic
│   │   │
│   │   └── tools/                # Utility helpers
│   │
│   └── tests/                    # pytest test suite (71 tests)
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env.local                # Active frontend env
│   │
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        # Root layout + metadata
│       │   ├── page.tsx          # SPA root (view router)
│       │   └── globals.css
│       │
│       ├── components/
│       │   ├── layout/           # AppShell, Sidebar, Header
│       │   ├── dashboard/        # DashboardView, StatusCard, MetricsCard
│       │   ├── agent/            # AgentWorkspaceView, AgentQueryCard
│       │   ├── tickets/          # TicketsView
│       │   ├── requests/         # RequestsView
│       │   ├── knowledge/        # KnowledgeBaseView
│       │   ├── policies/         # PoliciesView
│       │   ├── assets/           # AssetsView
│       │   ├── actions/          # ActionRequestsView
│       │   ├── activity/         # ActivityView
│       │   ├── settings/         # SettingsView
│       │   └── ui/               # Shared primitives (buttons, badges, etc.)
│       │
│       └── lib/
│           └── api.ts            # Typed API client (all backend calls)
│
└── docs/
    ├── Phase_0.md ... Phase_6.md             # Assignment specification docs
    └── phase-*-completion-report.md          # Phase completion reports
```

---

## 6. Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | >= 3.11 |
| Node.js | >= 18 |
| npm | >= 9 |
| Git | any recent version |

> **Windows users**: `run.bat` in the project root automates all setup and launch steps.

---

## 7. Environment Variables

### Root `.env` (frontend URL used by Next.js)

Create `.env` at the project root (or copy from `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### `backend/.env` (backend settings)

Create `backend/.env` (or copy from `backend/.env.example`):

```env
# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# Database (SQLite by default)
DATABASE_URL=sqlite:///./veridian.db

# CORS (comma-separated allowed origins)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Service identity
PROJECT_NAME=veridian-it-support-agent

# LLM (required for AI responses)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4o-mini
```

### `frontend/.env.local` (Next.js client)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Note**: Without `OPENAI_API_KEY`, the agent falls back to the deterministic response generator and still functions — it just will not use LLM-generated prose.

---

## 8. Local Setup Instructions

### Option A — Windows One-Click Launcher

```bat
run.bat
```

This script automatically:
1. Creates `backend/.venv` if it does not exist
2. Installs Python dependencies
3. Copies `frontend/.env.example` to `frontend/.env.local` if needed
4. Installs npm dependencies
5. Launches both servers in separate terminal windows

### Option B — Manual Setup

**1. Clone the repository**

```bash
git clone https://github.com/MohitJaiswal2507/IT-Support.git
cd IT-Support
```

**2. Set up the backend**

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Copy and configure environment variables:

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

**3. Set up the frontend**

```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port
```

---

## 9. Running the Backend

From the `backend/` directory with the virtual environment activated:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will:
- Initialize the SQLite database and run migrations on first start
- Auto-seed knowledge base, policies, and ticket data if empty
- Serve the API at `http://127.0.0.1:8000`
- Serve interactive Swagger docs at `http://127.0.0.1:8000/docs`
- Serve ReDoc at `http://127.0.0.1:8000/redoc`

**Health check:**

```bash
curl http://127.0.0.1:8000/health
```

---

## 10. Running the Frontend

From the `frontend/` directory:

```bash
npm run dev
```

The Next.js dev server will be available at `http://localhost:3000`.

Make sure `NEXT_PUBLIC_API_URL` in `frontend/.env.local` points to the running backend.

---

## 11. Building the Retrieval Index

The FAISS vector index is pre-built and committed to the repository at `backend/storage/vector_store/`. In most cases you do **not** need to rebuild it.

To rebuild the index (e.g., after adding new knowledge base articles or policies):

```bash
# From backend/ with venv activated
python -m app.retrieval.build_index
```

This script:
1. Loads all documents from the SQLite database (with JSON fallback)
2. Chunks documents deterministically (max 600 chars, 100-char overlap)
3. Embeds chunks with `all-MiniLM-L6-v2` (384-dimensional vectors)
4. Builds and saves the FAISS flat-L2 index to `backend/storage/vector_store/`

> **First run downloads the embedding model** (~90 MB). Subsequent runs use the cached model from `~/.cache/huggingface/`.

---

## 12. API Reference

All endpoints are prefixed with `/api`. Full interactive docs at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/api/knowledge-base` | List knowledge base articles |
| `GET` | `/api/knowledge-base/{id}` | Get single KB article |
| `GET` | `/api/policies` | List IT policies |
| `GET` | `/api/policies/{id}` | Get single policy |
| `GET` | `/api/requests` | List employee IT requests |
| `POST` | `/api/requests` | Create new IT request |
| `GET` | `/api/tickets` | List support tickets |
| `GET` | `/api/tickets/{id}` | Get single ticket |
| `POST` | `/api/retrieval/search` | Semantic search (RAG query) |
| `GET` | `/api/retrieval/status` | Vector index status |
| `POST` | `/api/agent/query` | Submit query to agent |
| `GET` | `/api/actions` | List IT action requests |
| `POST` | `/api/actions/{id}/approve` | Approve a pending action |
| `POST` | `/api/actions/{id}/reject` | Reject a pending action |

### Agent Query — Request / Response

**POST** `/api/agent/query`

```json
// Request
{
  "query": "I forgot my VPN password, how do I reset it?"
}
```

```json
// Response
{
  "response": "For VPN password resets, please...",
  "intent": "PASSWORD_RESET",
  "confidence": 0.95,
  "decision": "RESOLVE",
  "response_source": "llm_grounded",
  "clarification_required": false,
  "clarification_question": null,
  "relevant_source_ids": ["kb-001", "pol-003"],
  "action": null
}
```

---

## 13. Agent Pipeline

The `AgentWorkflow` class in `backend/app/agent/workflow.py` orchestrates the following 8-step pipeline on every query:

| Step | Module | Description |
|------|--------|-------------|
| 1 | `understanding.py` | Normalize query, detect empty/unusable input |
| 2 | `classifier.py` | Rule-based intent classification with confidence |
| 3 | `clarification.py` | Generate clarification if query is underspecified |
| 4 | `evidence.py` + Retrieval | FAISS top-5 semantic search, group by type |
| 5 | `decision.py` | Decision engine: RESOLVE / ESCALATE / CLARIFY |
| 6 | `response.py` | Deterministic structured response (fallback) |
| 7 | `llm/generator.py` | OpenAI GPT-4o-mini grounded response |
| 8 | `actions/detector.py` + `service.py` | Detect and execute controlled IT actions |

### Intent Categories

| Intent | Description |
|--------|-------------|
| `PASSWORD_RESET` | Password or authentication issues |
| `SOFTWARE_REQUEST` | Software install, license, or access |
| `HARDWARE_ISSUE` | Physical device or peripheral problems |
| `NETWORK_ISSUE` | Connectivity, VPN, Wi-Fi issues |
| `ACCOUNT_ACCESS` | Account lock, permissions, MFA |
| `POLICY_INQUIRY` | Questions about IT policies |
| `GENERAL_IT` | General IT support questions |
| `UNKNOWN` | Unclassifiable — triggers clarification |

### Action Types

| Action | Approval Required |
|--------|------------------|
| `CREATE_TICKET` | No — auto-completed |
| `PASSWORD_RESET` | No — auto-completed |
| `SOFTWARE_INSTALL` | Yes — pending approval |
| `HARDWARE_REQUEST` | Yes — pending approval |

---

## 14. Frontend Views

The Next.js SPA is a single page (`src/app/page.tsx`) that renders one of the following views based on sidebar navigation:

| View | Route Key | Description |
|------|-----------|-------------|
| Dashboard | `dashboard` | System status, quick metrics, recent activity |
| Agent Workspace | `agent` | Chat interface for submitting queries |
| Tickets | `tickets` | Browse and filter support tickets |
| Requests | `requests` | Employee IT request history |
| Knowledge Base | `knowledge` | Browse KB articles |
| Policies | `policies` | Browse IT policies |
| Assets | `assets` | Hardware/software asset inventory |
| Action Requests | `actions` | Approve or reject pending IT actions |
| Activity | `activity` | Audit log of agent interactions |
| Settings | `settings` | Configuration panel |

All backend calls are centralized in `frontend/src/lib/api.ts`, which reads `NEXT_PUBLIC_API_URL` from the environment.

---

## 15. Phase Completion Reports

This project was built in 7 phases. Detailed completion reports for each phase live in `docs/`:

| Phase | Branch | Report | Description |
|-------|--------|--------|-------------|
| 0 | `phase-0-foundation` | — | Project scaffold, DB schema, seed data |
| 1 | `phase-1-data-layer` | — | FastAPI data APIs, Pydantic schemas |
| 2 | `phase-2-retrieval` | [phase-2-completion-report.md](docs/phase-2-completion-report.md) | FAISS RAG layer |
| 3 | `phase-3-agent-core` | [phase-3-completion-report.md](docs/phase-3-completion-report.md) | Agent workflow, classifier, decision engine |
| 4 | `phase-4-llm` | [phase-4-completion-report.md](docs/phase-4-completion-report.md) | OpenAI LLM integration |
| 5 | `phase-5-actions` | [phase-5-completion-report.md](docs/phase-5-completion-report.md) | Controlled IT action execution |
| 6 | `phase-6-frontend` | [phase-6-completion-report.md](docs/phase-6-completion-report.md) | Next.js admin dashboard |

---

## License

This project is an academic internship assignment for educational purposes.
