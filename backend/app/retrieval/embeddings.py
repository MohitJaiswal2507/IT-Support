import os
import threading
from typing import List, Optional
import numpy as np

# Ensure HuggingFace cache is in /tmp on serverless environments
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"):
    os.environ.setdefault("HF_HOME", "/tmp/huggingface")
    os.environ.setdefault("TORCH_HOME", "/tmp/torch")

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
        self.model = None

        try:
            from sentence_transformers import SentenceTransformer
            print(f"[*] Initializing local SentenceTransformer model: {self.model_name}...")
            self.model = SentenceTransformer(self.model_name)
            print(f"[OK] Embedding model loaded (dimension: {self.dimension}).")
        except Exception as e:
            print(f"[!] Warning: SentenceTransformer initialization deferred/failed: {e}")
            self.model = None

        self._initialized = True

    def _fallback_embed(self, text: str) -> np.ndarray:
        """Deterministic fallback pseudo-vector in case SentenceTransformer is unavailable."""
        import hashlib
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % self.dimension
            vec[idx] += 1.0 / (i + 1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Embeds a list of texts into L2-normalized float32 vectors.
        Normalized vectors enable inner-product search to directly equal cosine similarity.
        """
        if self.model is not None:
            embeddings = self.model.encode(
                texts,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embeddings.astype(np.float32)

        vectors = [self._fallback_embed(t) for t in texts]
        return np.vstack(vectors).astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Embeds a single query string into a 1D float32 normalized vector."""
        if self.model is not None:
            emb = self.model.encode(
                query,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return emb.astype(np.float32)

        return self._fallback_embed(query)


# Global singleton instance accessor
def get_embedding_manager(model_name: str = DEFAULT_EMBEDDING_MODEL) -> EmbeddingManager:
    return EmbeddingManager(model_name)
