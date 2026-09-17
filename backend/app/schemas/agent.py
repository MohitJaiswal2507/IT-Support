from typing import List, Optional
from pydantic import BaseModel, Field


class AgentQueryRequest(BaseModel):
    query: str = Field(..., description="Employee IT support question or request description")


class AgentSourceItem(BaseModel):
    source_id: str
    source_type: str
    score: float
    title: Optional[str] = None


class AgentQueryResponse(BaseModel):
    query: str
    intent: str
    confidence: float
    decision: str
    clarification_required: bool
    clarification_question: Optional[str] = None
    response: str
    sources: List[AgentSourceItem] = Field(default_factory=list)
    escalation_reason: Optional[str] = None
