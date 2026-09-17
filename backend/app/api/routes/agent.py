import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse, AgentSourceItem
from app.agent.workflow import run_agent_workflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["Agent Workflow"])


@router.post(
    "/query",
    response_model=AgentQueryResponse,
    summary="Process IT Support Query",
    description="Processes an employee IT support query through the deterministic agent workflow."
)
def query_agent(payload: AgentQueryRequest) -> AgentQueryResponse:
    clean_query = payload.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty or whitespace only."
        )

    try:
        state = run_agent_workflow(clean_query)

        source_items = [
            AgentSourceItem(
                source_id=src.source_id,
                source_type=src.source_type.value if hasattr(src.source_type, "value") else str(src.source_type),
                score=src.score,
                title=src.title
            )
            for src in state.relevant_sources
        ]

        return AgentQueryResponse(
            query=state.original_query,
            intent=state.intent.value,
            confidence=state.confidence,
            decision=state.decision.value,
            clarification_required=state.clarification_required,
            clarification_question=state.clarification_question,
            response=state.response,
            sources=source_items,
            escalation_reason=state.escalation_reason
        )
    except Exception as exc:
        logger.error(f"Error processing agent query: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the agent workflow."
        )
