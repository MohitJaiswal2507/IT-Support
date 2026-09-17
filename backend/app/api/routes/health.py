from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check the health and connectivity of the Veridian IT Support Agent backend service."
)
async def get_health() -> HealthResponse:
    """
    Returns the operational status of the service.
    """
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        version=settings.VERSION
    )
