from typing import Tuple, Optional
from app.agent.state import WorkflowDecision, IntentCategory, GroupedEvidence


class DecisionEngine:
    """
    Deterministic decision engine determining whether to RESOLVE, CLARIFY, or ESCALATE.
    """

    @classmethod
    def evaluate_decision(
        cls,
        query: str,
        intent: IntentCategory,
        confidence: float,
        is_underspecified: bool,
        evidence: GroupedEvidence,
        retrieval_ok: bool
    ) -> Tuple[WorkflowDecision, Optional[str]]:
        q_lower = query.lower()

        # 1. Retrieval failed due to system/disk error
        if not retrieval_ok:
            return (
                WorkflowDecision.ESCALATE,
                "Retrieval service unavailable: Unable to access verified knowledge base or policy evidence."
            )

        # 2. Underspecified / ambiguous queries
        if is_underspecified or confidence < 0.35:
            return (
                WorkflowDecision.CLARIFY,
                "The query lacks necessary detail or context to provide an actionable answer safely."
            )

        # 3. Known escalation conditions based on assignment rules
        # Non-catalog software requires Security Review (KB-04 / TK-1044)
        if intent == IntentCategory.SOFTWARE_REQUEST:
            if "not in" in q_lower or "non-catalog" in q_lower or "unapproved" in q_lower or "isn't in" in q_lower or "is not" in q_lower:
                return (
                    WorkflowDecision.ESCALATE,
                    "Non-catalog software requests require formal Security Review and manager approval per policy KB-04."
                )

        # Admin access / elevated permissions requires Security approval (TK-1050)
        if "admin access" in q_lower or "admin rights" in q_lower or "elevated rights" in q_lower:
            return (
                WorkflowDecision.ESCALATE,
                "Administrative and elevated access requests require department justification and Security approval."
            )

        # Phishing / security incidents require escalation
        if "phishing" in q_lower or "malware" in q_lower or "compromised" in q_lower:
            return (
                WorkflowDecision.ESCALATE,
                "Security incidents must be immediately escalated to the Information Security Incident Response Team."
            )

        # 4. If no relevant evidence was retrieved or similarity is too low
        if evidence.total_count == 0:
            return (
                WorkflowDecision.CLARIFY,
                "No relevant internal knowledge base articles or policies matched this inquiry."
            )

        # Check top evidence score
        top_score = 0.0
        all_items = evidence.knowledge_base + evidence.policy + evidence.ticket_history
        if all_items:
            top_score = max(item.score for item in all_items)

        if top_score < 0.30:
            return (
                WorkflowDecision.CLARIFY,
                "Retrieval similarity score is below confidence threshold. Additional details required."
            )

        # 5. Intent-specific resolutions
        # Self-service password lockout / reset (KB-01)
        if intent == IntentCategory.PASSWORD_ACCESS and evidence.knowledge_base:
            return WorkflowDecision.RESOLVE, None

        # Guest Wi-Fi access (KB-07)
        if intent == IntentCategory.WIFI_NETWORK and evidence.knowledge_base:
            return WorkflowDecision.RESOLVE, None

        # VPN Access (KB-02)
        if intent == IntentCategory.VPN_ACCESS and (evidence.knowledge_base or evidence.ticket_history):
            return WorkflowDecision.RESOLVE, None

        # Laptop refresh / hardware eligibility (KB-03, POL-01)
        if intent == IntentCategory.HARDWARE_DEVICE and (evidence.knowledge_base or evidence.policy):
            return WorkflowDecision.RESOLVE, None

        # General IT with solid KB evidence
        if evidence.knowledge_base:
            return WorkflowDecision.RESOLVE, None

        # Default safe fallback
        if intent == IntentCategory.UNKNOWN:
            return (
                WorkflowDecision.CLARIFY,
                "Request intent could not be mapped to existing IT support procedures."
            )

        return WorkflowDecision.RESOLVE, None
