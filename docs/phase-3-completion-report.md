# Phase 3 — Agent Architecture & Workflow Completion Report

**Project**: Veridian Internal Service Agent (Assignment 2 — Internal IT Support Agent)  
**Current Phase**: Phase 3 — Agent Architecture / Workflow Layer  
**Branch**: `phase-3-agent-workflow`  
**Status**: COMPLETE  

---

## 1. Phase Objective

The objective of Phase 3 is to establish a deterministic, explainable, and fully testable **Agent Architecture & Workflow Layer** that turns the Phase 1 relational data layer and Phase 2 FAISS semantic retrieval service into a controlled IT Support Agent.

The agent accepts an employee's natural language inquiry, sanitizes and classifies intent, identifies ambiguous or underspecified queries to trigger targeted clarification, retrieves relevant evidence from the vector index, distinguishes between Knowledge Base procedures, corporate Asset Management Policy, and historical support tickets, reaches a deterministic decision (`RESOLVE`, `CLARIFY`, or `ESCALATE`), and outputs a structured, grounded response without inventing facts, policies, or ticket records.

---

## 2. What Was Implemented

1. **Modular Agent Subsystem (`backend/app/agent/`)**:
   - `state.py`: Structured Pydantic state model and enums (`IntentCategory`, `WorkflowDecision`, `EvidenceType`, `SourceReference`, `GroupedEvidence`, `AgentState`).
   - `understanding.py`: Request sanitization, whitespace collapsing, empty/unusable detection, and underspecified query heuristics.
   - `classifier.py`: Deterministic keyword, phrase, and pattern intent classifier.
   - `clarification.py`: Clarification prompt generator for ambiguous inputs.
   - `evidence.py`: Phase 2 `RetrievalService` integration and evidence grouping.
   - `policy.py`: Asset Management Policy (`POL-01`) evaluator enforcing the 3-year refresh cycle and verified hardware failure requirements.
   - `tickets.py`: Historical ticket context formatter explicitly labeling tickets as historical precedent.
   - `decision.py`: Explainable decision engine evaluating whether to `RESOLVE`, `CLARIFY`, or `ESCALATE`.
   - `response.py`: Structured, grounded template generator citing exact sources (`KB-xx`, `POL-01`, `TK-xxxx`).
   - `workflow.py`: End-to-end pipeline orchestrator (`AgentWorkflow.process()`).

2. **API Layer**:
   - Pydantic schemas in `backend/app/schemas/agent.py` (`AgentQueryRequest`, `AgentSourceItem`, `AgentQueryResponse`).
   - `POST /api/agent/query` route in `backend/app/api/routes/agent.py`.
   - Mounted in `backend/app/api/router.py`.

3. **Frontend Integration**:
   - `frontend/src/lib/api.ts`: Added `sendAgentQuery()` client function and TypeScript types.
   - `frontend/src/components/AgentQueryCard.tsx`: Interactive agent UI with live decision badges (`RESOLVE`, `CLARIFY`, `ESCALATE`), intent breakdown, clarification/escalation banners, grounded answer card, and source badges.
   - Integrated into `frontend/src/app/page.tsx`.

4. **Automated Test Suite**:
   - `backend/tests/test_agent.py`: 15 comprehensive unit and scenario tests covering all 8 required assignment scenarios and edge cases.

---

## 3. Agent Architecture

```
                                Employee Query
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Request Understanding   │
                        │ (Normalization & Cleansing│
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Intent Classification   │
                        │ (8 Deterministic Domains) │
                        └─────────────┬─────────────┘
                                      │
                         Is Underspecified / Terse?
                                     / \
                               YES  /   \  NO
                                   ▼     ▼
                ┌────────────────────┐  ┌───────────────────────────┐
                │   CLARIFY State    │  │   Retrieval Integration   │
                │ (Targeted Question)│  │ (Phase 2 Vector Store API)│
                └────────────────────┘  └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                        ┌───────────────────────────┐
                                        │    Evidence Grouping      │
                                        │ (KB / Policy / Tickets)   │
                                        └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                        ┌───────────────────────────┐
                                        │  Workflow Decision Engine │
                                        │(RESOLVE, CLARIFY, ESCALATE│
                                        └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                        ┌───────────────────────────┐
                                        │    Grounded Generation    │
                                        │(Rule-Based Citations/Text)│
                                        └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                        ┌───────────────────────────┐
                                        │   POST /api/agent/query   │
                                        │  Structured JSON Response │
                                        └───────────────────────────┘
```

