# Phase 4 Completion Report: Grounded LLM Response Generation Layer

**Project**: Veridian Internal IT Support Agent  
**Assignment**: Assignment 2 — Internal Service Agent  
**Current Phase**: Phase 4 — Grounded LLM Response Generation & Fallback Architecture  
**Branch**: `Phase_4`  
**Date**: September 17, 2026  
**Status**: Completed and Fully Verified  

---

## 1. Phase Objective

The objective of Phase 4 is to introduce an LLM-powered response generation layer on top of the deterministic Phase 3 Agent Architecture and Workflow Engine, adhering to the fundamental principle that **the LLM is NOT the decision-maker**.

The LLM is strictly constrained:
- It **does not** classify intent.
- It **does not** decide `RESOLVE`, `CLARIFY`, or `ESCALATE`.
- It **does not** execute tools or query databases.
- It **does not** perform retrieval (Phase 2 FAISS remains the sole retrieval layer).
- It **does not** invent policies or claim actions were completed.
- It converts the structured Phase 3 state and approved evidence into a clear, natural-language response.
- If the LLM provider is unavailable, times out, throws an exception, produces invalid JSON, references hallucinated sources, or makes unsupported action claims, the system seamlessly falls back to the deterministic Phase 3 grounded response without breaking the API or frontend.

---

## 2. Branch Name

- **Active Branch**: `Phase_4`

---

## 3. Files Added and Modified

### Files Added:
- `backend/app/llm/__init__.py`: Package export file for provider abstraction, response models, validator, and generator.
- `backend/app/llm/base.py`: Abstract `LLMProvider` interface and `LLMResponse` Pydantic model.
- `backend/app/llm/openai_provider.py`: Official OpenAI SDK implementation with `response_format={"type": "json_object"}`.
- `backend/app/llm/provider.py`: Provider factory, configuration resolver, and test dependency injection override registry (`set_llm_provider`, `reset_llm_provider`).
- `backend/app/llm/prompts.py`: System prompt ("Veridian Internal IT Support Assistant") and structured user prompt builder.
- `backend/app/llm/validator.py`: `GroundingValidator` enforcing answer existence, source ID grounding against supplied evidence, unsupported action claim rejection, and decision consistency.
- `backend/app/llm/generator.py`: `LLMResponseGenerator` orchestrating prompt assembly, provider execution, output cleanup/parsing, deterministic validation, and automatic Phase 3 fallback.
- `backend/tests/test_llm.py`: 12 automated test cases covering Scenarios 1–8, provider failure fallback, invalid source rejection, unsupported action claim rejection, and missing API key operation.
- `docs/phase-4-completion-report.md`: Comprehensive completion report.

### Files Modified:
- `backend/app/core/config.py`: Added `LLM_PROVIDER`, `OPENAI_API_KEY`, and `OPENAI_MODEL` settings.
- `backend/app/agent/state.py`: Added `response_source` (`llm` or `deterministic_fallback`) and `relevant_source_ids` to `AgentState`.
- `backend/app/agent/workflow.py`: Integrated stage 7 (`LLMResponseGenerator.generate_response`) preserving stage 6 deterministic templates as baseline fallback.
- `backend/app/schemas/agent.py`: Added `response_source: str` and `relevant_sources: List[str]` to `AgentQueryResponse`.
- `backend/app/api/routes/agent.py`: Populated `response_source` and `relevant_sources` in the response model.
- `backend/requirements.txt`: Added `openai>=1.0.0`.
- `backend/.env.example`: Documented `LLM_PROVIDER`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.
- `frontend/src/lib/api.ts`: Updated `AgentQueryResponse` interface with `response_source` and `relevant_sources`.
- `frontend/src/components/AgentQueryCard.tsx`: Added visual badge indicators (`AI-generated from verified IT sources` vs `Using verified fallback response`) and updated Phase 4 header.

---

## 4. Architecture

