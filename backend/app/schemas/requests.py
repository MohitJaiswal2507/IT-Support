from typing import List
from pydantic import BaseModel, ConfigDict, Field


class EmployeeRequestResponse(BaseModel):
    id: str = Field(..., description="Request identifier (e.g. REQ-01)")
    employee: str = Field(..., description="Employee full name")
    email: str = Field(..., description="Employee corporate email")
    date_opened: str = Field(..., description="Date opened in assignment week")
    request: str = Field(..., description="Original request text")
    initial_action_taken: str = Field(..., description="Initial triage action taken")

    model_config = ConfigDict(from_attributes=True)


class EmployeeRequestListResponse(BaseModel):
    items: List[EmployeeRequestResponse] = Field(..., description="List of employee requests")
    total: int = Field(..., description="Total number of requests returned")
