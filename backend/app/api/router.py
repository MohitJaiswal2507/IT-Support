from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.knowledge_base import router as kb_router
from app.api.routes.policies import router as policies_router
from app.api.routes.requests import router as requests_router
from app.api.routes.tickets import router as tickets_router

api_router = APIRouter()

# Health check route (GET /health)
api_router.include_router(health_router)

# Phase 1 Data Layer routes
api_router.include_router(kb_router)
api_router.include_router(policies_router)
api_router.include_router(requests_router)
api_router.include_router(tickets_router)
