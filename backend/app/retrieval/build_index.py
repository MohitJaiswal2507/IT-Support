import sys
from pathlib import Path
from typing import Dict, Any

from app.retrieval.documents import load_documents_from_db, load_documents_from_json
from app.retrieval.chunker import DeterministicChunker
from app.retrieval.embeddings import get_embedding_manager
from app.retrieval.vector_store import FaissVectorStore, DEFAULT_STORAGE_DIR
from app.core.config import settings


def build_retrieval_index() -> Dict[str, Any]:
    """
    Builds and persists the FAISS vector index and metadata store
    from the current database or source datasets.
    """
    print("==================================================")
    print("Veridian Service Agent — Retrieval Index Build")
    print("==================================================")

    # 1. Load documents
    try:
        documents = load_documents_from_db()
    except Exception as e:
        print(f"[*] Notice: Database load encountered '{e}', falling back to source JSON files...")
        documents = load_documents_from_json(settings.DATA_DIR)

    kb_count = sum(1 for d in documents if d.source_type == "knowledge_base")
    pol_count = sum(1 for d in documents if d.source_type == "policy")
    ticket_count = sum(1 for d in documents if d.source_type == "ticket")

    # 2. Chunk documents
    chunker = DeterministicChunker(max_chunk_size=600, overlap=100)
    chunks = chunker.chunk_all(documents)

    # 3. Generate embeddings
    embedder = get_embedding_manager()
    texts = [c.text for c in chunks]
    print(f"[*] Generating embeddings for {len(texts)} chunks using {embedder.model_name}...")
    embeddings = embedder.embed_texts(texts)

    # 4. Build and save FAISS index
    store = FaissVectorStore(storage_dir=DEFAULT_STORAGE_DIR, dimension=embedder.dimension)
    store.build(chunks=chunks, embeddings=embeddings)
    store.save()

    summary = {
        "kb_docs": kb_count,
        "policy_docs": pol_count,
        "ticket_docs": ticket_count,
        "total_chunks": len(chunks),
        "dimension": embedder.dimension,
        "storage_dir": str(DEFAULT_STORAGE_DIR)
    }

    print("\nKnowledge Base documents:", kb_count)
    print("Policy documents:", pol_count)
    print("Ticket documents:", ticket_count)
    print("Total chunks:", len(chunks))
    print("Embedding dimension:", embedder.dimension)
    print("Index built successfully.")
    print("==================================================")

    return summary


if __name__ == "__main__":
    try:
        build_retrieval_index()
    except Exception as err:
        print(f"Error building retrieval index: {err}", file=sys.stderr)
        sys.exit(1)
