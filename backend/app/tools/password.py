from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.tools.base import ITTool
from app.tools.schemas import (
    ToolRiskLevel,
    ActionResult,
    RequestPasswordResetInput,
    RequestPasswordResetOutput
)


class RequestPasswordResetTool(ITTool):
    """
    Request creation tool for simulated employee password resets.
    Strictly requires approval. NEVER generates or stores passwords.
    """
    name = "REQUEST_PASSWORD_RESET"
    description = "Create a simulated employee password reset request requiring IT authorization."
    risk_level = ToolRiskLevel.REQUEST_CREATION
    requires_approval = True

    def execute(
        self,
        params: Dict[str, Any],
        db: Session,
        action_request_id: Optional[str] = None
    ) -> ActionResult:
        validated = RequestPasswordResetInput(**params)
        req_id = action_request_id or "ACT-PENDING"

        output = RequestPasswordResetOutput(
            employee_identifier=validated.employee_identifier,
            status="PENDING_APPROVAL",
            action_request_id=req_id,
            message="Your password reset request has been submitted for approval."
        )

        return ActionResult(
            action_name=self.name,
            status="PENDING_APPROVAL",
            message="Password reset request queued. Authorization from IT Support is required.",
            data=output.model_dump(),
            requires_approval=True,
            action_request_id=req_id
        )
