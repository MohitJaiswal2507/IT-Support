import re
from dataclasses import dataclass, field
from typing import List, Dict, Any
from app.retrieval.documents import Document


@dataclass
class Chunk:
    """A granular retrieval unit with unique chunk identifier and source metadata."""
    chunk_id: str
    source_type: str
    source_id: str
    title: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class DeterministicChunker:
    """
    Deterministic chunking strategy that preserves sentence integrity,
    original source identifiers, and associated metadata.
    """
    def __init__(self, max_chunk_size: int = 600, overlap: int = 100):
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap

    def chunk_document(self, doc: Document) -> List[Chunk]:
        """
        Splits a Document into one or more Chunks deterministically.
        If document text is within max_chunk_size, it produces a single chunk.
        """
        text = doc.text.strip()
        if not text:
            return []

        meta = dict(doc.metadata)
        meta.setdefault("source_id", doc.source_id)
        meta.setdefault("source_type", doc.source_type)

        # If already compact, maintain as a single complete chunk
        if len(text) <= self.max_chunk_size:
            return [
                Chunk(
                    chunk_id=f"{doc.source_id}-0",
                    source_type=doc.source_type,
                    source_id=doc.source_id,
                    title=doc.title,
                    text=text,
                    metadata=meta
                )
            ]

        # Sentence-aware chunking for longer texts
        sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+|\n+', text) if s.strip()]
        chunks: List[Chunk] = []
        current_sentences: List[str] = []
        current_len = 0
        chunk_idx = 0

        for sentence in sentences:
            sentence_len = len(sentence) + 1
            if current_sentences and (current_len + sentence_len > self.max_chunk_size):
                chunk_text = " ".join(current_sentences)
                chunks.append(
                    Chunk(
                        chunk_id=f"{doc.source_id}-{chunk_idx}",
                        source_type=doc.source_type,
                        source_id=doc.source_id,
                        title=doc.title,
                        text=chunk_text,
                        metadata=dict(meta)
                    )
                )
                chunk_idx += 1

                # Retain overlap sentences
                overlap_sentences: List[str] = []
                overlap_len = 0
                for s in reversed(current_sentences):
                    if overlap_len + len(s) < self.overlap:
                        overlap_sentences.insert(0, s)
                        overlap_len += len(s) + 1
                    else:
                        break
                current_sentences = overlap_sentences
                current_len = sum(len(s) + 1 for s in current_sentences)

            current_sentences.append(sentence)
            current_len += sentence_len

        if current_sentences:
            chunks.append(
                Chunk(
                    chunk_id=f"{doc.source_id}-{chunk_idx}",
                    source_type=doc.source_type,
                    source_id=doc.source_id,
                    title=doc.title,
                    text=" ".join(current_sentences),
                    metadata=dict(meta)
                )
            )

        return chunks

    def chunk_all(self, documents: List[Document]) -> List[Chunk]:
        """Processes all documents into deterministic chunks."""
        all_chunks: List[Chunk] = []
        for doc in documents:
            all_chunks.extend(self.chunk_document(doc))
        return all_chunks


def chunk_documents(documents: List[Document]) -> List[Chunk]:
    """Convenience helper function for chunking a list of Documents."""
    chunker = DeterministicChunker()
    return chunker.chunk_all(documents)
