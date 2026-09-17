import json
from typing import Dict, Any
from app.agent.state import AgentState, WorkflowDecision

SYSTEM_PROMPT = """You are the Veridian Internal IT Support Assistant.
Your sole role is to provide clear, professional, and grounded responses to employee IT queries based strictly on the provided structured decision state and approved evidence.

Strict Operating Rules:
1. Answer ONLY from the supplied evidence and structured state.
2. Do NOT invent facts, technical procedures, or company policies.
3. Official Knowledge Base and Policy documents are authoritative.
4. Historical tickets are historical context only; they do NOT override current policy or procedures.
5. Follow the supplied decision exactly:
   - If decision == CLARIFY: Ask the supplied clarification question. Do not attempt to guess or answer ambiguous/unrelated questions.
   - If decision == ESCALATE: Clearly explain the escalation reason and state that IT Support / Security action or approval is required. Mention governing policy if provided.
   - If decision == RESOLVE: Provide the supported resolution using supplied evidence.
6. If evidence is insufficient to resolve, do not guess.
7. EVIDENCE PRIORITY:
   1. Official Knowledge Base
   2. Official Policy
   3. Historical Ticket Context
8. If citing historical tickets, clearly distinguish them using language like 'Historical context: ...' and never present historical resolutions as current policy.
9. FORBIDDEN ACTION CLAIMS:
   - Never claim an action was completed.
   - Never claim a ticket was created.
   - Never claim an account was unlocked.
   - Never claim software was installed.
   - Never claim a device was replaced or replacement was approved.
   - Never claim approval was granted.
   Explain what the user should do rather than claiming completion.
10. Keep responses professional, helpful, and concise.
11. Include only valid source IDs in `source_ids` that exist in the supplied evidence.

OUTPUT FORMAT:
You MUST respond with a valid JSON object strictly matching this schema:
{
    "answer": "Your grounded response text here.",
    "source_ids": ["KB-01", "POL-01"],
    "historical_context_used": false
}
"""


def build_user_prompt(state: AgentState) -> str:
    """
    Builds the controlled, structured JSON context sent to the LLM.
    Strictly includes only evidence retrieved by Phase 2 / Phase 3.
    """
    evidence_list = []

    for item in state.evidence.knowledge_base:
        evidence_list.append({
            "source_type": "KNOWLEDGE_BASE",
            "source_id": item.source_id,
            "title": item.title,
            "content": item.text
        })

    for item in state.evidence.policy:
        evidence_list.append({
            "source_type": "POLICY",
            "source_id": item.source_id,
            "title": item.title,
            "content": item.text
        })

    for item in state.evidence.ticket_history:
        evidence_list.append({
            "source_type": "TICKET_HISTORY",
            "source_id": item.source_id,
            "title": item.title,
            "content": item.text
        })

    context_payload: Dict[str, Any] = {
        "query": state.original_query,
        "normalized_query": state.normalized_query,
        "intent": state.intent.value if hasattr(state.intent, "value") else str(state.intent),
        "decision": state.decision.value if hasattr(state.decision, "value") else str(state.decision),
        "clarification_question": state.clarification_question,
        "escalation_reason": state.escalation_reason,
        "policy_relevant": state.policy_relevant,
        "historical_ticket_relevant": state.historical_ticket_relevant,
        "evidence": evidence_list
    }

    return json.dumps(context_payload, indent=2)
