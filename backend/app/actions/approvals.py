import json
import logging
from datetime import datetime, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import ActionRequest, Approval
from app.tools.schemas import ActionResult

logger = logging.getLogger(__name__)


def approve_action_request(
    db: Session,
    action_request_id: str,
    approver: str = "demo-admin",
    reason: Optional[str] = "Approved in demo environment"
) -> Tuple[ActionRequest, ActionResult]:
    """
    Approves a pending action request.
    Enforces that duplicate approval is rejected with 400 Bad Request.
    """
    req_id = action_request_id.strip().upper()
    req = db.query(ActionRequest).filter(ActionRequest.action_id == req_id).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action request '{action_request_id}' not found."
        )

    if req.status != "PENDING_APPROVAL":
        logger.warning(f"Duplicate/invalid approval attempt on request {req_id} with status {req.status}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action request '{action_request_id}' is not pending approval (current status: '{req.status}')."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    # Transition ActionRequest to EXECUTED
    req.status = "EXECUTED"
    req.approved_at = now_iso
    req.completed_at = now_iso

    # Update or create Approval record
    approval = db.query(Approval).filter(Approval.action_request_id == req_id).first()
    if approval:
        approval.status = "APPROVED"
        approval.approved_at = now_iso
        approval.approver = approver
        approval.reason = reason or "Approved in demo environment"
    else:
        approval = Approval(
            id=f"APPR-{req_id}",
            action_request_id=req_id,
            status="APPROVED",
            requested_at=req.requested_at,
            approved_at=now_iso,
            approver=approver,
            reason=reason or "Approved in demo environment"
        )
        db.add(approval)

    db.commit()
    db.refresh(req)

    result_data = json.loads(req.result_json) if req.result_json else {}
    result_data["approval_status"] = "APPROVED"
    result_data["approver"] = approver

    action_result = ActionResult(
        action_name=req.action_name,
        status="EXECUTED",
        message=f"Action request {req_id} ({req.action_name}) has been approved and executed.",
        data=result_data,
        requires_approval=False,
        action_request_id=req_id
    )

    return req, action_result


def reject_action_request(
    db: Session,
    action_request_id: str,
    approver: str = "demo-admin",
    reason: Optional[str] = "Rejected in demo environment"
) -> Tuple[ActionRequest, ActionResult]:
    """
    Rejects a pending action request.
    Enforces that duplicate rejection/approval is rejected with 400 Bad Request.
    """
    req_id = action_request_id.strip().upper()
    req = db.query(ActionRequest).filter(ActionRequest.action_id == req_id).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action request '{action_request_id}' not found."
        )

    if req.status != "PENDING_APPROVAL":
        logger.warning(f"Duplicate/invalid rejection attempt on request {req_id} with status {req.status}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action request '{action_request_id}' is not pending approval (current status: '{req.status}')."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    req.status = "REJECTED"
    req.completed_at = now_iso

    approval = db.query(Approval).filter(Approval.action_request_id == req_id).first()
    if approval:
        approval.status = "REJECTED"
        approval.approved_at = now_iso
        approval.approver = approver
        approval.reason = reason or "Rejected in demo environment"
    else:
        approval = Approval(
            id=f"APPR-{req_id}",
            action_request_id=req_id,
            status="REJECTED",
            requested_at=req.requested_at,
            approved_at=now_iso,
            approver=approver,
            reason=reason or "Rejected in demo environment"
        )
        db.add(approval)

    db.commit()
    db.refresh(req)

    result_data = json.loads(req.result_json) if req.result_json else {}
    result_data["approval_status"] = "REJECTED"
    result_data["approver"] = approver

    action_result = ActionResult(
        action_name=req.action_name,
        status="REJECTED",
        message=f"Action request {req_id} ({req.action_name}) was rejected.",
        data=result_data,
        requires_approval=False,
        action_request_id=req_id
    )

    return req, action_result
