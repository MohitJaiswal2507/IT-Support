from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(
    title="Veridian Internal Service Agent - API",
    description="Backend API for the Veridian Internal IT Support Agent (Phase 0 Foundation)",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
# Allow frontend development servers to communicate with backend
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
        "phase": "Phase 0 - Project Foundation",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
