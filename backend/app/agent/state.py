from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class IntentCategory(str, Enum):
    PASSWORD_ACCESS = "PASSWORD_ACCESS"
    VPN_ACCESS = "VPN_ACCESS"
    SOFTWARE_REQUEST = "SOFTWARE_REQUEST"
    WIFI_NETWORK = "WIFI_NETWORK"
    HARDWARE_DEVICE = "HARDWARE_DEVICE"
    ACCOUNT_ACCESS = "ACCOUNT_ACCESS"
    GENERAL_IT = "GENERAL_IT"
    UNKNOWN = "UNKNOWN"


class WorkflowDecision(str, Enum):
    RESOLVE = "RESOLVE"
    CLARIFY = "CLARIFY"
    ESCALATE = "ESCALATE"


class EvidenceType(str, Enum):
    KNOWLEDGE_BASE = "knowledge_base"
    POLICY = "policy"
    TICKET_HISTORY = "ticket"


class SourceReference(BaseModel):
    source_id: str
    source_type: EvidenceType
    score: float
    title: Optional[str] = None
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GroupedEvidence(BaseModel):
    knowledge_base: List[SourceReference] = Field(default_factory=list)
    policy: List[SourceReference] = Field(default_factory=list)
    ticket_history: List[SourceReference] = Field(default_factory=list)

    @property
    def total_count(self) -> int:
        return len(self.knowledge_base) + len(self.policy) + len(self.ticket_history)


class AgentState(BaseModel):
    original_query: str
    normalized_query: str = ""
    intent: IntentCategory = IntentCategory.UNKNOWN
    confidence: float = 0.0
    intent_reasoning: str = ""
    clarification_required: bool = False
    clarification_question: Optional[str] = None
    evidence: GroupedEvidence = Field(default_factory=GroupedEvidence)
    relevant_sources: List[SourceReference] = Field(default_factory=list)
    policy_relevant: bool = False
    historical_ticket_relevant: bool = False
    decision: WorkflowDecision = WorkflowDecision.CLARIFY
    response: str = ""
    escalation_reason: Optional[str] = None
