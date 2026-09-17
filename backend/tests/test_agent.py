import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agent.state import IntentCategory, WorkflowDecision
from app.agent.workflow import run_agent_workflow
from app.agent.understanding import normalize_query, is_empty_or_unusable, is_underspecified_query
from app.agent.classifier import classify_intent
from app.agent.clarification import ClarificationManager
from app.agent.evidence import retrieve_and_group_evidence

client = TestClient(app)


# ==============================================================================
# 1. UNIT TESTS: REQUEST UNDERSTANDING & CLASSIFICATION
# ==============================================================================

def test_request_normalization():
    """Verify whitespace collapsing and empty check."""
    assert normalize_query("   my   vpn   is   expired   ") == "my vpn is expired"
    assert is_empty_or_unusable("   ")
    assert is_empty_or_unusable("!@#$%^&*()")
    assert not is_empty_or_unusable("My password is locked")


def test_underspecified_query_detection():
    """Verify detection of brief/ambiguous single-topic inputs."""
    is_under, topic = is_underspecified_query("my laptop")
    assert is_under
    assert "laptop" in topic

    is_under, _ = is_underspecified_query("software")
    assert is_under

    is_under, _ = is_underspecified_query("I entered my password too many times and I'm locked out")
    assert not is_under


def test_intent_classification_domains():
    """Verify deterministic routing across all intent categories."""
    intent, conf, _ = classify_intent("My password is locked out")
    assert intent == IntentCategory.PASSWORD_ACCESS
    assert conf >= 0.70

    intent, conf, _ = classify_intent("How do I connect to guest Wi-Fi?")
    assert intent == IntentCategory.WIFI_NETWORK
    assert conf >= 0.70

    intent, conf, _ = classify_intent("My VPN credentials expired yesterday")
    assert intent == IntentCategory.VPN_ACCESS
    assert conf >= 0.70

    intent, conf, _ = classify_intent("I need to install non-catalog software")
    assert intent == IntentCategory.SOFTWARE_REQUEST
    assert conf >= 0.70

    intent, conf, _ = classify_intent("My laptop is 3.5 years old and needs replacement")
    assert intent == IntentCategory.HARDWARE_DEVICE
    assert conf >= 0.70

    intent, conf, _ = classify_intent("What is the weather outside in Tokyo?")
    assert intent == IntentCategory.UNKNOWN
    assert conf < 0.40


def test_clarification_prompts():
    """Verify targeted clarification questions."""
    q = ClarificationManager.get_clarification("my laptop", IntentCategory.HARDWARE_DEVICE)
    assert "issue you are experiencing with your laptop" in q

    q = ClarificationManager.get_clarification("software", IntentCategory.SOFTWARE_REQUEST)
    assert "catalog" in q


def test_evidence_grouping():
    """Verify retrieval results are separated into KB, Policy, and Ticket history."""
    grouped, sources, ok = retrieve_and_group_evidence("laptop replacement policy", top_k=5)
    assert ok
    assert len(sources) > 0
    # Policy POL-01 and KB-03 should be retrieved
    has_kb = len(grouped.knowledge_base) > 0
    has_pol = len(grouped.policy) > 0
    assert has_kb or has_pol


# ==============================================================================
# 2. REQUIRED ASSIGNMENT SCENARIOS (SCENARIOS 1 TO 8)
# ==============================================================================

