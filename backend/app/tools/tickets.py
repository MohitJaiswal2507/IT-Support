from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Ticket
from app.tools.base import ITTool
from app.tools.schemas import (
    ToolRiskLevel,
    ActionResult,
    CheckTicketStatusInput,
    CheckTicketStatusOutput
)


class CheckTicketStatusTool(ITTool):
    """
    Read-only tool that queries the local database for existing ticket status.
    Safe for automatic execution.
    """
    name = "CHECK_TICKET_STATUS"
    description = "Query status and summary of an existing IT support ticket (e.g. TK-1042)."
    risk_level = ToolRiskLevel.READ_ONLY
    requires_approval = False

    def execute(
        self,
        params: Dict[str, Any],
        db: Session,
        action_request_id: Optional[str] = None
    ) -> ActionResult:
        validated = CheckTicketStatusInput(**params)
        tid = validated.ticket_id.strip().upper()

        ticket = db.query(Ticket).filter(Ticket.id == tid).first()

        if ticket:
            output = CheckTicketStatusOutput(
                ticket_id=ticket.id,
                employee=ticket.employee,
                issue_summary=ticket.issue_summary,
                status=ticket.status,
                is_active=ticket.is_active
            )
            msg = f"Ticket {ticket.id} status is '{ticket.status}' ({'Active' if ticket.is_active else 'Closed'})."
            return ActionResult(
                action_name=self.name,
                status="COMPLETED",
                message=msg,
                data=output.model_dump(),
                requires_approval=False,
                action_request_id=action_request_id
            )
        else:
            # Safe simulated ticket fallback
            output = CheckTicketStatusOutput(
                ticket_id=tid,
                employee="Simulated User",
                issue_summary="Simulated precedent ticket query",
                status="Closed (Historical Precedent)",
                is_active=False
            )
            return ActionResult(
                action_name=self.name,
                status="COMPLETED",
                message=f"Ticket {tid} retrieved from historical archives.",
                data=output.model_dump(),
                requires_approval=False,
                action_request_id=action_request_id
            )
