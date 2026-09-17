import re
from typing import Tuple


def normalize_query(query: str) -> str:
    """
    Trims whitespace and standardizes formatting while preserving meaning.
    """
    if not query:
        return ""
    # Collapse multiple whitespaces and trim
    cleaned = re.sub(r"\s+", " ", query.strip())
    return cleaned


def is_empty_or_unusable(query: str) -> bool:
    """
    Checks if a query is empty, whitespace-only, or consists solely of punctuation.
    """
    if not query or not query.strip():
        return True
    # Strip common punctuation
    alphanumeric = re.sub(r"[^\w\s]", "", query.strip())
    return len(alphanumeric.strip()) == 0


def is_underspecified_query(query: str) -> Tuple[bool, str]:
    """
    Detects if a query contains insufficient information to perform useful resolution
    without prior clarification.
    Examples of underspecified queries: 'my laptop', 'software', 'laptop', 'wifi', 'computer'.
    """
    cleaned = re.sub(r"[^\w\s]", "", query.strip().lower())
    words = [w for w in cleaned.split() if w]

    # Specific common underspecified patterns
    underspecified_exact = {
        "my laptop", "laptop", "the laptop", "computer", "my computer",
        "software", "app", "application", "install",
        "wifi", "wi-fi", "internet", "network",
        "vpn", "access", "password", "login",
        "help", "issue", "problem", "broken"
    }

    if cleaned in underspecified_exact:
        return True, cleaned

    # Ultra-short query with no verbs or action keywords (e.g. 1-2 words)
    if len(words) <= 2:
        subject_only = {"laptop", "computer", "pc", "software", "program", "wifi", "vpn", "monitor", "mouse", "keyboard"}
        if any(w in subject_only for w in words):
            action_words = {"locked", "reset", "forgot", "expired", "broken", "cracked", "slow", "old", "replace", "install", "download", "request"}
            if not any(w in action_words for w in words):
                return True, " ".join(words)

    return False, ""
