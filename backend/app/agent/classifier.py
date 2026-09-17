import re
from typing import Tuple
from app.agent.state import IntentCategory


class IntentClassifier:
    """
    Deterministic intent classifier matching user queries to Veridian IT service domains.
    """

    INTENT_PATTERNS = {
        IntentCategory.PASSWORD_ACCESS: {
            "primary": [
                r"\bpassword\b", r"\blocked\b", r"\blockout\b", r"\bunlock\b",
                r"\bpasscode\b", r"\bcredential(s)?\s+locked\b"
            ],
            "secondary": [r"\blogin\b", r"\bself-service\b", r"\bfailed\s+attempts?\b"]
        },
        IntentCategory.VPN_ACCESS: {
            "primary": [
                r"\bvpn\b", r"\bremote\s+access\b", r"\bvpn\s+credential(s)?\b",
                r"\bvpn\s+certificate\b", r"\bcisco\b", r"\banyconnect\b"
            ],
            "secondary": [r"\bexpired\b", r"\bcontractor\s+vpn\b", r"\btoken\b"]
        },
        IntentCategory.SOFTWARE_REQUEST: {
            "primary": [
                r"\bsoftware\b", r"\bapplication\b", r"\binstall\b",
                r"\bcatalog\b", r"\bnon-catalog\b", r"\blicense\b",
                r"\bdeveloper\s+tools?\b", r"\bsoftware\s+request\b"
            ],
            "secondary": [r"\bapproved\b", r"\bunapproved\b", r"\bdownload\b"]
        },
        IntentCategory.WIFI_NETWORK: {
            "primary": [
                r"\bwifi\b", r"\bwi-fi\b", r"\bguest\s+wifi\b", r"\bguest\s+network\b",
                r"\bvisitor\b", r"\bwireless\b", r"\bhotspot\b"
            ],
            "secondary": [r"\bconnect\b", r"\bnetwork\b", r"\bportal\b", r"\bcredentials?\b"]
        },
        IntentCategory.HARDWARE_DEVICE: {
            "primary": [
                r"\blaptop\b", r"\bcomputer\b", r"\bmonitor\b", r"\bdevice\b",
                r"\bhardware\b", r"\breplacement\b", r"\brefresh\b", r"\bold\s+laptop\b",
                r"\b3\s*years?\b", r"\bscreen\b", r"\badapter\b", r"\bkeyboard\b",
                r"\bmouse\b", r"\bdocking\s+station\b", r"\bflicker(ing)?\b"
            ],
            "secondary": [r"\bbroken\b", r"\bupgrade\b", r"\bdamaged\b", r"\bcycle\b"]
        },
        IntentCategory.ACCOUNT_ACCESS: {
            "primary": [
                r"\badmin\s+access\b", r"\belevated\s+rights\b", r"\bpermission(s)?\b",
                r"\bmfa\b", r"\b2fa\b", r"\bauthenticator\b", r"\bbadge\b", r"\baccount\b"
            ],
            "secondary": [r"\bapproval\b", r"\bsecurity\s+review\b", r"\brole\b"]
        },
        IntentCategory.GENERAL_IT: {
            "primary": [
                r"\bit\s+support\b", r"\bhelpdesk\b", r"\b(it\s+|support\s+)?ticket\s*(status|number|update|history)\b",
                r"\b(open|create|submit|log|check)\s+(a\s+)?(support\s+|it\s+)?ticket\b", r"\bticket\s+tk-\b",
                r"\boffice\s+equipment\b", r"\bwork-from-home\b", r"\bwfh\b", r"\bergonomic\b"
            ],
            "secondary": [r"\bpolicy\b", r"\bcontact\b", r"\bhours\b"]
        }
    }

    def classify(self, query: str) -> Tuple[IntentCategory, float, str]:
        """
        Evaluates query text against deterministic intent patterns and calculates confidence.
        """
        q = query.lower().strip()
        if not q:
            return IntentCategory.UNKNOWN, 0.0, "Empty query provided."

        best_intent = IntentCategory.UNKNOWN
        best_score = 0.0
        best_reason = "No matching domain patterns detected."

        for intent, patterns in self.INTENT_PATTERNS.items():
            primary_matches = sum(1 for p in patterns["primary"] if re.search(p, q))
            secondary_matches = sum(1 for p in patterns.get("secondary", []) if re.search(p, q))

            if primary_matches > 0:
                # Score calculation based on match count
                confidence = min(1.0, 0.65 + (primary_matches * 0.15) + (secondary_matches * 0.05))
                if confidence > best_score:
                    best_score = confidence
                    best_intent = intent
                    best_reason = f"Matched {primary_matches} primary keywords for {intent.value}."
            elif secondary_matches >= 2 and best_score < 0.5:
                confidence = 0.50
                best_score = confidence
                best_intent = intent
                best_reason = f"Matched multiple contextual secondary keywords for {intent.value}."

        if best_score < 0.4:
            return IntentCategory.UNKNOWN, 0.2, "Query could not be mapped confidently to a specific service domain."

        return best_intent, round(best_score, 2), best_reason


_classifier = IntentClassifier()


def classify_intent(query: str) -> Tuple[IntentCategory, float, str]:
    return _classifier.classify(query)
