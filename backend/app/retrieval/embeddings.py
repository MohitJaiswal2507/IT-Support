import threading
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384


class EmbeddingManager:
    """
    Singleton manager for local sentence-transformers embedding generation.
    Loads the model once and reuses it across queries for efficiency.
    """
    _instance: Optional["EmbeddingManager"] = None
    _lock = threading.Lock()

    def __new__(cls, model_name: str = DEFAULT_EMBEDDING_MODEL):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(EmbeddingManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, model_name: str = DEFAULT_EMBEDDING_MODEL):
        if getattr(self, "_initialized", False):
            return
        self.model_name = model_name
        self.dimension = EMBEDDING_DIMENSION
        print(f"[*] Initializing local SentenceTransformer model: {self.model_name}...")
        self.model = SentenceTransformer(self.model_name)
        self._initialized = True
        print(f"[OK] Embedding model loaded (dimension: {self.dimension}).")

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Embeds a list of texts into L2-normalized float32 vectors.
        Normalized vectors enable inner-product search to directly equal cosine similarity.
        """
        embeddings = self.model.encode(
            texts,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embeddings.astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Embeds a single query string into a 1D float32 normalized vector."""
        emb = self.model.encode(
            query,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return emb.astype(np.float32)


# Global singleton instance accessor
def get_embedding_manager(model_name: str = DEFAULT_EMBEDDING_MODEL) -> EmbeddingManager:
    return EmbeddingManager(model_name)