```
USER QUERY
    ↓
REQUEST UNDERSTANDING & NORMALIZATION (app.agent.understanding)
    ↓
INTENT CLASSIFICATION (app.agent.classifier)
    ↓
CLARIFICATION CHECK (app.agent.clarification)
    ↓
PHASE 2 FAISS RETRIEVAL (app.retrieval.service)
    ↓
EVIDENCE GROUPING (KB, Policy, Ticket Precedents)
    ↓
POLICY / HISTORICAL TICKET CONTEXT HANDLING (POL-01, TK Precedents)
    ↓
DETERMINISTIC DECISION ENGINE (RESOLVE / CLARIFY / ESCALATE)
    ↓
PHASE 3 DETERMINISTIC TEMPLATE RESPONSE (app.agent.response)
    ↓
LLM RESPONSE GENERATOR (app.llm.generator)
    ├─ Provider Available? ──No──→ Use Deterministic Fallback
    ├─ OpenAI Completion (Structured JSON)
    └─ GROUNDING VALIDATOR (app.llm.validator)
            ├─ Answer Valid & Non-Empty?
            ├─ All Cited Sources in Evidence? (Reject "KB-999")
            ├─ Unsupported Action Claims? (Reject "I unlocked account")
            └─ Decision Consistent?
                    ├─ Passed ──→ Output LLM Response ("llm")
                    └─ Failed ──→ Fallback to Phase 3 Response ("deterministic_fallback")
```

---

## 5. LLM Provider Implementation

Decoupled provider interface in `backend/app/llm/base.py`:
```python
class LLMProvider(ABC):
    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate raw response text (structured JSON expected)."""
        pass
```

`OpenAIProvider` in `backend/app/llm/openai_provider.py` utilizes the official OpenAI SDK:
- Model defaults to `gpt-4o-mini` (configurable via `OPENAI_MODEL`).
- Temperature set to `0.0` for maximum reproducibility.
- Utilizes `response_format={"type": "json_object"}`.
- Lazily instantiates `OpenAI(api_key=...)` only when invoked.

---

## 6. Prompt Design

The system prompt in `backend/app/llm/prompts.py` strictly configures the model identity:
- **Identity**: `"Veridian Internal IT Support Assistant"`
- **Strict Grounding**: Only answer from supplied evidence; do not invent procedures or policies.
- **Authoritative Sources**: Official KB and Policy are binding; historical tickets are precedent only.
- **Historical Disclaimer**: Must prefix ticket citations with `"Historical context: ..."` and never present precedent as current policy.
- **Decision Binding**:
  - `CLARIFY`: Ask the supplied clarification question. Never guess.
  - `ESCALATE`: Explain the escalation reason and escalation path.
  - `RESOLVE`: Provide the supported solution from verified evidence.
- **Action Claim Ban**: Never assert actions were executed (e.g., ticket created, account unlocked, software installed).

---

## 7. Structured Output

The model is required to return valid JSON matching `LLMResponse`:
```json
{
  "answer": "Grounded natural language answer to employee query.",
  "source_ids": ["KB-01", "POL-01"],
  "historical_context_used": false
}
```

