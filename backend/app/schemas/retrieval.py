from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    chunk_id: str = Field(..., description="Unique chunk identifier (e.g. KB-01-0)")
    source_type: str = Field(..., description="Source classification: knowledge_base, policy, or ticket")
    source_id: str = Field(..., description="Original source identifier (e.g. KB-01, POL-01, TK-1042)")
    title: str = Field(..., description="Document or ticket title")
    text: str = Field(..., description="Retrieved chunk content")
    score: float = Field(..., description="Cosine similarity score (higher is more relevant, range [-1, 1])")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Associated source metadata")


class RetrievalResponse(BaseModel):
    query: str = Field(..., description="Query string executed")
    results: List[SearchResult] = Field(..., description="Ranked search results")
    total: int = Field(..., description="Total number of results returned")
