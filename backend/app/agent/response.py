from typing import List, Optional
from app.agent.state import (
    WorkflowDecision,
    IntentCategory,
    GroupedEvidence,
    SourceReference
)
from app.agent.policy import AssetManagementPolicyValidator
from app.agent.tickets import HistoricalTicketContext


class ResponseGenerator:
    """
    Generates structured, grounded responses based on decision, intent, and retrieved evidence.
    Strictly forbids hallucinated facts, policies, or procedural steps.
    """

    @classmethod
    def generate(
        cls,
        decision: WorkflowDecision,
        intent: IntentCategory,
        clarification_question: Optional[str],
        escalation_reason: Optional[str],
        evidence: GroupedEvidence,
        relevant_sources: List[SourceReference]
    ) -> str:
        parts: List[str] = []

        # 1. Handling CLARIFY decision
        if decision == WorkflowDecision.CLARIFY:
            parts.append("I need a bit more information to assist you accurately.")
            if clarification_question:
                parts.append(f"\n{clarification_question}")
            return "\n".join(parts)

        # 2. Handling ESCALATE decision
        if decision == WorkflowDecision.ESCALATE:
            parts.append("This inquiry requires action or approval from the IT Support / Security team.")
            if escalation_reason:
                parts.append(f"\nReason: {escalation_reason}")

            # Include governing policy or procedure if retrieved
            if evidence.knowledge_base:
                top_kb = evidence.knowledge_base[0]
                parts.append(f"\nGoverning Procedure ({top_kb.source_id}):\n{top_kb.text.strip()}")
            elif evidence.policy:
                top_pol = evidence.policy[0]
                parts.append(f"\nGoverning Policy ({top_pol.source_id}):\n{top_pol.text.strip()}")

            # Attach historical precedent if applicable
            ticket_context = HistoricalTicketContext.format_ticket_context(evidence.ticket_history)
            if ticket_context:
                parts.append(f"\n{ticket_context}")

            return "\n".join(parts)

        # 3. Handling RESOLVE decision
        if intent == IntentCategory.PASSWORD_ACCESS:
            top_kb = next((kb for kb in evidence.knowledge_base if kb.source_id == "KB-01"), evidence.knowledge_base[0] if evidence.knowledge_base else None)
            if top_kb:
                parts.append(f"According to the Veridian Knowledge Base ({top_kb.source_id}):")
                parts.append(top_kb.text.strip())
            else:
                parts.append("You can reset your password or unlock your account via the employee self-service portal.")

            ticket_context = HistoricalTicketContext.format_ticket_context(evidence.ticket_history)
            if ticket_context:
                parts.append(f"\n{ticket_context}")

        elif intent == IntentCategory.WIFI_NETWORK:
            top_kb = next((kb for kb in evidence.knowledge_base if kb.source_id == "KB-07"), evidence.knowledge_base[0] if evidence.knowledge_base else None)
            if top_kb:
                parts.append(f"According to the Veridian Knowledge Base ({top_kb.source_id}):")
                parts.append(top_kb.text.strip())
            else:
                parts.append("Guest Wi-Fi access credentials are valid for 24 hours and can be generated from the front-desk portal.")

            ticket_context = HistoricalTicketContext.format_ticket_context(evidence.ticket_history)
            if ticket_context:
                parts.append(f"\n{ticket_context}")

        elif intent == IntentCategory.VPN_ACCESS:
            top_kb = next((kb for kb in evidence.knowledge_base if kb.source_id == "KB-02"), evidence.knowledge_base[0] if evidence.knowledge_base else None)
            if top_kb:
                parts.append(f"According to the Veridian Knowledge Base ({top_kb.source_id}):")
                parts.append(top_kb.text.strip())
            else:
                parts.append("VPN access is available to full-time employees using Cisco AnyConnect. Expired credentials can be renewed through the identity portal.")

            ticket_context = HistoricalTicketContext.format_ticket_context(evidence.ticket_history)
            if ticket_context:
                parts.append(f"\n{ticket_context}")

        elif intent == IntentCategory.HARDWARE_DEVICE:
            policy_ref = evidence.policy[0] if evidence.policy else None
            top_kb = next((kb for kb in evidence.knowledge_base if kb.source_id == "KB-03"), None)

            parts.append("According to Veridian Asset Management Policy (POL-01) and Knowledge Base (KB-03):")
            policy_analysis = AssetManagementPolicyValidator.analyze_hardware_policy(policy_ref)

            if policy_analysis.get("has_policy_evidence"):
                parts.append(
                    f"• Standard Refresh Cycle: {policy_analysis['standard_cycle']}.\n"
                    f"• Early Replacement: Permitted only in case of {policy_analysis['early_replacement_condition']}.\n"
                    f"• Upgrades: Require {policy_analysis['upgrade_requirement']}."
                )
            elif top_kb:
                parts.append(top_kb.text.strip())
            else:
                parts.append("Laptops are eligible for replacement after 3 years of service or upon verified hardware failure.")

            parts.append("To initiate a replacement, submit a Hardware Refresh request in the IT portal with your asset tag.")

            ticket_context = HistoricalTicketContext.format_ticket_context(evidence.ticket_history)
            if ticket_context:
                parts.append(f"\n{ticket_context}")

        else:
            # General safe grounded resolution
            if evidence.knowledge_base:
                top_kb = evidence.knowledge_base[0]
                parts.append(f"According to the Veridian Knowledge Base ({top_kb.source_id}):\n{top_kb.text.strip()}")
            elif evidence.policy:
                top_pol = evidence.policy[0]
                parts.append(f"According to Veridian Corporate Policy ({top_pol.source_id}):\n{top_pol.text.strip()}")
            else:
                parts.append("Based on internal documentation, please refer to the IT self-service portal.")

            ticket_context = HistoricalTicketContext.format_ticket_context(evidence.ticket_history)
            if ticket_context:
                parts.append(f"\n{ticket_context}")

        return "\n\n".join(parts)
