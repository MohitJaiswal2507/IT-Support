import re
from typing import Optional, Tuple, Dict, Any
from app.agent.state import IntentCategory


class ActionDetector:
    """
    Deterministic action request detector.
    Extracts explicit IT service actions and parameters from user queries
    before or after workflow classification.
    """

    @classmethod
    def detect_action(cls, query: str, intent: IntentCategory) -> Optional[Tuple[str, Dict[str, Any]]]:
        normalized = query.strip().lower()

        # 1. Detect explicit unsupported/malicious action requests first
        if re.search(r"\b(delete\s+(my\s+colleague'?s\s+|an?\s+)?account|drop\s+table|run_sql|rm\s+-rf)\b", normalized):
            return "DELETE_ACCOUNT", {"target": "colleague_account"}

        # 2. Check Ticket Status
        ticket_match = re.search(r"\b(TK-\d+)\b", query, re.IGNORECASE)
        if ticket_match and ("ticket" in normalized or "status" in normalized or "check" in normalized):
            return "CHECK_TICKET_STATUS", {"ticket_id": ticket_match.group(1).upper()}

        # 3. Check Account Status (Read-Only)
        if re.search(r"\b(check\s+(my\s+)?account\s+status|is\s+my\s+account\s+locked|account\s+status|check\s+my\s+account)\b", normalized):
            user_ident = "locked-user" if "locked" in normalized else "demo-user"
            return "CHECK_ACCOUNT_STATUS", {"employee_identifier": user_ident}

        # 4. Request Password Reset (Request Creation, Requires Approval)
        if re.search(r"\b(reset\s+my\s+password|request\s+(a\s+)?password\s+reset|password\s+reset\s+request|need\s+a\s+password\s+reset)\b", normalized):
            return "REQUEST_PASSWORD_RESET", {
                "employee_identifier": "demo-user",
                "reason": "Employee password reset request via IT Agent"
            }

        # 5. Check VPN Status (Read-Only)
        if re.search(r"\b(check\s+(my\s+)?vpn(\s+status)?|what\s+is\s+my\s+vpn\s+status|vpn\s+status)\b", normalized):
            user_ident = "expired-user" if "expired" in normalized else "demo-user"
            return "CHECK_VPN_STATUS", {"employee_identifier": user_ident}

        # 6. Request Laptop Replacement (Request Creation, Evaluates POL-01)
        if re.search(r"\b(request\s+(a\s+)?laptop\s+replacement|need\s+a\s+replacement\s+laptop|replace\s+my\s+laptop|replacement\s+laptop)\b", normalized):
            # Evaluate age hints
            age = 3.0
            if re.search(r"\b(more\s+than\s+three\s+years|over\s+3\s+years|3\.\d+\s+years?|4\s+years?|5\s+years?)\b", normalized):
                age = 3.5
            elif re.search(r"\b(under\s+3\s+years|less\s+than\s+three\s+years|1\s+year|2\s+years?|new\s+laptop)\b", normalized):
                age = 1.5

            has_failure = bool(re.search(r"\b(hardware\s+failure|broken|faulty|damaged|hardware\s+issue)\b", normalized))
            is_upgrade = bool(re.search(r"\b(upgrade|higher\s+spec|developer\s+edition)\b", normalized))

            return "REQUEST_LAPTOP_REPLACEMENT", {
                "employee_identifier": "demo-user",
                "asset_tag": "LT-9921",
                "device_age_years": age,
                "hardware_failure": has_failure,
                "upgrade_requested": is_upgrade,
                "justification": "Requested via IT Agent"
            }

        # 7. Ambiguous queries (e.g. "I need help with my laptop.") return None -> no action
        return None
