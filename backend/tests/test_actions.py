import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.models import ActionRequest, Approval, Ticket
from app.tools.registry import tool_registry
from app.tools.schemas import ToolRiskLevel
from app.actions.service import ActionService
from app.actions.authorization import ActionAuthorizationService, AuthorizationDecision
from app.llm.base import LLMProvider
from app.llm.provider import set_llm_provider, reset_llm_provider

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_db():
    init_db()


@pytest.fixture(autouse=True)
def clean_llm():
    reset_llm_provider()
    yield
    reset_llm_provider()


# ==============================================================================
# TEST 1: CHECK_ACCOUNT_STATUS
# ==============================================================================
def test_1_check_account_status():
    """
    Direct tool execution for CHECK_ACCOUNT_STATUS.
    Expected: status=COMPLETED, read-only check.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "CHECK_ACCOUNT_STATUS",
        "parameters": {"employee_identifier": "demo-user"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["action_name"] == "CHECK_ACCOUNT_STATUS"
    assert data["status"] == "COMPLETED"
    assert data["requires_approval"] is False
    assert data["data"]["status"] == "ACTIVE"


# ==============================================================================
# TEST 2: CHECK_VPN_STATUS
# ==============================================================================
def test_2_check_vpn_status():
    """
    Direct tool execution for CHECK_VPN_STATUS.
    Expected: status=COMPLETED, read-only.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "CHECK_VPN_STATUS",
        "parameters": {"employee_identifier": "demo-user"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["action_name"] == "CHECK_VPN_STATUS"
    assert data["status"] == "COMPLETED"
    assert data["requires_approval"] is False
    assert "Cisco AnyConnect" in data["data"]["vpn_profile"]


# ==============================================================================
# TEST 3: CHECK_TICKET_STATUS
# ==============================================================================
def test_3_check_ticket_status():
    """
    Direct tool execution for CHECK_TICKET_STATUS querying TK-1042.
    Expected: status=COMPLETED.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "CHECK_TICKET_STATUS",
        "parameters": {"ticket_id": "TK-1042"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["action_name"] == "CHECK_TICKET_STATUS"
    assert data["status"] == "COMPLETED"
    assert data["data"]["ticket_id"] == "TK-1042"


# ==============================================================================
# TEST 4: REQUEST_PASSWORD_RESET
# ==============================================================================
def test_4_request_password_reset_requires_approval():
    """
    REQUEST_PASSWORD_RESET must NOT directly reset password.
    Expected: status=PENDING_APPROVAL with action_request_id.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "REQUEST_PASSWORD_RESET",
        "parameters": {"employee_identifier": "demo-user", "reason": "Forgotten password"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["action_name"] == "REQUEST_PASSWORD_RESET"
    assert data["status"] == "PENDING_APPROVAL"
    assert data["requires_approval"] is True
    assert data["action_request_id"] is not None
    assert "password" not in data.get("data", {}) or "new_password" not in data.get("data", {})


# ==============================================================================
# TEST 5: APPROVE_PASSWORD_RESET
# ==============================================================================
def test_5_approve_password_reset():
    """
    Approve a pending password reset request.
    Expected: status=EXECUTED, verify no password is generated or stored.
    """
    # Create request
    create_res = client.post("/api/actions/execute", json={
        "action_name": "REQUEST_PASSWORD_RESET",
        "parameters": {"employee_identifier": "demo-user"}
    })
    action_id = create_res.json()["action_request_id"]

    # Approve
    approve_res = client.post(f"/api/actions/{action_id}/approve", json={
        "approver": "demo-admin",
        "reason": "Verified employee identity via secondary channel"
    })
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "EXECUTED"

    # Query DB record to verify no password was stored
    db = SessionLocal()
    try:
        record = db.query(ActionRequest).filter(ActionRequest.action_id == action_id).first()
        assert record is not None
        assert record.status == "EXECUTED"
        assert record.approved_at is not None
        assert "password" not in str(record.result_json).lower() or "new_password" not in str(record.result_json).lower()
    finally:
        db.close()


# ==============================================================================
# TEST 6: REJECT_PASSWORD_RESET
# ==============================================================================
def test_6_reject_password_reset():
    """
    Reject a pending password reset request.
    Expected: status=REJECTED.
    """
    create_res = client.post("/api/actions/execute", json={
        "action_name": "REQUEST_PASSWORD_RESET",
        "parameters": {"employee_identifier": "demo-user"}
    })
    action_id = create_res.json()["action_request_id"]

    reject_res = client.post(f"/api/actions/{action_id}/reject", json={
        "approver": "demo-admin",
        "reason": "Unrecognized request source"
    })
    assert reject_res.status_code == 200
    rejected_data = reject_res.json()
    assert rejected_data["status"] == "REJECTED"


# ==============================================================================
# TEST 7: DUPLICATE_APPROVAL
# ==============================================================================
def test_7_duplicate_approval_rejected():
    """
    Attempting to approve an already approved action must return 400 Bad Request.
    """
    create_res = client.post("/api/actions/execute", json={
        "action_name": "REQUEST_PASSWORD_RESET",
        "parameters": {"employee_identifier": "demo-user"}
    })
    action_id = create_res.json()["action_request_id"]

    # First approval
    first_appr = client.post(f"/api/actions/{action_id}/approve", json={"approver": "demo-admin"})
    assert first_appr.status_code == 200

    # Second approval (must fail with 400)
    second_appr = client.post(f"/api/actions/{action_id}/approve", json={"approver": "demo-admin"})
    assert second_appr.status_code == 400
    assert "not pending approval" in second_appr.json()["detail"].lower()


# ==============================================================================
# TEST 8: LAPTOP_REPLACEMENT_OVER_3_YEARS
# ==============================================================================
def test_8_laptop_replacement_over_3_years():
    """
    Laptop replacement request for device > 3 years old.
    Expected: PENDING_APPROVAL according to standard POL-01 refresh cycle.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "REQUEST_LAPTOP_REPLACEMENT",
        "parameters": {
            "employee_identifier": "demo-user",
            "asset_tag": "LT-1004",
            "device_age_years": 3.4
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING_APPROVAL"
    assert data["requires_approval"] is True
    assert "POL-01" in data["data"]["policy_check"]


# ==============================================================================
# TEST 9: LAPTOP_REPLACEMENT_UNDER_3_YEARS
# ==============================================================================
def test_9_laptop_replacement_under_3_years_rejected():
    """
    Laptop replacement for device < 3 years old with no failure.
    Expected: REJECTED under POL-01 policy.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "REQUEST_LAPTOP_REPLACEMENT",
        "parameters": {
            "employee_identifier": "demo-user",
            "asset_tag": "LT-2041",
            "device_age_years": 1.5,
            "hardware_failure": False
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REJECTED"
    assert "under 3 years old" in data["message"].lower() or "criteria" in data["message"].lower()


# ==============================================================================
# TEST 10: AMBIGUOUS_ACTION
# ==============================================================================
def test_10_ambiguous_action_clarification():
    """
    Ambiguous query: 'I need help with my laptop.'
    Expected: decision=CLARIFY, NO tool executes.
    """
    res = client.post("/api/agent/query", json={"query": "I need help with my laptop."})
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "CLARIFY"
    assert data.get("action") is None


# ==============================================================================
# TEST 11: UNSUPPORTED_ACTION
# ==============================================================================
def test_11_unsupported_action_denied():
    """
    Unsupported query: 'Delete my colleague's account.'
    Expected: Action not authorized / denied, no tool execution.
    """
    res = client.post("/api/agent/query", json={"query": "Delete my colleague's account."})
    assert res.status_code == 200
    data = res.json()
    assert data.get("action") is not None
    assert data["action"]["status"] == "REJECTED"
    assert "not authorized" in data["action"]["message"].lower() or "not registered" in data["action"]["message"].lower()


# ==============================================================================
# TEST 12: ARBITRARY_TOOL
# ==============================================================================
def test_12_arbitrary_tool_rejected():
    """
    Attempt to call arbitrary tool 'run_sql'.
    Expected: REJECTED by tool registry.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "run_sql",
        "parameters": {"query": "SELECT * FROM users;"}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REJECTED"
    assert "not registered" in data["message"].lower()


# ==============================================================================
# TEST 13: UNKNOWN_TOOL
# ==============================================================================
def test_13_unknown_tool_rejected():
    """
    Calling unknown tool 'PROVISION_AWS_CLUSTER'.
    Expected: REJECTED by authorization/registry.
    """
    res = client.post("/api/actions/execute", json={
        "action_name": "PROVISION_AWS_CLUSTER",
        "parameters": {}
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REJECTED"


# ==============================================================================
# TEST 14: AGENT_QUERY_VPN_ACTION
# ==============================================================================
def test_14_agent_query_vpn_action():
    """
    User query: 'Check my VPN status'
    Expected: Phase 3 intent remains VPN_ACCESS, CHECK_VPN_STATUS executes.
    """
    res = client.post("/api/agent/query", json={"query": "Check my VPN status"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "VPN_ACCESS"
    assert data.get("action") is not None
    assert data["action"]["action_name"] == "CHECK_VPN_STATUS"
    assert data["action"]["status"] == "COMPLETED"


# ==============================================================================
# TEST 15: AGENT_QUERY_PASSWORD_RESET
# ==============================================================================
def test_15_agent_query_password_reset():
    """
    User query: 'I need to reset my password'
    Expected: REQUEST_PASSWORD_RESET created with PENDING_APPROVAL.
    """
    res = client.post("/api/agent/query", json={"query": "I need to reset my password"})
    assert res.status_code == 200
    data = res.json()
    assert data.get("action") is not None
    assert data["action"]["action_name"] == "REQUEST_PASSWORD_RESET"
    assert data["action"]["status"] == "PENDING_APPROVAL"
    assert data["action"]["action_request_id"] is not None


# ==============================================================================
# TEST 16: LLM_CANNOT_BYPASS_ACTION_AUTHORIZATION
# ==============================================================================
def test_16_llm_cannot_bypass_action_authorization():
    """
    Simulate an LLM claiming an unauthorized action was executed or suggesting arbitrary execution.
    The deterministic authorization service must reject it.
    """
    decision, reason = ActionAuthorizationService.authorize("DELETE_USER_ACCOUNT", {"user": "alice"})
    assert decision == AuthorizationDecision.DENY
    assert "not registered" in reason.lower()


# ==============================================================================
# TEST 17: PHASE_4_FALLBACK
# ==============================================================================
def test_17_phase_4_deterministic_fallback():
    """
    Simulate missing OpenAI key.
    Expected: deterministic fallback response_source remains functional.
    """
    set_llm_provider(None)
    res = client.post("/api/agent/query", json={"query": "Check my VPN status"})
    assert res.status_code == 200
    data = res.json()
    assert data["response_source"] == "deterministic_fallback"
    assert data.get("action") is not None
    assert data["action"]["action_name"] == "CHECK_VPN_STATUS"
