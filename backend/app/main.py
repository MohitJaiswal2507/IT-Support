from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.db.database import init_db
from app.db.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handling startup initialization."""
    init_db()
    # Auto-seed if database was just created
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield


app = FastAPI(
    title="Veridian Internal Service Agent - API",
    description="Backend API for the Veridian Internal IT Support Agent (Phase 1 Assignment Data Layer)",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include application routers
app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    """Service root entrypoint providing API metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "phase": "Phase 1 - Assignment Data Layer",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "knowledge_base": "/api/knowledge-base",
            "policies": "/api/policies",
            "requests": "/api/requests",
            "tickets": "/api/tickets",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
