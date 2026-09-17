import logging
from app.agent.state import (
    AgentState,
    WorkflowDecision,
    IntentCategory,
    GroupedEvidence
)
from app.agent.understanding import (
    normalize_query,
    is_empty_or_unusable,
    is_underspecified_query
)
from app.agent.classifier import classify_intent
from app.agent.clarification import ClarificationManager
from app.agent.evidence import retrieve_and_group_evidence
from app.agent.decision import DecisionEngine
from app.agent.response import ResponseGenerator

logger = logging.getLogger(__name__)


class AgentWorkflow:
    """
    Orchestrates the deterministic, grounded IT Support Agent workflow.
    """

    def process(self, raw_query: str) -> AgentState:
        state = AgentState(original_query=raw_query)

        # 1. Request Understanding & Normalization
        normalized = normalize_query(raw_query)
        state.normalized_query = normalized

        if is_empty_or_unusable(normalized):
            state.decision = WorkflowDecision.CLARIFY
            state.clarification_required = True
            state.clarification_question = "Your inquiry is empty or contains no usable text. Please describe your IT request."
            state.response = state.clarification_question
            return state

        # Check for underspecified / single-topic query
        is_underspecified, _ = is_underspecified_query(normalized)

        # 2. Intent Classification
        intent, confidence, reasoning = classify_intent(normalized)
        state.intent = intent
        state.confidence = confidence
        state.intent_reasoning = reasoning

        # 3. Early Clarification Check
        if is_underspecified:
            state.clarification_required = True
            state.clarification_question = ClarificationManager.get_clarification(normalized, intent)
            state.decision = WorkflowDecision.CLARIFY
            state.response = ResponseGenerator.generate(
                decision=state.decision,
                intent=state.intent,
                clarification_question=state.clarification_question,
                escalation_reason=None,
                evidence=GroupedEvidence(),
                relevant_sources=[]
            )
            return state

        # 4. Retrieval Integration
        grouped_evidence, flat_sources, retrieval_ok = retrieve_and_group_evidence(normalized, top_k=5)
        state.evidence = grouped_evidence
        state.relevant_sources = flat_sources
        state.policy_relevant = len(grouped_evidence.policy) > 0
        state.historical_ticket_relevant = len(grouped_evidence.ticket_history) > 0

        # 5. Workflow Decision Engine
        decision, escalation_reason = DecisionEngine.evaluate_decision(
            query=normalized,
            intent=intent,
            confidence=confidence,
            is_underspecified=False,
            evidence=grouped_evidence,
            retrieval_ok=retrieval_ok
        )
        state.decision = decision
        state.escalation_reason = escalation_reason

        if decision == WorkflowDecision.CLARIFY:
            state.clarification_required = True
            state.clarification_question = ClarificationManager.get_clarification(normalized, intent)

        # 6. Grounded Response Generation
        state.response = ResponseGenerator.generate(
            decision=state.decision,
            intent=state.intent,
            clarification_question=state.clarification_question,
            escalation_reason=state.escalation_reason,
            evidence=state.evidence,
            relevant_sources=state.relevant_sources
        )

        return state


_workflow = AgentWorkflow()


def run_agent_workflow(query: str) -> AgentState:
    return _workflow.process(query)
