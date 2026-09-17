# Veridian Internal Service Agent - Backend

FastAPI backend service for the Veridian Internal IT Support Agent.

## Phase 0 Scope
Phase 0 establishes the backend application foundation, CORS policies, settings configuration, and health monitoring endpoints.

## Project Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   └── health.py    # Health check endpoint (GET /health)
│   │   └── router.py        # Top-level API router
│   ├── core/
│   │   └── config.py        # Pydantic Settings & environment variables
│   ├── schemas/
│   │   └── health.py        # Pydantic response models
│   ├── __init__.py
│   └── main.py              # Application entrypoint & CORS setup
├── .env.example             # Example environment variables
├── requirements.txt         # Phase 0 dependencies
└── README.md
```

## Setup & Running Locally

### 1. Create Virtual Environment
```bash
# From backend directory
python -m venv .venv

# Activate on Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate on macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
```

### 4. Run the Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- Root: `http://localhost:8000/`
- Health: `http://localhost:8000/health`
- Interactive API Docs: `http://localhost:8000/docs`
