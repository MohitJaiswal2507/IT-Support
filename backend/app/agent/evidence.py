import logging
from typing import List, Tuple
from app.retrieval.service import retrieval_service
from app.agent.state import GroupedEvidence, SourceReference, EvidenceType

logger = logging.getLogger(__name__)


def retrieve_and_group_evidence(query: str, top_k: int = 5) -> Tuple[GroupedEvidence, List[SourceReference], bool]:
    """
    Calls the Phase 2 Retrieval Service and organizes the retrieved chunks
    into distinct evidence buckets: Knowledge Base, Policy, and Historical Tickets.

    Returns:
        (GroupedEvidence, List[SourceReference], bool success)
    """
    grouped = GroupedEvidence()
    flat_sources: List[SourceReference] = []

    try:
        raw_results = retrieval_service.search(query=query, top_k=top_k)
    except FileNotFoundError as fnf:
        logger.error(f"Vector store not found: {fnf}")
        return grouped, [], False
    except Exception as e:
        logger.error(f"Retrieval failure during query '{query}': {e}")
        return grouped, [], False

    for r in raw_results:
        src_type_str = r.get("source_type", "")
        if src_type_str == "knowledge_base":
            ev_type = EvidenceType.KNOWLEDGE_BASE
        elif src_type_str == "policy":
            ev_type = EvidenceType.POLICY
        elif src_type_str == "ticket":
            ev_type = EvidenceType.TICKET_HISTORY
        else:
            continue

        ref = SourceReference(
            source_id=r.get("source_id", ""),
            source_type=ev_type,
            score=round(r.get("score", 0.0), 4),
            title=r.get("metadata", {}).get("title"),
            text=r.get("text", ""),
            metadata=r.get("metadata", {})
        )

        flat_sources.append(ref)

        if ev_type == EvidenceType.KNOWLEDGE_BASE:
            grouped.knowledge_base.append(ref)
        elif ev_type == EvidenceType.POLICY:
            grouped.policy.append(ref)
        elif ev_type == EvidenceType.TICKET_HISTORY:
            grouped.ticket_history.append(ref)

    return grouped, flat_sources, True
