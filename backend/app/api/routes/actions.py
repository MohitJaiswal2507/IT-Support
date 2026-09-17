import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ActionRequest
from app.tools.registry import tool_registry
from app.tools.schemas import (
    ActionResult,
    ToolMetadata,
    ToolExecuteRequest,
    ActionApprovalRequest
)
from app.actions.service import ActionService
from app.actions.approvals import approve_action_request, reject_action_request

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Controlled Actions & Tools"])


@router.get(
    "/api/tools",
    response_model=List[ToolMetadata],
    summary="List Registered IT Tools",
    description="Returns all explicitly approved and registered IT service tools."
)
def list_registered_tools() -> List[ToolMetadata]:
    return tool_registry.list_tools()


@router.post(
    "/api/actions/execute",
    response_model=ActionResult,
    summary="Execute Controlled IT Action",
    description="Executes or queues an explicit IT action request under deterministic authorization."
)
def execute_controlled_action(
    payload: ToolExecuteRequest,
    db: Session = Depends(get_db)
) -> ActionResult:
    result = ActionService.execute_action(
        action_name=payload.action_name,
        parameters=payload.parameters,
        requester=payload.requester,
        db=db
    )
    return result


@router.get(
    "/api/actions/{action_request_id}",
    summary="Get Action Request Status",
    description="Retrieve status and audit details of a submitted action request."
)
def get_action_request(
    action_request_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    req_id = action_request_id.strip().upper()
    record = db.query(ActionRequest).filter(ActionRequest.action_id == req_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action request '{action_request_id}' not found."
        )

    return {
        "action_id": record.action_id,
        "action_name": record.action_name,
        "status": record.status,
        "requester": record.requester,
        "requested_at": record.requested_at,
        "approved_at": record.approved_at,
        "completed_at": record.completed_at,
        "approval_required": record.approval_required,
        "parameters": json.loads(record.parameters_json) if record.parameters_json else {},
        "result": json.loads(record.result_json) if record.result_json else {}
    }


@router.post(
    "/api/actions/{action_request_id}/approve",
    response_model=ActionResult,
    summary="Approve Action Request (Demo)",
    description="Authorizes and executes a pending action request in the demo environment."
)
def approve_action(
    action_request_id: str,
    payload: ActionApprovalRequest = ActionApprovalRequest(),
    db: Session = Depends(get_db)
) -> ActionResult:
    _, action_result = approve_action_request(
        db=db,
        action_request_id=action_request_id,
        approver=payload.approver,
        reason=payload.reason
    )
    return action_result


@router.post(
    "/api/actions/{action_request_id}/reject",
    response_model=ActionResult,
    summary="Reject Action Request (Demo)",
    description="Rejects a pending action request in the demo environment."
)
def reject_action(
    action_request_id: str,
    payload: ActionApprovalRequest = ActionApprovalRequest(),
    db: Session = Depends(get_db)
) -> ActionResult:
    _, action_result = reject_action_request(
        db=db,
        action_request_id=action_request_id,
        approver=payload.approver,
        reason=payload.reason
    )
    return action_result
