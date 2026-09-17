from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.retrieval.service import retrieval_service
from app.schemas.retrieval import RetrievalResponse, SearchResult

router = APIRouter(prefix="/api/retrieval", tags=["Retrieval / RAG"])

VALID_SOURCE_TYPES = {"knowledge_base", "policy", "ticket"}


@router.get(
    "/search",
    response_model=RetrievalResponse,
    summary="Semantic Retrieval Search",
    description="Performs semantic vector similarity search over indexed Knowledge Base articles, Policies, and Tickets."
)
def search_retrieval(
    query: Optional[str] = Query(None, description="Natural language search query"),
    q: Optional[str] = Query(None, description="Alias for query"),
    top_k: int = Query(3, ge=1, le=50, description="Number of results to retrieve (1 to 50, default 3)"),
    source_type: Optional[str] = Query(None, description="Optional filter by source type: knowledge_base, policy, or ticket")
) -> RetrievalResponse:
    search_query = query or q or ""
    clean_query = search_query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty or whitespace only. Provide 'query' parameter."
        )

    if source_type and source_type not in VALID_SOURCE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source_type '{source_type}'. Must be one of: {sorted(VALID_SOURCE_TYPES)}."
        )

    try:
        results = retrieval_service.search(
            query=clean_query,
            top_k=top_k,
            source_type=source_type
        )
        return RetrievalResponse(
            query=clean_query,
            results=[SearchResult(**r) for r in results],
            total=len(results)
        )
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval error: {str(err)}"
        )
