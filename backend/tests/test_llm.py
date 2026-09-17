import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.llm.base import LLMProvider
from app.llm.provider import set_llm_provider, reset_llm_provider
from app.agent.state import WorkflowDecision, IntentCategory

client = TestClient(app)


class MockLLMProvider(LLMProvider):
    """
    Mock LLM Provider for isolated, deterministic Phase 4 testing
    without external API calls or network dependencies.
    """
    def __init__(self, response_payload=None, should_raise=False, raw_content=None):
        self.response_payload = response_payload
        self.should_raise = should_raise
        self.raw_content = raw_content
        self.last_system_prompt = None
        self.last_user_prompt = None

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        self.last_system_prompt = system_prompt
        self.last_user_prompt = user_prompt

        if self.should_raise:
            raise RuntimeError("Simulated OpenAI upstream service exception or timeout.")
        if self.raw_content is not None:
            return self.raw_content
        if self.response_payload is not None:
            return json.dumps(self.response_payload)
        return json.dumps({
            "answer": "Mock grounded answer.",
            "source_ids": [],
            "historical_context_used": False
        })


@pytest.fixture(autouse=True)
def cleanup_provider():
    """Ensures each test starts with a clean provider state."""
    reset_llm_provider()
    yield
    reset_llm_provider()


# ==============================================================================
# TEST 1 — PASSWORD LOCKOUT
# ==============================================================================
def test_1_password_lockout_llm():
    """
    Query: 'My account is locked after too many password attempts.'
    Expected: intent=PASSWORD_ACCESS, decision=RESOLVE, response_source=llm, source_ids include KB-01.
    """
    mock_response = {
        "answer": "You can unlock your account by navigating to the Veridian self-service portal (https://identity.veridian.com/unlock) and following the automated MFA identity verification steps (KB-01).",
        "source_ids": ["KB-01"],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "My account is locked after too many password attempts."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.PASSWORD_ACCESS.value
    assert data["decision"] == WorkflowDecision.RESOLVE.value
    assert data["response_source"] == "llm"
    assert "KB-01" in data["relevant_sources"]
    assert "https://identity.veridian.com/unlock" in data["response"]


# ==============================================================================
# TEST 2 — NON-CATALOG SOFTWARE
# ==============================================================================
def test_2_non_catalog_software_preserves_escalation():
    """
    Query: 'I need software that is not in the approved catalog.'
    Expected: intent=SOFTWARE_REQUEST, decision=ESCALATE.
    LLM must preserve escalation and not turn this into RESOLVE.
    """
    mock_response = {
        "answer": "Requests for software outside the approved catalog require escalation to the IT Architecture & Security Review Board for security compliance assessment (KB-04).",
        "source_ids": ["KB-04"],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "I need software that is not in the approved catalog."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.SOFTWARE_REQUEST.value
    assert data["decision"] == WorkflowDecision.ESCALATE.value
    assert data["response_source"] == "llm"
    assert "escalation" in data["response"].lower() or "security" in data["response"].lower()


# ==============================================================================
# TEST 3 — GUEST WIFI
# ==============================================================================
def test_3_guest_wifi():
    """
    Query: 'How do I connect a guest to Wi-Fi?'
    Expected: WIFI_NETWORK, RESOLVE. Grounded in KB-07.
    """
    mock_response = {
        "answer": "Guest Wi-Fi credentials can be generated through the Reception Portal (KB-07). Temporary visitor passes are valid for 24 hours.",
        "source_ids": ["KB-07"],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "How do I connect a guest to Wi-Fi?"})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.WIFI_NETWORK.value
    assert data["decision"] == WorkflowDecision.RESOLVE.value
    assert data["response_source"] == "llm"
    assert "KB-07" in data["relevant_sources"]
    assert "KB-07" in data["response"]


# ==============================================================================
# TEST 4 — EXPIRED VPN
# ==============================================================================
def test_4_expired_vpn_with_historical_context():
    """
    Query: 'My VPN certificate has expired for remote login.'
    Expected: VPN_ACCESS, RESOLVE. Grounded using KB-02, historical TK-1042 may appear as historical context.
    """
    mock_response = {
        "answer": "According to KB-02, renew your Cisco AnyConnect client certificate via the Identity Portal. Historical context: Precedent ticket TK-1042 noted that refreshing the root cert resolved client handshakes.",
        "source_ids": ["KB-02", "TK-1042"],
        "historical_context_used": True
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "My VPN certificate has expired for remote login."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.VPN_ACCESS.value
    assert data["decision"] == WorkflowDecision.RESOLVE.value
    assert data["response_source"] == "llm"
    assert "KB-02" in data["relevant_sources"]
    assert "Historical context:" in data["response"]


# ==============================================================================
# TEST 5 — OLD LAPTOP
# ==============================================================================
def test_5_old_laptop_respects_pol01():
    """
    Query: 'My laptop is more than three years old and I need a replacement.'
    Expected: HARDWARE_DEVICE, RESOLVE. Must respect POL-01.
    """
    mock_response = {
        "answer": "Under Veridian Asset Management Policy POL-01, laptops exceeding the standard 3-year refresh lifecycle are eligible for equipment replacement. Submit a Hardware Refresh request in the IT portal with your asset tag.",
        "source_ids": ["POL-01"],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "My laptop is more than three years old and I need a replacement."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.HARDWARE_DEVICE.value
    assert data["decision"] == WorkflowDecision.RESOLVE.value
    assert data["response_source"] == "llm"
    assert "POL-01" in data["relevant_sources"]


# ==============================================================================
# TEST 6 — AMBIGUOUS LAPTOP
# ==============================================================================
def test_6_ambiguous_laptop_clarification():
    """
    Query: 'My laptop'
    Expected: decision=CLARIFY. The LLM must not invent a solution. It must ask the supplied clarification question.
    """
    mock_response = {
        "answer": "Could you please specify what issue you are experiencing with your laptop (e.g. hardware repair, battery failure, or replacement request)?",
        "source_ids": [],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "My laptop"})
    assert res.status_code == 200
    data = res.json()

    assert data["decision"] == WorkflowDecision.CLARIFY.value
    assert data["clarification_required"] is True
    assert data["response_source"] == "llm"


# ==============================================================================
# TEST 7 — UNKNOWN QUERY
# ==============================================================================
def test_7_unknown_query_out_of_scope():
    """
    Query: 'I want to book a flight to Paris.'
    Expected: intent=UNKNOWN, decision=CLARIFY. LLM must not answer travel question.
    """
    mock_response = {
        "answer": "This appears to be outside internal IT support scope. Could you please clarify your IT or corporate systems inquiry?",
        "source_ids": [],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "I want to book a flight to Paris."})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.UNKNOWN.value
    assert data["decision"] == WorkflowDecision.CLARIFY.value
    assert data["response_source"] == "llm"


# ==============================================================================
# TEST 8 — HISTORICAL TICKET
# ==============================================================================
def test_8_historical_ticket_context_identified():
    """
    Query: 'Was there a previous case about an expired VPN certificate?'
    Expected: historical ticket context is clearly identified and does not imply TK-1042 is current policy.
    """
    mock_response = {
        "answer": "Yes. Historical context: Ticket TK-1042 previously documented resolution for an expired Cisco AnyConnect profile. Please note that precedent tickets do not constitute official policy and current configuration must follow KB-02.",
        "source_ids": ["TK-1042", "KB-02"],
        "historical_context_used": True
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_response))

    res = client.post("/api/agent/query", json={"query": "Was there a previous case about an expired VPN certificate?"})
    assert res.status_code == 200
    data = res.json()

    assert data["response_source"] == "llm"
    assert "Historical context:" in data["response"]
    assert "TK-1042" in data["relevant_sources"]


