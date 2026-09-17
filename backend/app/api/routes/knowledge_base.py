from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import KnowledgeBaseArticle
from app.schemas.knowledge_base import KnowledgeBaseArticleResponse, KnowledgeBaseListResponse

router = APIRouter(prefix="/api/knowledge-base", tags=["Knowledge Base"])


@router.get(
    "",
    response_model=KnowledgeBaseListResponse,
    summary="List Knowledge Base Articles",
    description="Retrieve all knowledge base articles with optional search filtering on title or content."
)
def list_knowledge_base_articles(
    search: Optional[str] = Query(None, description="Filter articles by keyword in title or content"),
    db: Session = Depends(get_db)
) -> KnowledgeBaseListResponse:
    query = db.query(KnowledgeBaseArticle)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (KnowledgeBaseArticle.title.ilike(search_pattern)) |
            (KnowledgeBaseArticle.content.ilike(search_pattern))
        )
    articles = query.all()
    return KnowledgeBaseListResponse(items=articles, total=len(articles))


@router.get(
    "/{article_id}",
    response_model=KnowledgeBaseArticleResponse,
    summary="Get Knowledge Base Article by ID",
    description="Retrieve a specific knowledge base article by its identifier (e.g. KB-01)."
)
def get_knowledge_base_article(
    article_id: str,
    db: Session = Depends(get_db)
) -> KnowledgeBaseArticleResponse:
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id.upper()).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge base article with ID '{article_id}' not found"
        )
    return article
