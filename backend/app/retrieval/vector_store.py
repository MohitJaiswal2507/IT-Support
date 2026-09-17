import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import faiss
import numpy as np

from app.retrieval.chunker import Chunk

DEFAULT_STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "vector_store"


class FaissVectorStore:
    """
    FAISS vector store managing local vector similarity search alongside
    structured chunk metadata mapping.
    """
    def __init__(self, storage_dir: Optional[Path] = None, dimension: int = 384):
        self.storage_dir = storage_dir or DEFAULT_STORAGE_DIR
        self.dimension = dimension
        self.index: Optional[faiss.IndexFlatIP] = None
        self.metadata: List[Dict[str, Any]] = []

    @property
    def index_path(self) -> Path:
        return self.storage_dir / "index.faiss"

    @property
    def metadata_path(self) -> Path:
        return self.storage_dir / "metadata.json"

    def is_built(self) -> bool:
        """Returns True if persisted index and metadata files exist."""
        return self.index_path.exists() and self.metadata_path.exists()

    def build(self, chunks: List[Chunk], embeddings: np.ndarray) -> None:
        """
        Initializes IndexFlatIP with normalized vectors and writes metadata list.
        """
        if len(chunks) != len(embeddings):
            raise ValueError(f"Chunk count ({len(chunks)}) does not match embeddings count ({len(embeddings)})")

        dim = embeddings.shape[1]
        self.dimension = dim
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)

        self.metadata = [
            {
                "chunk_id": c.chunk_id,
                "source_type": c.source_type,
                "source_id": c.source_id,
                "title": c.title,
                "text": c.text,
                "metadata": c.metadata,
            }
            for c in chunks
        ]

    def save(self) -> None:
        """Persists FAISS index binary and metadata JSON to disk."""
        if self.index is None:
            raise RuntimeError("Cannot save an empty FAISS index.")

        self.storage_dir.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))

        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)

    def load(self) -> bool:
        """Loads FAISS index binary and metadata JSON from disk."""
        if not self.is_built():
            return False

        self.index = faiss.read_index(str(self.index_path))
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        return True

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
        source_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches FAISS for top-k similar chunks.
        Applies optional source_type filtering over metadata.
        Cosine similarity scores range [-1.0, 1.0] (typically [0.0, 1.0] for sentence similarity).
        """
        if self.index is None or not self.metadata:
            loaded = self.load()
            if not loaded:
                raise RuntimeError("Vector store index is not built. Run 'python -m app.retrieval.build_index' first.")

        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(1, -1)

        # Retrieve a broader pool if filtering is applied
        fetch_k = min(len(self.metadata), top_k * 3 if source_type else top_k)
        if fetch_k <= 0:
            return []

        scores, indices = self.index.search(query_vector, fetch_k)
        raw_scores = scores[0]
        raw_indices = indices[0]

        results: List[Dict[str, Any]] = []
        for score, idx in zip(raw_scores, raw_indices):
            if idx < 0 or idx >= len(self.metadata):
                continue
            item = self.metadata[idx]
            if source_type and item.get("source_type") != source_type:
                continue

            results.append({
                "chunk_id": item["chunk_id"],
                "source_type": item["source_type"],
                "source_id": item["source_id"],
                "title": item["title"],
                "text": item["text"],
                "score": float(round(score, 4)),
                "metadata": item["metadata"]
            })

            if len(results) >= top_k:
                break

        return results
