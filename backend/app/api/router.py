from fastapi import APIRouter
from app.api.routes.health import router as health_router

api_router = APIRouter()

# Include health routes at root level (GET /health)
api_router.include_router(health_router)