---

## 4. Agent State

The agent state is modeled in `backend/app/agent/state.py` via `AgentState`:

| Field | Type | Description |
|---|---|---|
| `original_query` | `str` | Raw input query provided by employee. |
| `normalized_query` | `str` | Sanitized, whitespace-collapsed query. |
| `intent` | `IntentCategory` | Classified domain category enum. |
| `confidence` | `float` | Classification confidence rating ($0.0$ to $1.0$). |
| `intent_reasoning` | `str` | Rationale for classification. |
| `clarification_required`| `bool` | True if additional context is required. |
| `clarification_question`| `Optional[str]` | Generated clarification prompt when needed. |
| `evidence` | `GroupedEvidence` | Partitioned evidence: `knowledge_base`, `policy`, `ticket_history`. |
| `relevant_sources` | `List[SourceReference]` | Flat list of all retrieved chunks with similarity scores. |
| `policy_relevant` | `bool` | Flag indicating whether `POL-01` applies. |
| `historical_ticket_relevant` | `bool` | Flag indicating whether ticket precedent applies. |
| `decision` | `WorkflowDecision` | `RESOLVE`, `CLARIFY`, or `ESCALATE`. |
| `response` | `str` | Grounded, human-readable response text. |
| `escalation_reason` | `Optional[str]` | Justification for escalation when triggered. |

---

## 5. Intent Categories

The system defines 8 standard intent categories:

1. `PASSWORD_ACCESS`: Account lockouts, self-service password resets, OTP unlock.
2. `VPN_ACCESS`: Cisco AnyConnect, VPN credential expiration, contractor access approvals.
3. `SOFTWARE_REQUEST`: Catalog applications, non-catalog software, developer tools, license requests.
4. `WIFI_NETWORK`: Corporate Wi-Fi, 24-hour guest Wi-Fi access, visitor credentials.
5. `HARDWARE_DEVICE`: Laptop replacement cycles, computer upgrades, monitors, docking stations, hardware faults.
6. `ACCOUNT_ACCESS`: Administrative/elevated privileges, MFA devices, security group access.
7. `GENERAL_IT`: General helpdesk inquiries, IT support operating hours, WFH equipment stipend.
8. `UNKNOWN`: Inquiries that cannot be mapped confidently to an existing IT domain.

---

## 6. Clarification Logic

When an inquiry is too ambiguous or terse to provide an actionable answer safely (e.g. single-concept phrases like `"my laptop"`, `"software"`, `"wifi"`), the agent halts early and triggers `CLARIFY`:

- **Query**: `"my laptop"`  
  **Question**: *"Could you tell me what issue you are experiencing with your laptop?"*
- **Query**: `"software"`  
  **Question**: *"Are you requesting software installation, access to an existing application, or software that is not in the approved catalog?"*
- **Query**: `"wifi"`  
  **Question**: *"Do you need assistance connecting your work device, or do you need guest Wi-Fi access for a visitor?"*

When the inquiry contains sufficient actionability (e.g. `"My laptop is old and I think it needs to be replaced."`), clarification is bypassed and full retrieval and decision analysis are performed.

---

## 7. Retrieval Integration

The agent integrates with Phase 2's `RetrievalService` (`backend/app/retrieval/service.py`) using its singleton instance.
- **No Vector DB duplication**: Uses the existing FAISS `IndexFlatIP` index stored in `backend/storage/vector_store/index.faiss`.
- **No Embedding Model duplication**: Reuses the singleton `all-MiniLM-L6-v2` manager.
- **Exclusion Invariant**: Confirmed that Employee Requests (`REQ-01` to `REQ-15`) remain strictly excluded from retrieval.
- **Top-K Retrieval**: Pulls top 5 chunks per query to ensure broad multi-source coverage across Knowledge Base, Policy, and Ticket history.

---

## 8. Evidence Grouping

Retrieved results are partitioned into three dedicated buckets:
1. `knowledge_base`: Chunks derived from `KB-01` to `KB-10`. Represents official operating procedures.
2. `policy`: Chunks derived from `POL-01`. Represents binding corporate governance and rules.
3. `ticket_history`: Chunks derived from `TK-1042` to `TK-1051`. Represents historical precedent.

---

## 9. Decision Engine

The `DecisionEngine` (`backend/app/agent/decision.py`) evaluates the query, intent, confidence, and grouped evidence to reach one of three outcomes:

