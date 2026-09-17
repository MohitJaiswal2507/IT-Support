import logging
import os
from typing import Optional
from app.llm.base import LLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    """
    OpenAI-backed implementation of LLMProvider using official OpenAI Python SDK.
    Strictly adheres to standard chat completion API conventions.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self._client = None

    @property
    def client(self):
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured or is empty.")
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except Exception as exc:
                logger.error(f"Failed to initialize OpenAI client: {exc}")
                raise
        return self._client

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is missing.")

        logger.debug(f"Calling OpenAI model {self.model}...")
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        content = response.choices[0].message.content or ""
        return content
