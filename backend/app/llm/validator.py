import re
import logging
from typing import Tuple, List, Set
from app.llm.base import LLMResponse
from app.agent.state import AgentState, WorkflowDecision

logger = logging.getLogger(__name__)

# Action claim patterns that normal responses must never falsely assert as completed
FORBIDDEN_ACTION_PATTERNS = [
    re.compile(r"\b(i|we)\s+(have\s+)?unlocked\s+your\s+account\b", re.IGNORECASE),
    re.compile(r"\b(your\s+)?account\s+(has\s+been|is)\s+unlocked\b", re.IGNORECASE),
    re.compile(r"\b(i|we)\s+(have\s+)?installed\s+(the\s+)?software\b", re.IGNORECASE),
    re.compile(r"\bsoftware\s+(has\s+been|is)\s+installed\b", re.IGNORECASE),
    re.compile(r"\b(your\s+)?(laptop|device|hardware)\s+replacement\s+has\s+been\s+approved\b", re.IGNORECASE),
    re.compile(r"\b(i|we)\s+(have\s+)?approved\s+your\s+(laptop|device|hardware|replacement|upgrade|request)\b", re.IGNORECASE),
    re.compile(r"\b(i|we)\s+(have\s+)?created\s+(a\s+|your\s+)?ticket\b", re.IGNORECASE),
    re.compile(r"\ba\s+ticket\s+has\s+been\s+created\b", re.IGNORECASE),
    re.compile(r"\b(i|we)\s+(have\s+)?fixed\s+your\s+vpn\b", re.IGNORECASE),
    re.compile(r"\b(your\s+)?vpn\s+has\s+been\s+fixed\b", re.IGNORECASE),
    re.compile(r"\bapproval\s+(has\s+been|was)\s+granted\b", re.IGNORECASE),
]

# Source ID pattern (e.g., KB-01, POL-01, TK-1042)
SOURCE_ID_REGEX = re.compile(r"\b(KB-\d+|POL-\d+|TK-\d+)\b", re.IGNORECASE)


class GroundingValidator:
    """
    Deterministic validator for LLM-generated responses.
    Verifies output structure, source grounding, decision preservation,
    and checks against unsupported completion claims.
    """

    @classmethod
    def validate(cls, response: LLMResponse, state: AgentState) -> Tuple[bool, str]:
        # 1. Basic Content Verification
        if not response.answer or not response.answer.strip():
            return False, "LLM answer is empty or whitespace only."

        # 2. Source ID Grounding Check
        allowed_source_ids: Set[str] = set()
        for ref in state.relevant_sources:
            allowed_source_ids.add(ref.source_id.upper())

        for kb in state.evidence.knowledge_base:
            allowed_source_ids.add(kb.source_id.upper())
        for pol in state.evidence.policy:
            allowed_source_ids.add(pol.source_id.upper())
        for tk in state.evidence.ticket_history:
            allowed_source_ids.add(tk.source_id.upper())

        # Check explicit source_ids array from LLM
        for sid in response.source_ids:
            normalized_sid = sid.strip().upper()
            if normalized_sid not in allowed_source_ids:
                return False, f"LLM cited unsupported source ID in source_ids: {sid}"

        # Check answer body for any hallucinated source IDs
        mentioned_ids = SOURCE_ID_REGEX.findall(response.answer)
        for mid in mentioned_ids:
            if mid.upper() not in allowed_source_ids:
                return False, f"LLM cited unsupported source ID in answer text: {mid}"

        # 3. Action Claim / Safety Validation
        for pattern in FORBIDDEN_ACTION_PATTERNS:
            match = pattern.search(response.answer)
            if match:
                return False, f"Unsupported action claim detected: '{match.group(0)}'"

        # 4. Decision Preservation Verification
        if state.decision == WorkflowDecision.CLARIFY:
            # The response must not pretend to solve the problem
            # It should maintain a clarifying tone
            if state.clarification_question:
                # If a specific clarification was requested, ensure the answer doesn't give fake travel booking or resolve
                travel_terms = ["flight", "paris", "booked", "airline", "boarding pass"]
                if any(term in response.answer.lower() for term in travel_terms) and any(term in state.original_query.lower() for term in travel_terms):
                    return False, "LLM attempted to fulfill out-of-scope non-IT query."

        elif state.decision == WorkflowDecision.ESCALATE:
            # In an escalation, the model must not state the issue is resolved or self-service without escalation
            if "has been resolved" in response.answer.lower() or "issue is resolved" in response.answer.lower():
                return False, "LLM claimed issue was resolved for an ESCALATE decision."

        return True, "Response successfully validated."
