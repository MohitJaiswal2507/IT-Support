from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="ok", description="Service health status", example="ok")
    service: str = Field(default="veridian-it-support-agent", description="Service identifier", example="veridian-it-support-agent")
    environment: Optional[str] = Field(default=None, description="Current execution environment")
    version: Optional[str] = Field(default=None, description="API version")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "ok",
                    "service": "veridian-it-support-agent",
                    "environment": "development",
                    "version": "0.1.0"
                }
            ]
        }
    }
