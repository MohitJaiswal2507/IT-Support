# Phase 5 Completion Report: Controlled Action Execution & Authorization Layer

**Project**: Veridian Internal IT Support Agent  
**Assignment**: Assignment 2 — Internal Service Agent  
**Current Phase**: Phase 5 — Controlled Action/Tool Execution Layer  
**Branch**: `phase-5-controlled-actions` (created and active, not committed or merged by agent)  
**Date**: September 17, 2026  
**Status**: Completed and Fully Verified  

---

## 1. Phase Objective

Phase 5 introduces a controlled, auditable, and deterministic action/tool execution layer to the Veridian Internal IT Support Agent.

While previous phases focused on understanding, classification, retrieval, deterministic policy decisions, and grounded response phrasing, Phase 5 enables the agent to safely execute or queue service actions. Crucially, the system is **NOT** an unrestricted autonomous agent:
- All actions are explicitly registered in a strict tool registry.
- An independent deterministic authorization boundary decides whether an action can execute automatically (`ALLOW`), requires human sign-off (`APPROVAL_REQUIRED`), or is forbidden (`DENY`).
- The LLM **cannot** choose arbitrary tools, bypass authorization, approve requests, or execute arbitrary SQL/Python code.
- Actions are strictly simulated and backed by the local application database. No real external production IT systems are connected.

---

## 2. Branch Name

- **Active Branch**: `phase-5-controlled-actions` (branched directly from `main`).
- Per project instructions, the branch has been created and left ready for user review without automated git commits or merges.

---

## 3. Architecture

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
POLICY / HISTORICAL TICKET CONTEXT HANDLING
    ↓
DETERMINISTIC DECISION ENGINE (RESOLVE / CLARIFY / ESCALATE)
    ↓
GROUNDED LLM RESPONSE GENERATION & FALLBACK (app.llm.generator)
    ↓
ACTION REQUEST DETECTION (app.actions.detector)
    ↓
ACTION AUTHORIZATION SERVICE (app.actions.authorization)
    ├─ ALLOW (Read-Only Tools) ─────────→ Auto Execution & Audit Log
    ├─ APPROVAL_REQUIRED (e.g. Reset) ──→ Create ActionRequest (PENDING_APPROVAL)
    └─ DENY (Arbitrary / Ineligible) ───→ Action Rejected (REJECTED)
    ↓
STRUCTURED ACTION RESULT
    ↓