# ==============================================================================
# TEST 9 — LLM FAILURE
# ==============================================================================
def test_9_llm_failure_falls_back_to_deterministic():
    """
    Mock provider exception.
    Expected: API still succeeds. response_source=deterministic_fallback. Phase 3 response remains valid.
    """
    set_llm_provider(MockLLMProvider(should_raise=True))

    res = client.post("/api/agent/query", json={"query": "My password is locked."})
    assert res.status_code == 200
    data = res.json()

    assert data["decision"] == WorkflowDecision.RESOLVE.value
    assert data["response_source"] == "deterministic_fallback"
    assert len(data["response"]) > 0
    assert "KB-01" in data["response"]


# ==============================================================================
# TEST 10 — INVALID SOURCE
# ==============================================================================
def test_10_invalid_source_rejected():
    """
    Mock an LLM response containing: source_ids = ['KB-999']
    Expected: validation fails. System uses deterministic fallback.
    """
    mock_hallucinated_response = {
        "answer": "According to KB-999, your issue is solved automatically.",
        "source_ids": ["KB-999"],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_hallucinated_response))

    res = client.post("/api/agent/query", json={"query": "My password is locked."})
    assert res.status_code == 200
    data = res.json()

    # Grounding validator should reject KB-999 and fall back to deterministic response
    assert data["response_source"] == "deterministic_fallback"
    assert "KB-999" not in data["response"]
    assert "KB-01" in data["response"]


# ==============================================================================
# TEST 11 — UNSUPPORTED ACTION CLAIM
# ==============================================================================
def test_11_unsupported_action_claim_rejected():
    """
    Mock an LLM response: 'I have unlocked your account.'
    Expected: validation fails. System falls back to deterministic response.
    """
    mock_claim_response = {
        "answer": "I have unlocked your account. You can now log into your workstation.",
        "source_ids": ["KB-01"],
        "historical_context_used": False
    }
    set_llm_provider(MockLLMProvider(response_payload=mock_claim_response))

    res = client.post("/api/agent/query", json={"query": "My password is locked."})
    assert res.status_code == 200
    data = res.json()

    # Grounding validator should detect unsupported action claim and trigger fallback
    assert data["response_source"] == "deterministic_fallback"
    assert "I have unlocked your account" not in data["response"]


# ==============================================================================
# TEST 12 — MISSING API KEY
# ==============================================================================
def test_12_missing_api_key_deterministic_fallback():
    """
    Run without OPENAI_API_KEY.
    Expected: application starts normally, agent endpoint remains functional, deterministic fallback is used.
    """
    set_llm_provider(None)

    res = client.post("/api/agent/query", json={"query": "How do I connect a guest to Wi-Fi?"})
    assert res.status_code == 200
    data = res.json()

    assert data["intent"] == IntentCategory.WIFI_NETWORK.value
    assert data["decision"] == WorkflowDecision.RESOLVE.value
    assert data["response_source"] == "deterministic_fallback"
    assert "KB-07" in data["response"]
