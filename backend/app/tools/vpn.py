from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.tools.base import ITTool
from app.tools.schemas import (
    ToolRiskLevel,
    ActionResult,
    CheckVpnStatusInput,
    CheckVpnStatusOutput
)


class CheckVpnStatusTool(ITTool):
    """
    Read-only tool that verifies simulated Cisco AnyConnect VPN access profile and certificate validity.
    Does NOT modify or remediate VPN configuration.
    """
    name = "CHECK_VPN_STATUS"
    description = "Check simulated employee VPN profile and certificate expiration status."
    risk_level = ToolRiskLevel.READ_ONLY
    requires_approval = False

    def execute(
        self,
        params: Dict[str, Any],
        db: Session,
        action_request_id: Optional[str] = None
    ) -> ActionResult:
        validated = CheckVpnStatusInput(**params)
        user_id = validated.employee_identifier

        # Simulated VPN status
        has_expired_context = "expired" in user_id.lower()
        status_val = "CERTIFICATE_EXPIRED" if has_expired_context else "ACTIVE"
        valid_until = "2026-09-01T00:00:00Z" if has_expired_context else "2026-12-31T23:59:59Z"
        msg = (
            "VPN status checked: Client certificate has expired. Renewal is required via Identity Portal."
            if has_expired_context
            else "VPN status checked: Cisco AnyConnect profile is active and valid."
        )

        output = CheckVpnStatusOutput(
            employee_identifier=user_id,
            vpn_profile="Cisco AnyConnect Corporate VPN",
            status=status_val,
            certificate_valid_until=valid_until,
            message=msg
        )

        return ActionResult(
            action_name=self.name,
            status="COMPLETED",
            message=msg,
            data=output.model_dump(),
            requires_approval=False,
            action_request_id=action_request_id
        )
