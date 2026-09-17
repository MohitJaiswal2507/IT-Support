import json
import logging
from typing import Tuple, List, Optional
from app.agent.state import AgentState
from app.llm.base import LLMProvider, LLMResponse
from app.llm.provider import get_llm_provider
from app.llm.prompts import SYSTEM_PROMPT, build_user_prompt
from app.llm.validator import GroundingValidator

logger = logging.getLogger(__name__)


class LLMResponseGenerator:
    """
    Generates grounded responses by orchestrating prompt construction,
    provider invocation, structured parsing, and deterministic grounding validation.
    Falls back gracefully to Phase 3 deterministic response upon any failure.
    """

    @classmethod
    def generate_response(
        cls,
        state: AgentState,
        provider: Optional[LLMProvider] = None
    ) -> Tuple[str, str, List[str]]:
        """
        Returns:
            Tuple of (response_text, response_source, relevant_source_ids)
            response_source is either 'llm' or 'deterministic_fallback'.
        """
        fallback_source_ids = [src.source_id for src in state.relevant_sources]
        deterministic_response = state.response

        # 1. Resolve Provider
        active_provider = provider or get_llm_provider()
        if active_provider is None:
            logger.info("LLM provider unavailable; maintaining deterministic fallback response.")
            return deterministic_response, "deterministic_fallback", fallback_source_ids

        # 2. Build Prompts
        try:
            system_prompt = SYSTEM_PROMPT
            user_prompt = build_user_prompt(state)
        except Exception as exc:
            logger.error(f"Error constructing LLM prompt: {exc}. Using deterministic fallback.")
            return deterministic_response, "deterministic_fallback", fallback_source_ids

        # 3. Call Provider
        try:
            raw_output = active_provider.generate(system_prompt, user_prompt)
        except Exception as exc:
            logger.warning(f"LLM provider generation failed: {exc}. Falling back to deterministic response.")
            return deterministic_response, "deterministic_fallback", fallback_source_ids

        # 4. Parse Structured Output
        try:
            # Strip markdown code fencing if present
            cleaned_output = raw_output.strip()
            if cleaned_output.startswith("```json"):
                cleaned_output = cleaned_output[7:]
            elif cleaned_output.startswith("```"):
                cleaned_output = cleaned_output[3:]
            if cleaned_output.endswith("```"):
                cleaned_output = cleaned_output[:-3]
            cleaned_output = cleaned_output.strip()

            parsed_json = json.loads(cleaned_output)
            llm_response = LLMResponse(**parsed_json)
        except Exception as exc:
            logger.warning(f"Failed to parse LLM structured output: {exc}. Raw output: {raw_output[:200]}. Using fallback.")
            return deterministic_response, "deterministic_fallback", fallback_source_ids

        # 5. Deterministic Grounding & Safety Validation
        is_valid, validation_reason = GroundingValidator.validate(llm_response, state)
        if not is_valid:
            logger.warning(f"LLM grounding validation rejected output: {validation_reason}. Using fallback.")
            return deterministic_response, "deterministic_fallback", fallback_source_ids

        # 6. Success
        final_source_ids = llm_response.source_ids if llm_response.source_ids else fallback_source_ids
        return llm_response.answer, "llm", final_source_ids
