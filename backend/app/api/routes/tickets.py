from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Ticket
from app.schemas.tickets import TicketResponse, TicketListResponse

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


@router.get(
    "",
    response_model=TicketListResponse,
    summary="List Tickets",
    description="Retrieve all existing tickets with optional filtering by status, active flag, or requester."
)
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status substring"),
    is_active: Optional[bool] = Query(None, description="Filter by active status (true for open, false for closed)"),
    employee: Optional[str] = Query(None, description="Filter by requester name"),
    db: Session = Depends(get_db)
) -> TicketListResponse:
    query = db.query(Ticket)
    if status_filter:
        query = query.filter(Ticket.status.ilike(f"%{status_filter}%"))
    if is_active is not None:
        query = query.filter(Ticket.is_active == is_active)
    if employee:
        query = query.filter(Ticket.employee.ilike(f"%{employee}%"))
    tickets = query.all()
    return TicketListResponse(items=tickets, total=len(tickets))


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Get Ticket by ID",
    description="Retrieve a specific ticket by its identifier (e.g. TK-1042)."
)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db)
) -> TicketResponse:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id.upper()).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID '{ticket_id}' not found"
        )
    return ticket
