from typing import List
from pydantic import BaseModel, ConfigDict, Field


class KnowledgeBaseArticleResponse(BaseModel):
    id: str = Field(..., description="Article identifier (e.g. KB-01)")
    title: str = Field(..., description="Article title")
    content: str = Field(..., description="Complete text content of the article")

    model_config = ConfigDict(from_attributes=True)


class KnowledgeBaseListResponse(BaseModel):
    items: List[KnowledgeBaseArticleResponse] = Field(..., description="List of knowledge base articles")
    total: int = Field(..., description="Total number of items returned")
