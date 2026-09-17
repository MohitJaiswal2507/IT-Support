from typing import Optional
from app.agent.state import IntentCategory


class ClarificationManager:
    """
    Generates targeted clarification prompts when user queries lack sufficient actionability or context.
    """

    CLARIFICATION_PROMPTS = {
        IntentCategory.HARDWARE_DEVICE: "Could you tell me what issue you are experiencing with your laptop or device? (For example: hardware malfunction, performance issue, or replacement eligibility?)",
        IntentCategory.SOFTWARE_REQUEST: "Are you requesting software installation, access to an existing application, or software that is not in the approved catalog?",
        IntentCategory.PASSWORD_ACCESS: "Are you trying to reset your forgotten password, or is your account locked after multiple failed login attempts?",
        IntentCategory.VPN_ACCESS: "Could you clarify if your VPN credentials expired, if you are having connection errors, or if you need new remote access approval?",
        IntentCategory.WIFI_NETWORK: "Are you looking to connect to the internal corporate Wi-Fi, or do you need to generate 24-hour credentials for a guest visitor?",
        IntentCategory.ACCOUNT_ACCESS: "Could you specify what system or role permissions you are requesting access to?",
        IntentCategory.UNKNOWN: "Could you please provide more details about the IT issue or service request you need assistance with?"
    }

    @classmethod
    def get_clarification(cls, query: str, intent: IntentCategory) -> str:
        q_lower = query.lower().strip()

        # Specific custom questions based on phrase
        if "laptop" in q_lower or "computer" in q_lower:
            return "Could you tell me what issue you are experiencing with your laptop?"
        if "software" in q_lower or "app" in q_lower:
            return "Are you requesting software installation, access to an existing application, or software that is not in the approved catalog?"
        if "wifi" in q_lower or "wi-fi" in q_lower:
            return "Do you need assistance connecting your work device, or do you need guest Wi-Fi access for a visitor?"

        return cls.CLARIFICATION_PROMPTS.get(
            intent,
            "Could you provide more specific information regarding your request so I can assist you accurately?"
        )
