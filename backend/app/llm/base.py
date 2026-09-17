from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel, Field


class LLMResponse(BaseModel):
    """
    Structured response expected from the LLM provider.
    """
    answer: str = Field(..., description="Grounded natural language answer to the user")
    source_ids: List[str] = Field(default_factory=list, description="IDs of sources cited in the answer")
    historical_context_used: bool = Field(default=False, description="Whether historical ticket precedent was cited")


class LLMProvider(ABC):
    """
    Abstract interface for LLM providers.
    Ensures clean decoupling between the workflow and specific model vendors.
    """

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """
        Generate raw response text (structured JSON expected) from system and user prompts.
        """
        pass