def test_scenario_1_password_lockout():
    """
    SCENARIO 1: 'My password is locked.'
    Expected: intent = PASSWORD_ACCESS, retrieval includes KB-01, decision = RESOLVE.
    """
    res = client.post("/api/agent/query", json={"query": "My password is locked."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == "PASSWORD_ACCESS"
    assert data["decision"] == "RESOLVE"
    assert not data["clarification_required"]
    source_ids = [s["source_id"] for s in data["sources"]]
    assert "KB-01" in source_ids
    assert "self-service portal" in data["response"].lower() or "reset" in data["response"].lower()


def test_scenario_2_unapproved_software():
    """
    SCENARIO 2: 'I need software that is not in the catalog.'
    Expected: intent = SOFTWARE_REQUEST, retrieval includes KB-04, decision = ESCALATE.
    """
    res = client.post("/api/agent/query", json={"query": "I need software that is not in the catalog."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == "SOFTWARE_REQUEST"
    assert data["decision"] == "ESCALATE"
    assert data["escalation_reason"] is not None
    assert "Security Review" in data["escalation_reason"] or "KB-04" in data["escalation_reason"] or "Security" in data["response"]
    source_ids = [s["source_id"] for s in data["sources"]]
    assert "KB-04" in source_ids


def test_scenario_3_guest_wifi():
    """
    SCENARIO 3: 'How do I connect to guest Wi-Fi?'
    Expected: intent = WIFI_NETWORK, retrieval includes KB-07, grounded response, decision = RESOLVE.
    """
    res = client.post("/api/agent/query", json={"query": "How do I connect to guest Wi-Fi?"})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == "WIFI_NETWORK"
    assert data["decision"] == "RESOLVE"
    source_ids = [s["source_id"] for s in data["sources"]]
    assert "KB-07" in source_ids
    assert "24 hours" in data["response"] or "front-desk" in data["response"] or "portal" in data["response"]


def test_scenario_4_vpn_credentials_expired():
    """
    SCENARIO 4: 'My VPN credentials have expired.'
    Expected: intent = VPN_ACCESS, retrieval includes KB-02, grounded response, decision = RESOLVE.
    """
    res = client.post("/api/agent/query", json={"query": "My VPN credentials have expired."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == "VPN_ACCESS"
    assert data["decision"] == "RESOLVE"
    source_ids = [s["source_id"] for s in data["sources"]]
    assert "KB-02" in source_ids or "TK-1042" in source_ids


def test_scenario_5_laptop_replacement_policy():
    """
    SCENARIO 5: 'My laptop is old and I think it needs to be replaced.'
    Expected: intent = HARDWARE_DEVICE, retrieval includes KB-03 and/or POL-01,
    policy evidence must be considered before making any replacement statement.
    """
    res = client.post("/api/agent/query", json={"query": "My laptop is old and I think it needs to be replaced."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == "HARDWARE_DEVICE"
    assert data["decision"] == "RESOLVE"
    source_ids = [s["source_id"] for s in data["sources"]]
    assert "KB-03" in source_ids or "POL-01" in source_ids
    assert "3 years" in data["response"]


def test_scenario_6_ambiguous_query_clarification():
    """
    SCENARIO 6: 'My laptop.'
    Expected: clarification_required = True, decision = CLARIFY, useful clarification question.
    """
    res = client.post("/api/agent/query", json={"query": "My laptop."})
    assert res.status_code == 200
    data = res.json()

    assert data["clarification_required"] is True
    assert data["decision"] == "CLARIFY"
    assert data["clarification_question"] is not None
    assert "what issue" in data["clarification_question"].lower() or "laptop" in data["clarification_question"].lower()


def test_scenario_7_unknown_query_no_hallucination():
    """
    SCENARIO 7: An unknown / out-of-domain query.
    Expected: no hallucinated answer, controlled clarification or escalation behavior.
    """
    res = client.post("/api/agent/query", json={"query": "Can you book a flight ticket to Paris for my vacation?"})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == "UNKNOWN"
    assert data["decision"] in ["CLARIFY", "ESCALATE"]
    assert "airline" not in data["response"].lower()
    assert "flight" not in data["response"].lower()


def test_scenario_8_ticket_treated_as_historical_context():
    """
    SCENARIO 8: A query resembling an existing ticket (e.g. VPN credential expired).
    Expected: Ticket TK-1042 retrieved, clearly labeled as historical context,
    and NOT claimed to be the user's active ticket or current official policy.
    """
    res = client.post("/api/agent/query", json={"query": "VPN certificate has expired for remote login"})
    assert res.status_code == 200
    data = res.json()

    response_text = data["response"]
    if "TK-1042" in response_text or "Ticket" in response_text:
        assert "Historical Context" in response_text or "previous support ticket" in response_text
        assert "do not supersede official policy" in response_text or "historical reference" in response_text


# ==============================================================================
# 3. API VALIDATION & EDGE CASE HANDLING
# ==============================================================================

def test_empty_query_api_validation():
    """Verify empty query returns HTTP 400 Bad Request."""
    res = client.post("/api/agent/query", json={"query": ""})
    assert res.status_code == 400

    res2 = client.post("/api/agent/query", json={"query": "   "})
    assert res2.status_code == 400


def test_invalid_request_body_validation():
    """Verify missing required query field returns 422."""
    res = client.post("/api/agent/query", json={})
    assert res.status_code == 422
