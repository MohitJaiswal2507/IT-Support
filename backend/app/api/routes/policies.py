from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Policy
from app.schemas.policies import PolicyResponse, PolicyListResponse

router = APIRouter(prefix="/api/policies", tags=["Policies"])


@router.get(
    "",
    response_model=PolicyListResponse,
    summary="List Corporate Policies",
    description="Retrieve all corporate policies such as the Asset Management Policy."
)
def list_policies(
    db: Session = Depends(get_db)
) -> PolicyListResponse:
    policies = db.query(Policy).all()
    return PolicyListResponse(items=policies, total=len(policies))


@router.get(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Get Policy by ID",
    description="Retrieve a specific corporate policy by ID (e.g. POL-01)."
)
def get_policy(
    policy_id: str,
    db: Session = Depends(get_db)
) -> PolicyResponse:
    policy = db.query(Policy).filter(Policy.id == policy_id.upper()).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy with ID '{policy_id}' not found"
        )
    return policy
