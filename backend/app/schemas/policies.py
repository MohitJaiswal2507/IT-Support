from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PolicyResponse(BaseModel):
    id: str = Field(..., description="Policy identifier (e.g. POL-01)")
    title: str = Field(..., description="Policy title")
    issued_by: Optional[str] = Field(None, description="Issuing authority or department")
    last_updated: Optional[str] = Field(None, description="Last update date or period")
    content: str = Field(..., description="Complete policy text content")

    model_config = ConfigDict(from_attributes=True)


class PolicyListResponse(BaseModel):
    items: List[PolicyResponse] = Field(..., description="List of corporate policies")
    total: int = Field(..., description="Total number of policies returned")
