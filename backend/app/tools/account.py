from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.tools.base import ITTool
from app.tools.schemas import (
    ToolRiskLevel,
    ActionResult,
    CheckAccountStatusInput,
    CheckAccountStatusOutput
)


class CheckAccountStatusTool(ITTool):
    """
    Read-only tool that verifies simulated employee account directory status.
    Safe for automatic execution.
    """
    name = "CHECK_ACCOUNT_STATUS"
    description = "Check whether a simulated employee account is active, locked, or suspended."
    risk_level = ToolRiskLevel.READ_ONLY
    requires_approval = False

    def execute(
        self,
        params: Dict[str, Any],
        db: Session,
        action_request_id: Optional[str] = None
    ) -> ActionResult:
        validated = CheckAccountStatusInput(**params)
        user_id = validated.employee_identifier

        # Simulated directory response
        is_locked = "lock" in user_id.lower()
        status_text = "LOCKED" if is_locked else "ACTIVE"
        details_text = (
            "Account locked due to consecutive failed password attempts (simulated)."
            if is_locked
            else "Account is active and in good standing in corporate directory."
        )

        output = CheckAccountStatusOutput(
            employee_identifier=user_id,
            status=status_text,
            details=details_text,
            last_login="2026-09-17T08:30:00Z"
        )

        return ActionResult(
            action_name=self.name,
            status="COMPLETED",
            message=f"Account status verified: {status_text}.",
            data=output.model_dump(),
            requires_approval=False,
            action_request_id=action_request_id
        )
