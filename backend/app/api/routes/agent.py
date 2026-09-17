import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse, AgentSourceItem, AgentActionItem
from app.agent.workflow import run_agent_workflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["Agent Workflow"])


@router.post(
    "/query",
    response_model=AgentQueryResponse,
    summary="Process IT Support Query",
    description="Processes an employee IT support query through the deterministic agent workflow with optional action execution."
)
def query_agent(
    payload: AgentQueryRequest,
    db: Session = Depends(get_db)
) -> AgentQueryResponse:
    clean_query = payload.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty or whitespace only."
        )

    try:
        state = run_agent_workflow(clean_query, db=db)

        source_items = [
            AgentSourceItem(
                source_id=src.source_id,
                source_type=src.source_type.value if hasattr(src.source_type, "value") else str(src.source_type),
                score=src.score,
                title=src.title
            )
            for src in state.relevant_sources
        ]

        action_payload = None
        if state.action:
            action_payload = AgentActionItem(
                action_name=state.action.action_name,
                status=state.action.status,
                action_request_id=state.action.action_request_id,
                message=state.action.message,
                data=state.action.data
            )

        return AgentQueryResponse(
            query=state.original_query,
            intent=state.intent.value,
            confidence=state.confidence,
            decision=state.decision.value,
            clarification_required=state.clarification_required,
            clarification_question=state.clarification_question,
            response=state.response,
            response_source=state.response_source,
            relevant_sources=state.relevant_source_ids or [src.source_id for src in state.relevant_sources],
            sources=source_items,
            escalation_reason=state.escalation_reason,
            action=action_payload
        )
    except Exception as exc:
        logger.error(f"Error processing agent query: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the agent workflow."
        )
