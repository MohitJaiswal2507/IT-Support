import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.retrieval.documents import load_all_documents
from app.retrieval.chunker import chunk_documents
from app.retrieval.service import get_retrieval_service

client = TestClient(app)


def test_document_loader_counts():
    """Verify document loader correctly retrieves 10 KB, 1 Policy, and 10 Tickets."""
    docs = load_all_documents()
    assert len(docs) == 21

    kb_docs = [d for d in docs if d.source_type == "knowledge_base"]
    pol_docs = [d for d in docs if d.source_type == "policy"]
    tk_docs = [d for d in docs if d.source_type == "ticket"]

    assert len(kb_docs) == 10
    assert len(pol_docs) == 1
    assert len(tk_docs) == 10

    # Ensure REQ documents are NOT indexed
    req_docs = [d for d in docs if d.source_type == "request" or d.source_id.startswith("REQ")]
    assert len(req_docs) == 0


def test_chunking_deterministic():
    """Verify deterministic chunking produces non-empty text, correct IDs, and metadata."""
    docs = load_all_documents()
    chunks = chunk_documents(docs)
    assert len(chunks) == 21

    for chunk in chunks:
        assert chunk.chunk_id
        assert chunk.source_id
        assert chunk.source_type in {"knowledge_base", "policy", "ticket"}
        assert len(chunk.text.strip()) > 0
        assert isinstance(chunk.metadata, dict)
        assert chunk.metadata["source_id"] == chunk.source_id


def test_retrieval_endpoint_validation():
    """Verify query and filter validation rules on GET /api/retrieval/search."""
    # Empty / whitespace query
    res = client.get("/api/retrieval/search?query=")
    assert res.status_code == 400
    assert "cannot be empty" in res.json()["detail"]

    res = client.get("/api/retrieval/search?query=   ")
    assert res.status_code == 400

    # Invalid source_type
    res = client.get("/api/retrieval/search?query=laptop&source_type=invalid_source")
    assert res.status_code == 400
    assert "Invalid source_type" in res.json()["detail"]

    # Invalid top_k (< 1 or > 50)
    res = client.get("/api/retrieval/search?query=laptop&top_k=0")
    assert res.status_code == 422

    res = client.get("/api/retrieval/search?query=laptop&top_k=51")
    assert res.status_code == 422


def test_top_k_parameter():
    """Verify top_k limits the number of returned matches."""
    res1 = client.get("/api/retrieval/search?query=laptop+upgrade&top_k=1")
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1["results"]) == 1

    res3 = client.get("/api/retrieval/search?query=laptop+upgrade&top_k=3")
    assert res3.status_code == 200
    data3 = res3.json()
    assert len(data3["results"]) == 3


def test_source_type_filtering():
    """Verify source_type filtering strictly isolates the requested corpus."""
    # Policy only
    res_pol = client.get("/api/retrieval/search?query=laptop+replacement+cycle&source_type=policy&top_k=5")
    assert res_pol.status_code == 200
    data_pol = res_pol.json()
    assert len(data_pol["results"]) > 0
    for item in data_pol["results"]:
        assert item["source_type"] == "policy"
        assert item["source_id"] == "POL-01"

    # Knowledge Base only
    res_kb = client.get("/api/retrieval/search?query=password+reset&source_type=knowledge_base&top_k=3")
    assert res_kb.status_code == 200
    data_kb = res_kb.json()
    assert len(data_kb["results"]) > 0
    for item in data_kb["results"]:
        assert item["source_type"] == "knowledge_base"

    # Ticket only
    res_tk = client.get("/api/retrieval/search?query=display+adapter+flickering&source_type=ticket&top_k=3")
    assert res_tk.status_code == 200
    data_tk = res_tk.json()
    assert len(data_tk["results"]) > 0
    for item in data_tk["results"]:
        assert item["source_type"] == "ticket"
        assert item["source_id"].startswith("TK-")


def test_semantic_scenario_password_lockout():
    """Verify: 'I entered my password too many times and I'm locked out' retrieves KB-01."""
    query = "I entered my password too many times and I'm locked out"
    res = client.get(f"/api/retrieval/search?query={query}&top_k=3")
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) > 0
    top_source_ids = [r["source_id"] for r in results]
    assert "KB-01" in top_source_ids


def test_semantic_scenario_unapproved_software():
    """Verify: 'I need to install software that isn't approved' retrieves KB-04."""
    query = "I need to install software that isn't approved"
    res = client.get(f"/api/retrieval/search?query={query}&top_k=3")
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) > 0
    top_source_ids = [r["source_id"] for r in results]
    assert "KB-04" in top_source_ids


def test_semantic_scenario_visitor_wifi():
    """Verify: 'My visitor needs Wi-Fi' retrieves KB-07."""
    query = "My visitor needs Wi-Fi"
    res = client.get(f"/api/retrieval/search?query={query}&top_k=3")
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) > 0
    top_source_ids = [r["source_id"] for r in results]
    assert "KB-07" in top_source_ids


def test_semantic_scenario_vpn_credentials():
    """Verify: 'My VPN credentials expired' retrieves KB-02 and/or TK-1042."""
    query = "My VPN credentials expired"
    res = client.get(f"/api/retrieval/search?query={query}&top_k=3")
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) > 0
    top_source_ids = [r["source_id"] for r in results]
    assert "KB-02" in top_source_ids or "TK-1042" in top_source_ids


def test_semantic_scenario_laptop_replacement():
    """Verify: 'I need a new laptop because it is old' retrieves KB-03 and/or POL-01."""
    query = "I need a new laptop because it is old"
    res = client.get(f"/api/retrieval/search?query={query}&top_k=3")
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) > 0
    top_source_ids = [r["source_id"] for r in results]
    assert "KB-03" in top_source_ids or "POL-01" in top_source_ids


def test_ticket_metadata_preservation():
    """Verify tickets retain status, employee, and is_active metadata in search results."""
    res = client.get("/api/retrieval/search?query=VPN+certificate+expired&source_type=ticket&top_k=1")
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) == 1
    ticket = results[0]
    meta = ticket["metadata"]
    assert "status" in meta
    assert "employee" in meta
    assert "is_active" in meta
    assert "source_id" in meta


def test_score_ordering():
    """Verify returned results are strictly in descending score order."""
    res = client.get("/api/retrieval/search?query=network+connection+issue&top_k=5")
    assert res.status_code == 200
    results = res.json()["results"]
    scores = [r["score"] for r in results]
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i + 1]
