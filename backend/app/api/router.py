from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.knowledge_base import router as kb_router
from app.api.routes.policies import router as policies_router
from app.api.routes.requests import router as requests_router
from app.api.routes.tickets import router as tickets_router
from app.api.routes.retrieval import router as retrieval_router
from app.api.routes.agent import router as agent_router
from app.api.routes.actions import router as actions_router

api_router = APIRouter()

# Health check route (GET /health)
api_router.include_router(health_router)

# Phase 1 Data Layer routes
api_router.include_router(kb_router)
api_router.include_router(policies_router)
api_router.include_router(requests_router)
api_router.include_router(tickets_router)

# Phase 2 Retrieval / RAG Foundation routes
api_router.include_router(retrieval_router)

# Phase 3 Agent Architecture & Workflow routes
api_router.include_router(agent_router)

# Phase 5 Controlled Action Execution routes
api_router.include_router(actions_router)
