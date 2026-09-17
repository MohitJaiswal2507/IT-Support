import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import ActionRequest, Approval
from app.tools.registry import tool_registry
from app.tools.schemas import ActionResult
from app.actions.authorization import ActionAuthorizationService, AuthorizationDecision

logger = logging.getLogger(__name__)


class ActionService:
    """
    Central orchestration service for controlled IT actions.
    Enforces registration validation, deterministic authorization,
    database audit logging, and tool execution.
    """

    @classmethod
    def execute_action(
        cls,
        action_name: str,
        parameters: Dict[str, Any],
        requester: str = "demo-user",
        db: Optional[Session] = None
    ) -> ActionResult:
        """
        Executes or queues an action request.
        """
        normalized_action = action_name.strip().upper() if action_name else ""

        # 1. Registration Check
        if not tool_registry.is_registered(normalized_action):
            logger.warning(f"Rejected unregistered tool invocation attempt: {action_name}")
            return ActionResult(
                action_name=action_name or "UNKNOWN",
                status="REJECTED",
                message=f"Action '{action_name}' is not registered or supported.",
                data=None,
                requires_approval=False,
                action_request_id=None
            )

        tool = tool_registry.get_tool(normalized_action)
        assert tool is not None

        # 2. Authorization Evaluation
        decision, auth_reason = ActionAuthorizationService.authorize(normalized_action, parameters)

        if decision == AuthorizationDecision.DENY:
            logger.info(f"Action {normalized_action} denied by policy: {auth_reason}")
            return ActionResult(
                action_name=normalized_action,
                status="REJECTED",
                message=f"Action not authorized: {auth_reason}",
                data={"authorization_reason": auth_reason},
                requires_approval=False,
                action_request_id=None
            )

        # 3. Generate action ID
        action_id = f"ACT-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # 4. Handle APPROVAL_REQUIRED
        if decision == AuthorizationDecision.APPROVAL_REQUIRED:
            tool_result = tool.execute(parameters, db, action_request_id=action_id)
            tool_result.action_request_id = action_id

            if db is not None:
                action_record = ActionRequest(
                    id=action_id,
                    action_id=action_id,
                    action_name=normalized_action,
                    requested_at=now_iso,
                    status="PENDING_APPROVAL",
                    requester=requester,
                    parameters_json=json.dumps(parameters),
                    result_json=json.dumps(tool_result.data or {}),
                    approval_required=True
                )
                approval_record = Approval(
                    id=f"APPR-{action_id}",
                    action_request_id=action_id,
                    status="PENDING",
                    requested_at=now_iso,
                    approver=None,
                    reason=auth_reason
                )
                db.add(action_record)
                db.add(approval_record)
                db.commit()

            return tool_result

        # 5. Handle ALLOW (Automated Execution)
        tool_result = tool.execute(parameters, db, action_request_id=action_id)
        tool_result.action_request_id = action_id

        if db is not None:
            action_record = ActionRequest(
                id=action_id,
                action_id=action_id,
                action_name=normalized_action,
                requested_at=now_iso,
                status="EXECUTED",
                requester=requester,
                parameters_json=json.dumps(parameters),
                result_json=json.dumps(tool_result.data or {}),
                approval_required=False,
                completed_at=now_iso
            )
            db.add(action_record)
            db.commit()

        return tool_result