FINAL GROUNDED RESPONSE WITH AUDIT NOTE & DEMO CONTROLS
```

---

## 4. Tool Registry

The tool registry (`backend/app/tools/registry.py`) implements a closed, auditable registry of approved IT tools:
- Arbitrary Python execution is blocked.
- Arbitrary database writes or queries from the LLM are forbidden.
- Any tool not explicitly registered (e.g., `run_sql`, `DELETE_ACCOUNT`) is rejected immediately with status `REJECTED`.

---

## 5. Available Tools

The 5 approved IT tools implemented in `backend/app/tools/` are:

| Tool Name | Risk Level | Requires Approval | Purpose |
|---|---|---|---|
| `CHECK_ACCOUNT_STATUS` | `READ_ONLY` | No | Checks simulated directory status (`ACTIVE` vs `LOCKED`). Safe for automated execution. |
| `CHECK_VPN_STATUS` | `READ_ONLY` | No | Checks Cisco AnyConnect profile and certificate expiration. Does not claim remediation. |
| `CHECK_TICKET_STATUS` | `READ_ONLY` | No | Queries the local database for existing ticket status (`TK-1042`). |
| `REQUEST_PASSWORD_RESET` | `REQUEST_CREATION` | Yes | Queues a password reset request in `PENDING_APPROVAL`. **Never generates or stores passwords**. |
| `REQUEST_LAPTOP_REPLACEMENT` | `REQUEST_CREATION` | Yes | Evaluates eligibility against Asset Management Policy `POL-01` (3-year lifecycle rule). |

---

## 6. Action Authorization Model

The authorization boundary (`backend/app/actions/authorization.py`) deterministically resolves:
- `ALLOW`: For `READ_ONLY` tools (`CHECK_ACCOUNT_STATUS`, `CHECK_VPN_STATUS`, `CHECK_TICKET_STATUS`).
- `APPROVAL_REQUIRED`: For `REQUEST_PASSWORD_RESET` and policy-eligible `REQUEST_LAPTOP_REPLACEMENT` requests.
- `DENY`: For unregistered tools, arbitrary code injection attempts (`run_sql`), or laptop replacements younger than 3 years without hardware failure.

The LLM is completely bypassed during authorization; authorization is strictly policy-driven.

---

## 7. Approval Workflow

Implemented in `backend/app/actions/approvals.py`:
- `POST /api/actions/{action_request_id}/approve`:
  - Validates the request exists and is in `PENDING_APPROVAL` status.
  - Transitions `ActionRequest.status` to `EXECUTED`.
  - Records timestamp, approver (`demo-admin`), and decision rationale in `Approval` record.
  - **Rejects duplicate approvals with HTTP 400 Bad Request**.
- `POST /api/actions/{action_request_id}/reject`:
  - Transitions request to `REJECTED` and records rejection rationale.
  - Rejects duplicate rejection/approval attempts with HTTP 400 Bad Request.

---

## 8. Database Changes

Two new SQLAlchemy tables were added to SQLite in `backend/app/db/models.py`:

### `ActionRequest` Table:
- `id` / `action_id`: String primary key (e.g. `ACT-A1B2C3`).
- `action_name`: Registered tool name.
- `requested_at`: ISO8601 UTC timestamp.
- `status`: `PENDING_APPROVAL`, `APPROVED`, `EXECUTED`, `REJECTED`, `FAILED`.
- `requester`: Simulated requester identity (`demo-user`).
- `parameters_json`: Sanitized JSON input parameters.
- `result_json`: Output payload from execution.
- `approval_required`: Boolean flag.
- `approved_at`: Timestamp when approved.
- `completed_at`: Timestamp when executed.

### `Approval` Table:
- `id`: Unique approval record key.
- `action_request_id`: Associated `action_id`.
- `status`: `PENDING`, `APPROVED`, `REJECTED`.
- `requested_at`: Timestamp when queued.
- `approved_at`: Timestamp when decision rendered.
- `approver`: Simulated approver identifier (`demo-admin`).
- `reason`: Rationale or audit note.

---

## 9. API Endpoints

- `GET /api/tools`: Returns the list of registered tools and their risk classifications.
- `POST /api/actions/execute`: Directly executes or queues a controlled IT action.
- `GET /api/actions/{action_request_id}`: Retrieves request status and audit parameters.
- `POST /api/actions/{action_request_id}/approve`: Approves a pending action request (Demo).
- `POST /api/actions/{action_request_id}/reject`: Rejects a pending action request (Demo).
- `POST /api/agent/query`: Fully backward-compatible; now returns optional `action` metadata.

---

## 10. Agent Integration

In `backend/app/agent/workflow.py`:
- After retrieval, decision, and response generation, `ActionDetector` inspects query semantics.
- If an explicit action is requested, `ActionService.execute_action` safely evaluates authorization and executes or queues the request.
- `AgentQueryResponse` includes structured `action` metadata:
  ```json
  {
    "query": "Check my VPN status",
    "intent": "VPN_ACCESS",
    "decision": "RESOLVE",
    "response": "...",
    "action": {
      "action_name": "CHECK_VPN_STATUS",
      "status": "COMPLETED",
      "action_request_id": "ACT-84C1E2",
      "message": "VPN status checked: Cisco AnyConnect profile is active and valid."
    }
  }
  ```

---

## 11. Frontend Changes

`frontend/src/components/AgentQueryCard.tsx`:
- Header updated: **Phase 5 — Veridian IT Support Agent** (*"Controlled Action Execution, Authorization Boundary & Demo Approvals"*).
- Added **Available IT Tools** registry badge displaying all 5 supported tools.
- Added interactive **Phase 5 Action Execution & Approval Card**:
  - `PENDING_APPROVAL`: Displays Amber card with request ID and interactive **Approve** and **Reject** buttons under clearly labeled **"Demo Approval Controls"**.
  - `COMPLETED` / `EXECUTED`: Displays Emerald card with action outcome and sanitized data.
  - `REJECTED`: Displays Rose card stating the policy denial rationale.
- Added quick action scenario chips for one-click testing of VPN check, password reset, account status, ticket status, and laptop replacement.

---

## 12. Security Controls & Guardrails

- **No Real System Integrations**: Zero connections to Active Directory, Okta, Microsoft 365, or live infrastructure.
- **No Password Storage**: Password resets strictly queue a request. No passwords are generated, returned, or stored in SQLite.
- **No Direct SQL Execution**: Arbitrary tool queries like `run_sql` are blocked at the registry boundary.
- **No LLM Privilege Escalation**: The LLM cannot authorize, execute, or override actions.
- **Audit Logging**: Every action request, parameter set, and approval decision is persisted with UTC timestamps.

---

## 13. Test Results

The test suite in `backend/tests/test_actions.py` covers all 17 required scenarios:
- **Test 1**: `CHECK_ACCOUNT_STATUS` executes as `COMPLETED`.
- **Test 2**: `CHECK_VPN_STATUS` executes as `COMPLETED`.
- **Test 3**: `CHECK_TICKET_STATUS` executes as `COMPLETED`.
- **Test 4**: `REQUEST_PASSWORD_RESET` queues as `PENDING_APPROVAL` without storing passwords.
- **Test 5**: Approving password reset transitions to `EXECUTED` without password generation.
- **Test 6**: Rejecting password reset transitions to `REJECTED`.
- **Test 7**: Duplicate approval attempts fail with HTTP 400.
- **Test 8**: Laptop replacement > 3 years is queued as `PENDING_APPROVAL` under `POL-01`.
- **Test 9**: Laptop replacement < 3 years without failure is `REJECTED` under `POL-01`.
- **Test 10**: Ambiguous queries ("I need help with my laptop.") return `CLARIFY` with zero tool execution.
- **Test 11**: Unsupported queries ("Delete colleague's account.") are `DENIED`.
- **Test 12**: Arbitrary tool `run_sql` is rejected by tool registry.
- **Test 13**: Unknown tool is rejected.
- **Test 14**: Query `Check my VPN status` executes `CHECK_VPN_STATUS`.
- **Test 15**: Query `I need to reset my password` queues `REQUEST_PASSWORD_RESET`.
- **Test 16**: LLM cannot bypass authorization boundary.
- **Test 17**: Phase 4 deterministic fallback works seamlessly with Phase 5 actions.

---

## 14. Regression Results

Full pytest suite executed via `.venv/Scripts/python.exe -m pytest -v`:
- `tests/test_actions.py`: 17 passed
- `tests/test_agent.py`: 15 passed
- `tests/test_data_layer.py`: 15 passed
- `tests/test_llm.py`: 12 passed
- `tests/test_retrieval.py`: 12 passed
- **Total Tests**: **71 passed, 0 failed in 14.81s (100% pass rate)**.
- **Frontend Production Build**: `npm run build` compiled successfully in 714ms with 0 errors.

---

## 15. Limitations

- **Simulated Environments**: All directory accounts, VPN certificates, and tickets are simulated in local SQLite.
- **Demo Identity**: Requester identity defaults to `demo-user` and approver defaults to `demo-admin` as production authentication is out of scope.
- **Synchronous Actions**: Actions execute synchronously within request lifecycle.

---

## 16. Future Production Considerations

- Integrate real enterprise IAM (OAuth2 / OIDC, Azure Entra ID, Okta).
- Enterprise RBAC restricting approval endpoints to verified IT Support admins.
- Asynchronous task worker queues (Celery/Redis) for slow hardware provisioning workflows.
- Webhook dispatching to ticketing systems (ServiceNow, Jira Service Desk).

---

## 17. Explicit Compliance Confirmations

- [x] **No production IT systems were connected.**
- [x] **All tools are simulated/local.**
- [x] **No passwords are generated or stored in the database.**
- [x] **The LLM cannot bypass action authorization.**
- [x] **The LLM cannot approve actions.**
- [x] **The LLM cannot invoke arbitrary tools.**
- [x] **The LLM cannot execute arbitrary code.**
- [x] **The LLM cannot perform arbitrary SQL.**
- [x] **Policy evaluation remains deterministic.**
- [x] **Authentication/RBAC is explicitly acknowledged as simulated demo only.**
