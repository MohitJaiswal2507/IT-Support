from typing import List
from pydantic import BaseModel, ConfigDict, Field


class TicketResponse(BaseModel):
    id: str = Field(..., description="Ticket identifier (e.g. TK-1042)")
    employee: str = Field(..., description="Employee / requester name")
    issue_summary: str = Field(..., description="Summary of the issue")
    status: str = Field(..., description="Full status string")
    is_active: bool = Field(..., description="True if ticket is open/active, False if resolved/closed")

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    items: List[TicketResponse] = Field(..., description="List of tickets")
    total: int = Field(..., description="Total number of tickets returned")
