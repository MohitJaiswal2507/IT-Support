from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ToolRiskLevel(str, Enum):
    READ_ONLY = "READ_ONLY"
    REQUEST_CREATION = "REQUEST_CREATION"
    SENSITIVE = "SENSITIVE"


class ActionStatus(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


# ------------------------------------------------------------------------------
# Tool Input / Output Schemas
# ------------------------------------------------------------------------------

class CheckAccountStatusInput(BaseModel):
    employee_identifier: str = Field(default="demo-user", description="Simulated employee identifier or email")


class CheckAccountStatusOutput(BaseModel):
    employee_identifier: str
    status: str
    details: str
    last_login: str


class RequestPasswordResetInput(BaseModel):
    employee_identifier: str = Field(default="demo-user", description="Simulated employee identifier")
    reason: str = Field(default="User self-service password reset request", description="Reason for reset request")


class RequestPasswordResetOutput(BaseModel):
    employee_identifier: str
    status: str
    action_request_id: str
    message: str


class CheckVpnStatusInput(BaseModel):
    employee_identifier: str = Field(default="demo-user", description="Simulated employee identifier")


class CheckVpnStatusOutput(BaseModel):
    employee_identifier: str
    vpn_profile: str
    status: str
    certificate_valid_until: str
    message: str


class RequestLaptopReplacementInput(BaseModel):
    employee_identifier: str = Field(default="demo-user", description="Simulated employee identifier")
    asset_tag: str = Field(default="LT-9921", description="Asset tag of existing laptop")
    device_age_years: float = Field(default=3.0, description="Age of existing laptop in years")
    hardware_failure: bool = Field(default=False, description="Verified hardware failure confirmed by IT")
    upgrade_requested: bool = Field(default=False, description="Whether an upgrade beyond standard spec is requested")
    justification: str = Field(default="", description="Business justification if required")


class RequestLaptopReplacementOutput(BaseModel):
    employee_identifier: str
    asset_tag: str
    device_age_years: float
    status: str
    action_request_id: Optional[str] = None
    policy_check: str
    message: str


class CheckTicketStatusInput(BaseModel):
    ticket_id: str = Field(..., description="Ticket ID to check (e.g. TK-1042)")


class CheckTicketStatusOutput(BaseModel):
    ticket_id: str
    employee: str
    issue_summary: str
    status: str
    is_active: bool


# ------------------------------------------------------------------------------
# Generic Action Models
# ------------------------------------------------------------------------------

class ActionResult(BaseModel):
    """
    Standardized result structure returned by any tool or action execution.
    """
    action_name: str
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    requires_approval: bool = False
    action_request_id: Optional[str] = None


class ToolMetadata(BaseModel):
    """
    Public metadata describing an explicitly registered IT tool.
    """
    name: str
    description: str
    risk_level: ToolRiskLevel
    requires_approval: bool


class ToolExecuteRequest(BaseModel):
    """
    Direct API request payload for executing a controlled action.
    """
    action_name: str = Field(..., description="Registered action name")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Typed action parameters")
    requester: str = Field(default="demo-user", description="Simulated requester identity")


class ActionApprovalRequest(BaseModel):
    """
    Payload for approving or rejecting a pending action request.
    """
    approver: str = Field(default="demo-admin", description="Demo approver username")
    reason: Optional[str] = Field(default="Reviewed in demo environment", description="Rationale for decision")