The generator strips any Markdown code fences (```` ```json ````) and deserializes directly into Pydantic models. If parsing fails, it safely defaults to the deterministic fallback.

---

## 8. Grounding Validation

`GroundingValidator.validate(response, state)` enforces 4 deterministic layers:
1. **Non-Empty Content**: Verifies `answer` is non-empty string.
2. **Strict Source Grounding**:
   - Collects all allowed source IDs from `state.evidence.knowledge_base`, `policy`, and `ticket_history`.
   - Rejects any response whose `source_ids` or answer body mentions an unverified ID (e.g. `KB-999`).
3. **Safety / Action Claim Regex Filters**:
   - Blocks phrases claiming completed actions:
     - `"I have unlocked your account"` / `"account has been unlocked"`
     - `"I installed software"` / `"software has been installed"`
     - `"laptop replacement has been approved"` / `"I approved your laptop"`
     - `"I created a ticket"` / `"ticket has been created"`
     - `"I fixed your VPN"` / `"VPN has been fixed"`
     - `"approval was granted"`
4. **Decision Consistency**: Ensures `CLARIFY` queries do not fabricate answers to out-of-scope inquiries (such as vacation booking).

---

## 9. Fallback Behavior

Whenever:
- `OPENAI_API_KEY` is missing or empty,
- The provider raises a network, timeout, or rate-limit error,
- JSON decoding fails,
- An invalid or hallucinated source ID is cited,
- An unsupported action completion is claimed,

The generator logs a descriptive warning (without logging secrets or PII) and returns:
- `response`: Pre-computed Phase 3 deterministic response.
- `response_source`: `"deterministic_fallback"`
- `relevant_sources`: Verified source IDs from Phase 2 retrieval.

The FastAPI endpoint succeeds with HTTP 200, ensuring high reliability for end users.

---

## 10. API Changes

`POST /api/agent/query` maintains 100% backward compatibility while returning new metadata:
```json
{
  "query": "My account is locked after too many password attempts.",
  "intent": "PASSWORD_ACCESS",
  "confidence": 0.95,
  "decision": "RESOLVE",
  "clarification_required": false,
  "clarification_question": null,
  "response": "According to the Veridian Knowledge Base (KB-01)...",
  "response_source": "llm",
  "relevant_sources": ["KB-01"],
  "sources": [
    {
      "source_id": "KB-01",
      "source_type": "knowledge_base",
      "score": 0.884,
      "title": "Password Reset and Account Unlock Procedures"
    }
  ],
  "escalation_reason": null
}
```

---

## 11. Frontend Changes

`frontend/src/components/AgentQueryCard.tsx`:
- Header updated: **Phase 4 — Veridian IT Support Agent** (*"Grounded response generation with deterministic workflow controls & fallback"*).
- Response header badge:
  - For `response_source === "llm"`:
    `AI-generated from verified IT sources` with Sparkles icon in emerald styling.
  - For `response_source === "deterministic_fallback"`:
    `Using verified fallback response` with ShieldCheck icon in slate styling.
- All existing decision badges, intent chips, clarification warnings, escalation banners, and source cards remain fully operational.

---

## 12. Test Results

The complete automated test suite was executed via `.venv/Scripts/python.exe -m pytest -v`:

```text
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\usern\Downloads\INTERNSHIP\IT-Support\backend
configfile: pytest.ini
collected 54 items

tests/test_agent.py::test_request_normalization PASSED                   [  1%]
tests/test_agent.py::test_underspecified_query_detection PASSED          [  3%]
tests/test_agent.py::test_intent_classification_domains PASSED           [  5%]
tests/test_agent.py::test_clarification_prompts PASSED                   [  7%]
tests/test_agent.py::test_evidence_grouping PASSED                       [  9%]
tests/test_agent.py::test_scenario_1_password_lockout PASSED             [ 11%]
tests/test_agent.py::test_scenario_2_unapproved_software PASSED          [ 12%]
tests/test_agent.py::test_scenario_3_guest_wifi PASSED                   [ 14%]
tests/test_agent.py::test_scenario_4_vpn_credentials_expired PASSED      [ 16%]
tests/test_agent.py::test_scenario_5_laptop_replacement_policy PASSED    [ 18%]
tests/test_agent.py::test_scenario_6_ambiguous_query_clarification PASSED [ 20%]
tests/test_agent.py::test_scenario_7_unknown_query_no_hallucination PASSED [ 22%]
tests/test_agent.py::test_scenario_8_ticket_treated_as_historical_context PASSED [ 24%]
tests/test_agent.py::test_empty_query_api_validation PASSED              [ 25%]
tests/test_agent.py::test_invalid_request_body_validation PASSED         [ 27%]
tests/test_data_layer.py::test_seed_idempotency_and_counts PASSED        [ 29%]
tests/test_data_layer.py::test_health_endpoint PASSED                    [ 31%]
tests/test_data_layer.py::test_list_knowledge_base PASSED                [ 33%]
tests/test_data_layer.py::test_get_knowledge_base_article_by_id PASSED   [ 35%]
tests/test_data_layer.py::test_get_knowledge_base_article_not_found PASSED [ 37%]
tests/test_data_layer.py::test_list_policies PASSED                      [ 38%]
tests/test_data_layer.py::test_get_policy_by_id PASSED                   [ 40%]
tests/test_data_layer.py::test_get_policy_not_found PASSED               [ 42%]
tests/test_data_layer.py::test_list_employee_requests PASSED             [ 44%]
tests/test_data_layer.py::test_get_employee_request_by_id PASSED         [ 46%]
tests/test_data_layer.py::test_get_employee_request_not_found PASSED     [ 48%]
tests/test_data_layer.py::test_list_tickets PASSED                       [ 50%]
tests/test_data_layer.py::test_get_ticket_by_id PASSED                   [ 51%]
tests/test_data_layer.py::test_ticket_filtering_active PASSED            [ 53%]
tests/test_data_layer.py::test_get_ticket_not_found PASSED               [ 55%]
tests/test_llm.py::test_1_password_lockout_llm PASSED                    [ 57%]
tests/test_llm.py::test_2_non_catalog_software_preserves_escalation PASSED [ 59%]
tests/test_llm.py::test_3_guest_wifi PASSED                              [ 61%]
tests/test_llm.py::test_4_expired_vpn_with_historical_context PASSED     [ 62%]
tests/test_llm.py::test_5_old_laptop_respects_pol01 PASSED               [ 64%]
tests/test_llm.py::test_6_ambiguous_laptop_clarification PASSED          [ 66%]
tests/test_llm.py::test_7_unknown_query_out_of_scope PASSED              [ 68%]
tests/test_llm.py::test_8_historical_ticket_context_identified PASSED    [ 70%]
tests/test_llm.py::test_9_llm_failure_falls_back_to_deterministic PASSED [ 72%]
tests/test_llm.py::test_10_invalid_source_rejected PASSED                [ 74%]
tests/test_llm.py::test_11_unsupported_action_claim_rejected PASSED      [ 75%]
tests/test_llm.py::test_12_missing_api_key_deterministic_fallback PASSED [ 77%]
tests/test_retrieval.py::test_document_loader_counts PASSED              [ 79%]
tests/test_retrieval.py::test_chunking_deterministic PASSED              [ 81%]
tests/test_retrieval.py::test_retrieval_endpoint_validation PASSED       [ 83%]
tests/test_retrieval.py::test_top_k_parameter PASSED                     [ 85%]
tests/test_retrieval.py::test_source_type_filtering PASSED               [ 87%]
tests/test_retrieval.py::test_semantic_scenario_password_lockout PASSED  [ 88%]
tests/test_retrieval.py::test_semantic_scenario_unapproved_software PASSED [ 90%]
tests/test_retrieval.py::test_semantic_scenario_visitor_wifi PASSED      [ 92%]
tests/test_retrieval.py::test_semantic_scenario_vpn_credentials PASSED   [ 94%]
tests/test_retrieval.py::test_semantic_scenario_laptop_replacement PASSED [ 96%]
tests/test_retrieval.py::test_ticket_metadata_preservation PASSED        [ 98%]
tests/test_retrieval.py::test_score_ordering PASSED                      [100%]

======================= 54 passed in 14.15s =======================
```

---

## 13. Regression Results

All existing unit, integration, and scenario tests passed without failure:
- **Phase 0 & 1 Data APIs**: 15 tests passed.
- **Phase 2 FAISS Vector Store & Retrieval**: 12 tests passed.
- **Phase 3 Deterministic Agent Pipeline**: 15 tests passed.
- **Phase 4 LLM & Grounding Validator**: 12 tests passed.
- **Total Backend Tests**: **54 passed, 0 failed (100% pass rate)**.
- **Frontend Production Build**:
  `npm run build` completed cleanly in Turbopack without TypeScript or bundle errors:
  ```text
  ✓ Compiled successfully in 665ms
  ✓ Generating static pages using 4 workers (3/3)
  ```

---

## 14. Security Considerations

- **API Keys Server-Side Only**: `OPENAI_API_KEY` is read via backend environment variables; it is never exposed in API schemas or frontend bundles.
- **Mocking for Safe CI/CD**: All automated test cases execute with zero outbound API calls, avoiding quota consumption, network latency, and accidental key leakage.
- **Injection Mitigation**: The LLM prompt enforces structured JSON output and disallows free-form code execution.
- **PII & Precedent Protection**: Precedent tickets are formatted with privacy redaction and explicit non-authoritative notices.

---

## 15. Limitations

- **Single-Turn Interaction**: Conversational context across multiple query turns is out of scope for Phase 4.
- **Local Fallback**: In environments without a configured `OPENAI_API_KEY`, the agent automatically uses deterministic templates.
- **Read-Only**: The agent does not create tickets, execute database writes, or trigger automated account provisioning.

---

## 16. Explicit Compliance Confirmations

- [x] **No LangChain** used anywhere in the codebase.
- [x] **No LangGraph** used anywhere in the codebase.
- [x] **No autonomous tool calling** permitted.
- [x] **No LLM-controlled policy decisions** (workflow engine controls all decisions).
- [x] **No LLM-controlled retrieval** (Phase 2 FAISS remains the sole retrieval mechanism).
- [x] **No database mutations** initiated by the LLM layer.
- [x] **No API keys or provider secrets exposed** to the frontend.