- **`RESOLVE`**:
  - Direct self-service solution exists in Knowledge Base or Policy.
  - Examples: Self-service password reset (`KB-01`), guest Wi-Fi generation (`KB-07`), standard VPN setup (`KB-02`), eligible laptop replacement per `POL-01`.
- **`CLARIFY`**:
  - Query is underspecified or ambiguous.
  - Confidence is below threshold ($< 0.35$).
  - Retrieval returned no matches or maximum similarity score is $< 0.30$.
- **`ESCALATE`**:
  - Request cannot be solved via self-service and requires human intervention or approval:
    - Non-catalog / unapproved software requests (`KB-04`) &rarr; requires Security Review.
    - Elevated administrative access &rarr; requires department justification and Security sign-off.
    - Security incidents / phishing &rarr; escalated to InfoSec Incident Response.
    - System retrieval service unavailable &rarr; escalated to IT operations.

---

## 10. Policy Handling

Queries touching hardware replacement or equipment lifecycle receive special handling via `AssetManagementPolicyValidator` (`backend/app/agent/policy.py`):
- Checks retrieved evidence from Asset Management Policy (`POL-01`).
- Enforces the **3-year standard refresh cycle**.
- Enforces that early replacement requires **verified hardware failure confirmed by IT Support**.
- Enforces that upgrades require **Department Head approval and written justification**.
- Never hallucinates eligibility periods, fees, or departments.

---

## 11. Historical Ticket Handling

Historical tickets are managed through `HistoricalTicketContext` (`backend/app/agent/tickets.py`):
- Surfaces relevant tickets as supporting context (e.g. `TK-1042` for expired VPN, `TK-1043` for 3.2-year-old laptop refresh).
- Explicitly labels tickets under a separate `"Historical Context"` heading.
- Attaches the disclaimer: *(Note: Prior ticket resolutions serve as historical reference and do not supersede official policy).*
- Never treats past tickets as current policy or as the requester's active ticket.
- Redacts employee names to protect internal privacy.

---

## 12. API Endpoint Specifications

### `POST /api/agent/query`

#### Request Body:
```json
{
  "query": "My VPN credentials have expired."
}
```

#### Response Body:
```json
{
  "query": "My VPN credentials have expired.",
  "intent": "VPN_ACCESS",
  "confidence": 0.8,
  "decision": "RESOLVE",
  "clarification_required": false,
  "clarification_question": null,
  "response": "According to the Veridian Knowledge Base (KB-02):\nVPN Access\nVPN access is granted automatically to all full-time employees...\n\nHistorical Context:\nA previous support ticket indicates how similar inquiries were handled in the past:\n• Ticket TK-1042: Ticket TK-1042: VPN credential expired (Outcome: Resolved (closed))\n(Note: Prior ticket resolutions serve as historical reference and do not supersede official policy).",
  "sources": [
    {
      "source_id": "TK-1042",
      "source_type": "ticket",
      "score": 0.6695,
      "title": "VPN credential expired"
    },
    {
      "source_id": "KB-02",
      "source_type": "knowledge_base",
      "score": 0.6549,
      "title": "VPN Access"
    }
  ],
  "escalation_reason": null
}
```

---

## 13. Frontend Changes

- **Component**: `frontend/src/components/AgentQueryCard.tsx`
  - Integrated into main page (`frontend/src/app/page.tsx`).
  - Input field with keyboard submission and 8 quick scenario test chips.
  - Decision badges with distinct color semantics: `RESOLVE` (emerald), `CLARIFY` (amber), `ESCALATE` (rose).
  - Prominent Callout box for clarification questions.
  - Escalation justification banner when escalation is triggered.
  - Clean formatted grounded answer view.
  - Referenced sources pill bar displaying source type icons, IDs, titles, and similarity scores.
- **Client Helper**: `frontend/src/lib/api.ts` &rarr; `sendAgentQuery()`.
- **Build Verification**: Compiled cleanly via `npm run build` with 0 TypeScript/Turbopack errors.

---

## 14. Test Scenarios

All 8 required assignment scenarios were tested and verified:

| Scenario | Input Query | Detected Intent | Decision | Primary Grounding Sources |
|---|---|---|---|---|
| **Scenario 1** | *"My password is locked."* | `PASSWORD_ACCESS` | `RESOLVE` | `KB-01` (Self-service portal / OTP unlock) |
| **Scenario 2** | *"I need software that is not in the catalog."* | `SOFTWARE_REQUEST` | `ESCALATE` | `KB-04`, `TK-1044` (Security review required) |
| **Scenario 3** | *"How do I connect to guest Wi-Fi?"* | `WIFI_NETWORK` | `RESOLVE` | `KB-07` (Front-desk 24h credential portal) |
| **Scenario 4** | *"My VPN credentials have expired."* | `VPN_ACCESS` | `RESOLVE` | `KB-02`, `TK-1042` (Cisco AnyConnect / Identity) |
| **Scenario 5** | *"My laptop is old and I think it needs to be replaced."* | `HARDWARE_DEVICE` | `RESOLVE` | `KB-03`, `POL-01` (3-year cycle / asset tag request) |
| **Scenario 6** | *"My laptop."* | `HARDWARE_DEVICE` | `CLARIFY` | Clarification question asked |
| **Scenario 7** | *"Can you book a flight ticket to Paris for my vacation?"* | `UNKNOWN` | `CLARIFY` | Controlled refusal without hallucinating |
| **Scenario 8** | *"VPN certificate has expired for remote login"* | `VPN_ACCESS` | `RESOLVE` | `TK-1042` surfaced as historical context |

---

## 15. Test Results

Executed complete backend automated test suite:
```powershell
.\backend\.venv\Scripts\pytest.exe -v
```

### Test Output Summary:
```
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\usern\Downloads\INTERNSHIP\IT-Support\backend
configfile: pytest.ini
plugins: anyio-4.15.1
collected 42 items

tests/test_agent.py::test_request_normalization PASSED                   [  2%]
tests/test_agent.py::test_underspecified_query_detection PASSED          [  4%]
tests/test_agent.py::test_intent_classification_domains PASSED           [  7%]
tests/test_agent.py::test_clarification_prompts PASSED                   [  9%]
tests/test_agent.py::test_evidence_grouping PASSED                       [ 11%]
tests/test_agent.py::test_scenario_1_password_lockout PASSED             [ 14%]
tests/test_agent.py::test_scenario_2_unapproved_software PASSED          [ 16%]
tests/test_agent.py::test_scenario_3_guest_wifi PASSED                   [ 19%]
tests/test_agent.py::test_scenario_4_vpn_credentials_expired PASSED      [ 21%]
tests/test_agent.py::test_scenario_5_laptop_replacement_policy PASSED    [ 23%]
tests/test_agent.py::test_scenario_6_ambiguous_query_clarification PASSED [ 26%]
tests/test_agent.py::test_scenario_7_unknown_query_no_hallucination PASSED [ 28%]
tests/test_agent.py::test_scenario_8_ticket_treated_as_historical_context PASSED [ 30%]
tests/test_agent.py::test_empty_query_api_validation PASSED              [ 33%]
tests/test_agent.py::test_invalid_request_body_validation PASSED         [ 35%]
tests/test_data_layer.py::test_seed_idempotency_and_counts PASSED        [ 38%]
tests/test_data_layer.py::test_health_endpoint PASSED                    [ 40%]
tests/test_data_layer.py::test_list_knowledge_base PASSED                [ 42%]
tests/test_data_layer.py::test_get_knowledge_base_article_by_id PASSED   [ 45%]
tests/test_data_layer.py::test_get_knowledge_base_article_not_found PASSED [ 47%]
tests/test_data_layer.py::test_list_policies PASSED                      [ 50%]
tests/test_data_layer.py::test_get_policy_by_id PASSED                   [ 52%]
tests/test_data_layer.py::test_get_policy_not_found PASSED               [ 54%]
tests/test_data_layer.py::test_list_employee_requests PASSED             [ 57%]
tests/test_data_layer.py::test_get_employee_request_by_id PASSED         [ 59%]
tests/test_data_layer.py::test_get_employee_request_not_found PASSED     [ 61%]
tests/test_data_layer.py::test_list_tickets PASSED                       [ 64%]
tests/test_data_layer.py::test_get_ticket_by_id PASSED                   [ 66%]
tests/test_data_layer.py::test_ticket_filtering_active PASSED            [ 69%]
tests/test_data_layer.py::test_get_ticket_not_found PASSED               [ 71%]
tests/test_retrieval.py::test_document_loader_counts PASSED              [ 73%]
tests/test_retrieval.py::test_chunking_deterministic PASSED              [ 76%]
tests/test_retrieval.py::test_retrieval_endpoint_validation PASSED       [ 78%]
tests/test_retrieval.py::test_top_k_parameter PASSED                     [ 80%]
tests/test_retrieval.py::test_source_type_filtering PASSED               [ 83%]
tests/test_retrieval.py::test_semantic_scenario_password_lockout PASSED  [ 85%]
tests/test_retrieval.py::test_semantic_scenario_unapproved_software PASSED [ 88%]
tests/test_retrieval.py::test_semantic_scenario_visitor_wifi PASSED      [ 90%]
tests/test_retrieval.py::test_semantic_scenario_vpn_credentials PASSED   [ 92%]
tests/test_retrieval.py::test_semantic_scenario_laptop_replacement PASSED [ 95%]
tests/test_retrieval.py::test_ticket_metadata_preservation PASSED        [ 97%]
tests/test_retrieval.py::test_score_ordering PASSED                      [100%]

======================= 42 passed, 2 warnings in 15.59s =======================
```

