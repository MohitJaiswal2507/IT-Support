from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import EmployeeRequest
from app.schemas.requests import EmployeeRequestResponse, EmployeeRequestListResponse

router = APIRouter(prefix="/api/requests", tags=["Employee Requests"])


@router.get(
    "",
    response_model=EmployeeRequestListResponse,
    summary="List Employee Requests",
    description="Retrieve all employee requests with optional filtering by status/initial action taken or employee name."
)
def list_employee_requests(
    initial_action_taken: Optional[str] = Query(None, description="Filter by initial triage action taken"),
    employee: Optional[str] = Query(None, description="Filter by employee name"),
    db: Session = Depends(get_db)
) -> EmployeeRequestListResponse:
    query = db.query(EmployeeRequest)
    if initial_action_taken:
        query = query.filter(EmployeeRequest.initial_action_taken.ilike(f"%{initial_action_taken}%"))
    if employee:
        query = query.filter(EmployeeRequest.employee.ilike(f"%{employee}%"))
    requests = query.all()
    return EmployeeRequestListResponse(items=requests, total=len(requests))


@router.get(
    "/{request_id}",
    response_model=EmployeeRequestResponse,
    summary="Get Employee Request by ID",
    description="Retrieve a specific employee request by its identifier (e.g. REQ-01)."
)
def get_employee_request(
    request_id: str,
    db: Session = Depends(get_db)
) -> EmployeeRequestResponse:
    req = db.query(EmployeeRequest).filter(EmployeeRequest.id == request_id.upper()).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee request with ID '{request_id}' not found"
        )
    return req
