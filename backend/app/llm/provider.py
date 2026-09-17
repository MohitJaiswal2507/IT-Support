import logging
import os
from typing import Optional
from app.core.config import settings
from app.llm.base import LLMProvider
from app.llm.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

_provider_override: Optional[LLMProvider] = None


def get_llm_provider() -> Optional[LLMProvider]:
    """
    Returns the configured LLM provider instance, or None if no API key is set.
    Supports dependency injection / mocking via set_llm_provider.
    """
    global _provider_override
    if _provider_override is not None:
        return _provider_override

    provider_type = (getattr(settings, "LLM_PROVIDER", None) or os.getenv("LLM_PROVIDER", "openai")).lower()
    api_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY", "")
    model = getattr(settings, "OPENAI_MODEL", None) or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        logger.info("OPENAI_API_KEY is not configured; using deterministic fallback.")
        return None

    if provider_type == "openai":
        return OpenAIProvider(api_key=api_key, model=model)
    else:
        logger.warning(f"Unsupported LLM provider: {provider_type}")
        return None


def set_llm_provider(provider: Optional[LLMProvider]) -> None:
    """
    Sets a global provider override, primarily used for test mocking.
    """
    global _provider_override
    _provider_override = provider


def reset_llm_provider() -> None:
    """
    Resets the provider override back to default environment resolution.
    """
    global _provider_override
    _provider_override = None