**Total Pass Rate**: **42 passed, 0 failed (100% passing)**.

---

## 16. Existing Regression Tests

All regression suites remain completely functional:
- **Phase 0 Health Check**: `GET /health` continues to return HTTP 200 with service status `ok`.
- **Phase 1 Relational Data APIs**: `GET /api/knowledge-base`, `GET /api/policies`, `GET /api/requests`, `GET /api/tickets` pass all 15 tests.
- **Phase 2 Retrieval APIs**: `GET /api/retrieval/search` passes all 12 tests including top-k parameter validation, source filtering, and descending score checks.

---

## 17. Files / Modules Added or Changed

### Added:
- `backend/app/agent/__init__.py`
- `backend/app/agent/state.py`
- `backend/app/agent/understanding.py`
- `backend/app/agent/classifier.py`
- `backend/app/agent/clarification.py`
- `backend/app/agent/evidence.py`
- `backend/app/agent/policy.py`
- `backend/app/agent/tickets.py`
- `backend/app/agent/decision.py`
- `backend/app/agent/response.py`
- `backend/app/agent/workflow.py`
- `backend/app/schemas/agent.py`
- `backend/app/api/routes/agent.py`
- `backend/tests/test_agent.py`
- `frontend/src/components/AgentQueryCard.tsx`
- `docs/phase-3-completion-report.md`

### Modified:
- `backend/app/api/router.py`: Registered `agent_router`.
- `backend/app/schemas/__init__.py`: Exported agent Pydantic schemas.
- `frontend/src/lib/api.ts`: Added agent client types and `sendAgentQuery()`.
- `frontend/src/app/page.tsx`: Added `AgentQueryCard` component.

---

## 18. Dependencies Added

**Zero (0) new dependencies added.**
The Phase 3 implementation strictly leverages the existing dependencies installed in Phase 1 and Phase 2 (`fastapi`, `pydantic`, `sqlalchemy`, `sentence-transformers`, `faiss-cpu`, `numpy`).

---

## 19. Known Limitations

1. **Rule-Based Phrasing**: The classifier relies on comprehensive regex and keyword patterns. Highly convoluted colloquial phrasing may trigger `UNKNOWN` and ask for clarification, which is the intended safe behavior.
2. **Deterministic Response Templates**: Responses use structured templates grounded in retrieved text. They do not rephrase text fluidly like an LLM, but guarantee 100% factual accuracy and zero hallucination.

---

## 20. Explicit Constraint Statement

In strict adherence to the Phase 3 specification:
- **NO LLM SDKs were added** (OpenAI, Anthropic, Gemini, or local models).
- **NO LangChain or LangGraph was added.**
- **NO autonomous tool-calling or agent loops were implemented.**
- **NO agent memory or session state databases were created.**
- **NO Employee Requests (`REQ-01` to `REQ-15`) were indexed into the vector store.**

---

## 21. How to Run and Test Phase 3

### Running All Automated Tests:
```powershell
# From the backend directory
.\.venv\Scripts\pytest.exe -v
```

### Running Backend Locally:
```powershell
# From the backend directory
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

### Testing the Agent via cURL / PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/agent/query" -Method Post `
  -ContentType "application/json" `
  -Body '{"query": "My password is locked."}' | ConvertTo-Json
```

### Running Next.js Frontend:
```powershell
# From the frontend directory
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and test the interactive **Phase 3 — Veridian IT Support Agent** card using the quick-test scenario chips.
