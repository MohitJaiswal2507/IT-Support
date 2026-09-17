import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.seed import seed_database
from app.db.database import SessionLocal
from app.db.models import KnowledgeBaseArticle, Policy, EmployeeRequest, Ticket

client = TestClient(app)


def test_seed_idempotency_and_counts():
    """Verify seed process succeeds and can run multiple times without duplicating records."""
    counts1 = seed_database()
    counts2 = seed_database()

    assert counts1["Knowledge Base"] == 10
    assert counts1["Policies"] == 1
    assert counts1["Requests"] == 15
    assert counts1["Tickets"] == 10

    assert counts2["Knowledge Base"] == 10
    assert counts2["Policies"] == 1
    assert counts2["Requests"] == 15
    assert counts2["Tickets"] == 10


def test_health_endpoint():
    """Verify Phase 0 GET /health continues to operate seamlessly."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "veridian-it-support-agent"


def test_list_knowledge_base():
    """Verify GET /api/knowledge-base returns exactly 10 items."""
    response = client.get("/api/knowledge-base")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 10

    # Verify known IDs exist
    kb_ids = [item["id"] for item in data["items"]]
    for i in range(1, 11):
        assert f"KB-{i:02d}" in kb_ids


def test_get_knowledge_base_article_by_id():
    """Verify known KB ID retrieval."""
    response = client.get("/api/knowledge-base/KB-01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "KB-01"
    assert data["title"] == "Password Reset"
    assert "self-service portal" in data["content"]


def test_get_knowledge_base_article_not_found():
    """Verify non-existent KB ID returns 404."""
    response = client.get("/api/knowledge-base/KB-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_policies():
    """Verify GET /api/policies returns the Asset Management Policy."""
    response = client.get("/api/policies")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1

    policy = data["items"][0]
    assert policy["id"] == "POL-01"
    assert "Asset Management Policy" in policy["title"]
    assert "4-year refresh cycle" in policy["content"]


def test_get_policy_by_id():
    """Verify single policy retrieval."""
    response = client.get("/api/policies/POL-01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "POL-01"
    assert data["issued_by"] == "Finance & Assets"
    assert data["last_updated"] == "Q2 2026"


def test_get_policy_not_found():
    """Verify non-existent policy ID returns 404."""
    response = client.get("/api/policies/POL-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_employee_requests():
    """Verify GET /api/requests returns exactly 15 items."""
    response = client.get("/api/requests")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 15
    assert len(data["items"]) == 15

    req_ids = [item["id"] for item in data["items"]]
    for i in range(1, 16):
        assert f"REQ-{i:02d}" in req_ids


def test_get_employee_request_by_id():
    """Verify known employee request retrieval."""
    response = client.get("/api/requests/REQ-01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "REQ-01"
    assert data["employee"] == "Aditi Sharma"
    assert "3.5 years" in data["request"]
    assert data["initial_action_taken"] == "Not started"


def test_get_employee_request_not_found():
    """Verify non-existent request ID returns 404."""
    response = client.get("/api/requests/REQ-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_tickets():
    """Verify GET /api/tickets returns exactly 10 items."""
    response = client.get("/api/tickets")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 10

    ticket_ids = [item["id"] for item in data["items"]]
    for i in range(1042, 1052):
        assert f"TK-{i}" in ticket_ids


def test_get_ticket_by_id():
    """Verify known ticket retrieval."""
    response = client.get("/api/tickets/TK-1042")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "TK-1042"
    assert data["employee"] == "R. Verma"
    assert data["status"] == "Resolved (closed)"
    assert data["is_active"] is False


def test_ticket_filtering_active():
    """Verify ticket filtering by is_active boolean."""
    response = client.get("/api/tickets?is_active=true")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["is_active"] is True

    closed_response = client.get("/api/tickets?is_active=false")
    assert closed_response.status_code == 200
    closed_data = closed_response.json()
    for item in closed_data["items"]:
        assert item["is_active"] is False

    assert data["total"] + closed_data["total"] == 10


def test_get_ticket_not_found():
    """Verify non-existent ticket ID returns 404."""
    response = client.get("/api/tickets/TK-9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
