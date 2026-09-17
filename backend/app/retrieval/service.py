from typing import List, Dict, Any, Optional
from app.retrieval.embeddings import get_embedding_manager
from app.retrieval.vector_store import FaissVectorStore, DEFAULT_STORAGE_DIR


class RetrievalService:
    """
    Core retrieval service orchestrating embedding generation and vector search.
    Can be called directly by future AI agent workflows or via REST routes.
    """
    def __init__(self, vector_store: Optional[FaissVectorStore] = None):
        self.vector_store = vector_store or FaissVectorStore()
        self._embedding_manager = None

    @property
    def embedding_manager(self):
        if self._embedding_manager is None:
            self._embedding_manager = get_embedding_manager()
        return self._embedding_manager

    def search(
        self,
        query: str,
        top_k: int = 5,
        source_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic similarity search against indexed knowledge base, policies, and tickets.
        """
        clean_query = query.strip()
        if not clean_query:
            raise ValueError("Search query must not be empty.")

        if not self.vector_store.is_built():
            raise FileNotFoundError(
                "Retrieval index does not exist. Please execute 'python -m app.retrieval.build_index' to generate the vector store."
            )

        query_vector = self.embedding_manager.embed_query(clean_query)
        results = self.vector_store.search(
            query_vector=query_vector,
            top_k=top_k,
            source_type=source_type
        )
        return results


retrieval_service = RetrievalService()


def get_retrieval_service() -> RetrievalService:
    """Dependency injection getter for RetrievalService."""
    return retrieval_service
