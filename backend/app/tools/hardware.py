from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.tools.base import ITTool
from app.tools.schemas import (
    ToolRiskLevel,
    ActionResult,
    RequestLaptopReplacementInput,
    RequestLaptopReplacementOutput
)


class RequestLaptopReplacementTool(ITTool):
    """
    Request creation tool for employee hardware/laptop replacement.
    Strictly evaluates Veridian Asset Management Policy (POL-01).
    """
    name = "REQUEST_LAPTOP_REPLACEMENT"
    description = "Submit a laptop replacement request evaluated against POL-01 lifecycle policy."
    risk_level = ToolRiskLevel.REQUEST_CREATION
    requires_approval = True

    def execute(
        self,
        params: Dict[str, Any],
        db: Session,
        action_request_id: Optional[str] = None
    ) -> ActionResult:
        validated = RequestLaptopReplacementInput(**params)
        req_id = action_request_id or "ACT-PENDING"

        age = validated.device_age_years
        hardware_failure = validated.hardware_failure
        upgrade_requested = validated.upgrade_requested

        # Evaluate POL-01 Policy Rules
        if age >= 3.0:
            policy_note = "Standard 3-year lifecycle refresh eligibility confirmed (POL-01 §3.1)."
            status_text = "PENDING_APPROVAL"
            requires_appr = True
            msg = (
                f"Laptop {validated.asset_tag} is {age:.1f} years old and qualifies for standard refresh. "
                f"Replacement request {req_id} submitted for logistics fulfillment approval."
            )
        elif hardware_failure:
            policy_note = "Early replacement permitted due to verified hardware failure (POL-01 §3.2)."
            status_text = "PENDING_APPROVAL"
            requires_appr = True
            msg = (
                f"Early replacement for {validated.asset_tag} submitted with verified hardware failure. "
                f"Request {req_id} pending IT Support sign-off."
            )
        elif upgrade_requested:
            policy_note = "Hardware upgrade requires Department Head approval and written justification (POL-01 §3.3)."
            status_text = "PENDING_APPROVAL"
            requires_appr = True
            msg = (
                f"Hardware upgrade request {req_id} submitted. "
                f"Requires Department Head approval before procurement."
            )
        else:
            policy_note = "Ineligible for standard refresh: Device is under 3 years old with no verified failure (POL-01 §3.1)."
            status_text = "REJECTED"
            requires_appr = False
            msg = (
                f"Laptop {validated.asset_tag} ({age:.1f} years old) does not meet POL-01 refresh criteria. "
                f"Standard lifecycle replacement requires 3 years of service or verified hardware failure."
            )

        output = RequestLaptopReplacementOutput(
            employee_identifier=validated.employee_identifier,
            asset_tag=validated.asset_tag,
            device_age_years=age,
            status=status_text,
            action_request_id=req_id if status_text != "REJECTED" else None,
            policy_check=policy_note,
            message=msg
        )

        return ActionResult(
            action_name=self.name,
            status=status_text,
            message=msg,
            data=output.model_dump(),
            requires_approval=requires_appr,
            action_request_id=req_id if status_text != "REJECTED" else None
        )
