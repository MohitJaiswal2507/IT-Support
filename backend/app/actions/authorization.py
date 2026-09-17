import logging
from enum import Enum
from typing import Dict, Any, Tuple
from app.tools.registry import tool_registry
from app.tools.schemas import ToolRiskLevel

logger = logging.getLogger(__name__)


class AuthorizationDecision(str, Enum):
    ALLOW = "ALLOW"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    DENY = "DENY"


class ActionAuthorizationService:
    """
    Deterministic authorization boundary for all IT service actions.
    Ensures that tool execution permissions are strictly governed by policy,
    never by the LLM or unvalidated client parameters.
    """

    @classmethod
    def authorize(
        cls,
        action_name: str,
        parameters: Dict[str, Any]
    ) -> Tuple[AuthorizationDecision, str]:
        """
        Determines whether an action can execute automatically (ALLOW),
        requires human approval (APPROVAL_REQUIRED), or is forbidden (DENY).
        """
        if not action_name:
            return AuthorizationDecision.DENY, "No action name provided."

        normalized_action = action_name.strip().upper()
        tool = tool_registry.get_tool(normalized_action)

        if not tool:
            logger.warning(f"Authorization rejected unknown or arbitrary tool: {action_name}")
            return AuthorizationDecision.DENY, f"Action '{action_name}' is not registered or supported."

        # 1. READ_ONLY Actions are automatically permitted
        if tool.risk_level == ToolRiskLevel.READ_ONLY:
            return AuthorizationDecision.ALLOW, "Read-only inquiry is safe for automatic execution."

        # 2. Password Reset strictly requires approval
        if normalized_action == "REQUEST_PASSWORD_RESET":
            return AuthorizationDecision.APPROVAL_REQUIRED, "Password reset requests require IT Support authorization."

        # 3. Laptop Replacement Policy Evaluation (POL-01)
        if normalized_action == "REQUEST_LAPTOP_REPLACEMENT":
            device_age = float(parameters.get("device_age_years", 3.0))
            hardware_failure = bool(parameters.get("hardware_failure", False))
            upgrade_requested = bool(parameters.get("upgrade_requested", False))

            if device_age >= 3.0:
                return (
                    AuthorizationDecision.APPROVAL_REQUIRED,
                    "Eligible under standard 3-year refresh lifecycle (POL-01 §3.1). Requires fulfillment approval."
                )
            elif hardware_failure:
                return (
                    AuthorizationDecision.APPROVAL_REQUIRED,
                    "Early replacement permitted due to hardware failure (POL-01 §3.2). Requires IT validation."
                )
            elif upgrade_requested:
                return (
                    AuthorizationDecision.APPROVAL_REQUIRED,
                    "Hardware upgrade requires Department Head approval and business justification (POL-01 §3.3)."
                )
            else:
                return (
                    AuthorizationDecision.DENY,
                    "Action not authorized: Device is under 3 years old with no verified hardware failure (POL-01 §3.1)."
                )

        # 4. SENSITIVE actions are blocked by default in Phase 5
        if tool.risk_level == ToolRiskLevel.SENSITIVE:
            return AuthorizationDecision.DENY, "Sensitive actions are disabled in this environment."

        # 5. Default fallback
        if tool.requires_approval:
            return AuthorizationDecision.APPROVAL_REQUIRED, "Action requires human approval."

        return AuthorizationDecision.ALLOW, "Action approved for execution."
