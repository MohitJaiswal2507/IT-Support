# Phase 2 — Retrieval / RAG Foundation Completion Report

**Project**: Veridian Internal Service Agent (Assignment 2 — Internal IT Support Agent)  
**Current Phase**: Phase 2 — Retrieval / RAG Foundation  
**Branch**: `phase-2-retrieval`  
**Status**: Completed & Verified  

---

## 1. Phase Overview

Phase 2 introduces the semantic retrieval and Retrieval-Augmented Generation (RAG) layer for the Veridian Internal Service Agent. This layer allows the upcoming agentic reasoning workflows (Phase 3+) to semantically search and ground responses in Veridian's internal knowledge base, corporate asset management policies, and historical IT tickets without making external network calls or relying on cloud vector databases.

All retrieval infrastructure is implemented locally and deterministically using open-source, reproducible tooling (`sentence-transformers`, `faiss-cpu`, `numpy`).

---

## 2. Branch Information

- **Active Branch**: `phase-2-retrieval`
- **Base Branch**: `main` (containing Phase 0 foundation and Phase 1 relational data layer)
- **Branch Strategy**: Strict phase isolation. Changes are localized to retrieval modules, schemas, endpoints, tests, and developer UI test card. No commits or branch merges have been performed in this phase.

---

## 3. Objectives Completed

- [x] Evaluated and installed local embedding and vector store dependencies (`sentence-transformers>=3.0.0`, `faiss-cpu>=1.8.0`, `numpy>=1.26.0`).
- [x] Designed and built document loading subsystem (`backend/app/retrieval/documents.py`) extracting records from both SQLite database and JSON seed files.
- [x] Implemented deterministic sentence-aware chunker (`backend/app/retrieval/chunker.py`) maintaining original identifiers and source metadata.
- [x] Built singleton embedding manager (`backend/app/retrieval/embeddings.py`) utilizing `all-MiniLM-L6-v2` with embedding normalization.
- [x] Implemented vector store engine (`backend/app/retrieval/vector_store.py`) backed by FAISS `IndexFlatIP` (inner product on normalized embeddings = cosine similarity).
- [x] Built standalone CLI indexer (`backend/app/retrieval/build_index.py`) executed via `python -m app.retrieval.build_index`.
- [x] Implemented core retrieval service (`backend/app/retrieval/service.py`) supporting query embedding, top-k ranking, and metadata filtering.
- [x] Created typed Pydantic schemas (`backend/app/schemas/retrieval.py`) for search results and responses.
- [x] Implemented and registered REST API endpoint (`GET /api/retrieval/search`).
- [x] Confirmed employee requests (`REQ-01` to `REQ-15`) are strictly excluded from indexing.
- [x] Created developer interactive testing card (`frontend/src/components/RetrievalTestCard.tsx`) integrated into the Next.js homepage.
- [x] Created comprehensive automated test suite (`backend/tests/test_retrieval.py`) achieving 100% pass rate across all 27 test cases (15 Phase 1 + 12 Phase 2).

---

## 4. Architecture & Design Decisions

```
+-------------------------------------------------------------------------+
|                              Next.js UI                                 |
|            RetrievalTestCard (Query, Filters, Score Inspector)          |
+------------------------------------+------------------------------------+
                                     |  GET /api/retrieval/search
                                     v
+-------------------------------------------------------------------------+
|                           FastAPI Router Layer                          |
|                     backend/app/api/routes/retrieval.py                 |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                             RetrievalService                            |
|                       backend/app/retrieval/service.py                  |
+-------------------+--------------------------------+--------------------+
                    |                                |
                    v                                v
+-----------------------------------+  +----------------------------------+
|          EmbeddingManager         |  |         FaissVectorStore         |
|   (sentence-transformers L6-v2)   |  | (IndexFlatIP + metadata.json)    |
|   dim=384, normalize=True         |  | storage/vector_store/index.faiss |
+-----------------------------------+  +----------------------------------+
```

### Key Technical Decisions:
1. **Model Selection (`all-MiniLM-L6-v2`)**: Fast inference, compact memory footprint (~80 MB), 384-dimensional dense vectors, and strong semantic text matching for IT helpdesk terminology.
2. **Similarity Metric (FAISS `IndexFlatIP`)**: Embeddings are L2-normalized (`normalize_embeddings=True`). Under unit vectors, inner product equals cosine similarity ($A \cdot B = \cos(\theta)$), resulting in bounded scores in $[-1.0, 1.0]$.
3. **Decoupled Service Pattern**: `RetrievalService` is instantiated once and injected into both REST endpoints and future agent components (`app.agent.*`) without duplicating embedding models or FAISS indices in RAM.
4. **Resilient Document Loading**: Primary loader pulls from SQLite database via SQLAlchemy sessions; falls back seamlessly to `data/*.json` if called during offline setups or migrations.

---

## 5. Document Loading Summary

The document loader (`load_all_documents`) ingests documents from the relational data layer:

| Source Type | Source ID Range | Ingested Count | Purpose in RAG Index |
|---|---|---|---|
| `knowledge_base` | `KB-01` to `KB-10` | 10 articles | Standard IT operating procedures, setup guides, and troubleshooting steps. |
| `policy` | `POL-01` | 1 document | Corporate asset management policy, hardware refresh cycles, return rules. |
| `ticket` | `TK-1042` to `TK-1051` | 10 tickets | Historical resolutions, past incident patterns, active ticket statuses. |
| **Total Ingested** | — | **21 documents** | **All 21 documents indexed.** |

*Employee Requests (`REQ-01` to `REQ-15`) are explicitly excluded from indexing as they represent incoming test queries.*

---

## 6. Chunking Strategy & Output

- **Strategy**: Deterministic sentence-boundary chunking (`DeterministicChunker`) with `max_chunk_size=600` characters and `overlap=100` characters.
- **Document Characteristic**: All 10 Knowledge Base articles, 1 Asset Management Policy, and 10 Tickets have concise lengths ranging between 120 and 480 characters.
- **Resulting Chunks**: Each document maps deterministically to exactly 1 chunk (`KB-01-0`..`KB-10-0`, `POL-01-0`, `TK-1042-0`..`TK-1051-0`), preserving complete context and avoiding broken sentences or missing identifiers.
- **Total Chunks**: **21 chunks**.
- **Metadata Enriched**: Each chunk retains `source_id`, `source_type`, `title`, and specific attributes (`status`, `employee`, `is_active` for tickets; `issued_by`, `last_updated` for policy).

---

## 7. Embedding Model Details

- **Model**: `all-MiniLM-L6-v2` via `sentence-transformers`
- **Output Dimensions**: `384`
- **Normalization**: Enabled (`normalize_embeddings=True`)
- **Execution Device**: CPU (`device="cpu"`) for universal portability and zero CUDA dependency.
- **Batch Processing**: Chunks are embedded in a single batch during index construction and single-vector encoded at query time.

---

## 8. Vector Store Configuration

- **Engine**: FAISS (`faiss-cpu`)
- **Index Type**: `faiss.IndexFlatIP(384)` (Exact flat inner product search on normalized vectors)
- **Search Complexity**: $O(N \cdot D)$ where $N=21$, $D=384$. Sub-millisecond latency (<1ms search execution).
- **Metadata Mapping**: Metadata array indexed 1:1 with FAISS vector row positions (`0..20`).

---

## 9. Storage / Persistence Details

- **Storage Path**: `backend/storage/vector_store/`
  - `index.faiss`: Binary FAISS index file (32,301 bytes)
  - `metadata.json`: Chunk metadata and text payloads (9,285 bytes)
- **Version Control Safety**: `backend/storage/` and `*.faiss` added to `.gitignore`. The index can be reconstructed idempotently at any time by running:
  ```powershell
  python -m app.retrieval.build_index
  ```

---

## 10. API Endpoint Specifications

### `GET /api/retrieval/search`

#### Parameters:
| Name | Type | In | Required | Default | Description |
|---|---|---|---|---|---|
| `query` | `string` | Query | Yes | — | Search query text (alias `q` supported). Must not be empty. |
| `top_k` | `integer` | Query | No | `3` | Number of results to return ($1 \le \text{top\_k} \le 50$). |
| `source_type` | `string` | Query | No | `None` | Filter by: `knowledge_base`, `policy`, `ticket`. |

#### HTTP Response Codes:
- `200 OK`: Successful search, returns ranked results with scores and metadata.
- `400 Bad Request`: Query is empty/whitespace or `source_type` is invalid.
- `422 Unprocessable Entity`: Validation failure on types or ranges (e.g. `top_k < 1`).
- `503 Service Unavailable`: Vector index has not been built on disk.

#### Example Response Body:
```json
{
  "query": "My VPN credentials expired",
  "total_results": 3,
  "results": [
    {
      "chunk_id": "TK-1042-0",
      "source_id": "TK-1042",
      "source_type": "ticket",
      "score": 0.6695,
      "text": "Ticket TK-1042: VPN credential expired\nRequester: R. Verma\nStatus: Resolved (closed)",
      "metadata": {
        "id": "TK-1042",
        "employee": "R. Verma",
        "status": "Resolved (closed)",
        "is_active": false,
        "source_id": "TK-1042",
        "source_type": "ticket"
      }
    },
    {
      "chunk_id": "KB-02-0",
      "source_id": "KB-02",
      "source_type": "knowledge_base",
      "score": 0.6549,
      "text": "VPN Access\nVPN access is granted automatically to all full-time employees...",
      "metadata": {
        "title": "VPN Access",
        "id": "KB-02",
        "source_id": "KB-02",
        "source_type": "knowledge_base"
      }
    }
  ]
}
```

---

## 11. Test Queries & Retrieval Outputs

All 5 core semantic scenarios were executed through the live vector retrieval engine:

### Scenario 1: Password Lockout
- **Query**: `"I entered my password too many times and I'm locked out"`
- **Results**:
  - **Rank 1**: `KB-01` (`KB-01-0`) | **Score: 0.6105** | Type: `knowledge_base`  
    *Snippet*: "Password Reset — Employees can reset their own password via the self-service portal..."
  - **Rank 2**: `TK-1049` (`TK-1049-0`) | **Score: 0.4719** | Type: `ticket`  
    *Snippet*: "Ticket TK-1049: Password reset / Requester: V. Nambiar / Status: Resolved (closed)"
  - **Rank 3**: `TK-1048` (`TK-1048-0`) | **Score: 0.3021** | Type: `ticket`

### Scenario 2: Unapproved Software Request
- **Query**: `"I need to install software that isn't approved"`
- **Results**:
  - **Rank 1**: `KB-04` (`KB-04-0`) | **Score: 0.5580** | Type: `knowledge_base`  
    *Snippet*: "Software Installation Requests — Standard software (listed in the approved catalog) can be self-installed. Non-catalog software requires Security Review..."
  - **Rank 2**: `TK-1044` (`TK-1044-0`) | **Score: 0.3787** | Type: `ticket`  
    *Snippet*: "Ticket TK-1044: Non-catalog software request / Requester: A. Khan / Status: Pending Security review"
  - **Rank 3**: `TK-1050` (`TK-1050-0`) | **Score: 0.2456** | Type: `ticket`

### Scenario 3: Visitor Wi-Fi
- **Query**: `"My visitor needs Wi-Fi"`
- **Results**:
  - **Rank 1**: `KB-07` (`KB-07-0`) | **Score: 0.4843** | Type: `knowledge_base`  
    *Snippet*: "Guest Wi-Fi Access — Guest Wi-Fi credentials are valid for 24 hours and can be generated by any employee from the front-desk portal..."
  - **Rank 2**: `TK-1051` (`TK-1051-0`) | **Score: 0.4424** | Type: `ticket`  
    *Snippet*: "Ticket TK-1051: Guest Wi-Fi issued / Requester: L. Menon / Status: Resolved (closed)"
  - **Rank 3**: `KB-10` (`KB-10-0`) | **Score: 0.2951** | Type: `knowledge_base`

### Scenario 4: Expired VPN Credentials
- **Query**: `"My VPN credentials expired"`
- **Results**:
  - **Rank 1**: `TK-1042` (`TK-1042-0`) | **Score: 0.6695** | Type: `ticket`  
    *Snippet*: "Ticket TK-1042: VPN credential expired / Requester: R. Verma / Status: Resolved (closed)"
  - **Rank 2**: `KB-02` (`KB-02-0`) | **Score: 0.6549** | Type: `knowledge_base`  
    *Snippet*: "VPN Access — VPN access is granted automatically to all full-time employees..."
  - **Rank 3**: `TK-1049` (`TK-1049-0`) | **Score: 0.4014** | Type: `ticket`

### Scenario 5: Hardware / Laptop Replacement
- **Query**: `"I need a new laptop because it is old"`
- **Results**:
  - **Rank 1**: `KB-03` (`KB-03-0`) | **Score: 0.5770** | Type: `knowledge_base`  
    *Snippet*: "Laptop Replacement — Laptops are eligible for replacement after 3 years of service..."
  - **Rank 2**: `TK-1043` (`TK-1043-0`) | **Score: 0.5546** | Type: `ticket`  
    *Snippet*: "Ticket TK-1043: Laptop replacement (3.2 yrs old) / Requester: S. Iyer / Status: Approved – pending fulfillment"
  - **Rank 3**: `TK-1047` (`TK-1047-0`) | **Score: 0.2444** | Type: `ticket`

---

## 12. Top-K Parameter Verification

- Calling `GET /api/retrieval/search?query=laptop&top_k=1` returns exactly 1 item.
- Calling `GET /api/retrieval/search?query=laptop&top_k=3` returns exactly 3 items.
- Calling `GET /api/retrieval/search?query=laptop&top_k=5` returns 5 items.
- Verified that top-k slicing preserves descending cosine similarity order:
  $$\text{score}_0 \ge \text{score}_1 \ge \dots \ge \text{score}_{k-1}$$

---

## 13. Metadata Filtering Verification

The retrieval layer supports strict subset filtering on `source_type`:
- `source_type=policy`: Guarantees 100% of returned items are from `POL-01`.
- `source_type=knowledge_base`: Filters out tickets and policy docs, returning only `KB-01`..`KB-10`.
- `source_type=ticket`: Filters out articles, returning only ticket records.
- Filter invalid value check: Requesting `source_type=invalid_type` immediately returns HTTP 400 Bad Request with a clear enumeration of valid source types.

---

## 14. Ticket Retrieval Behavior

- **Historical Coverage**: Both closed tickets (e.g. `TK-1042`, `TK-1049`, `TK-1051`) and active tickets (e.g. `TK-1043`, `TK-1044`, `TK-1048`) are indexed and retrievable.
- **Incident Precedent Matching**: Queries matching common past issues (such as VPN expiration or password resets) surface historical tickets with high similarity (>0.45), allowing future agent reasoning steps to cite prior solutions.
- **Metadata Retention**: Returned ticket results maintain `status`, `employee`, and `is_active` fields.

---

## 15. Verification Results

### Automated Backend Tests (`pytest`)
Ran full backend test suite in `.venv`:
```powershell
.\.venv\Scripts\pytest.exe -v
```
**Outcome**: **27 passed in 25.82s (100% pass rate)**
- `test_data_layer.py`: 15 passed (Seed idempotency, health check, KB, policies, requests, tickets)
- `test_retrieval.py`: 12 passed (Document loader, chunker, validation, top_k, filtering, 5 semantic scenarios, ticket metadata, score ordering)

### Next.js Frontend Verification (`npm run build`)
Ran production build in `frontend/`:
```powershell
npm run build
```
**Outcome**: Clean compilation (0 TypeScript errors, 0 ESLint errors). Turbopack optimized build succeeded.

---

## 16. Unindexed Data Confirmation

- **Employee Requests (`REQ-01` through `REQ-15`)**: Confirmed **100% excluded** from the vector store and FAISS index.
- In `backend/tests/test_retrieval.py::test_document_loader_counts`, an explicit assertion enforces:
  ```python
  req_docs = [d for d in docs if d.source_type == "request" or d.source_id.startswith("REQ")]
  assert len(req_docs) == 0
  ```
- Employee requests remain reserved as test inputs for agent workflows in subsequent phases.

---

## 17. Backward Compatibility

- **Phase 0 Health Check**: `GET /health` continues to return HTTP 200 with service status `ok`.
- **Phase 1 Relational Data APIs**:
  - `GET /api/knowledge-base` (10 items)
  - `GET /api/policies` (1 item)
  - `GET /api/requests` (15 items)
  - `GET /api/tickets` (10 items)
- All existing endpoints, database seed scripts, and models remain completely unaffected and functional.

---

## 18. Edge Cases & Handling

1. **Empty Search Queries**: Queries with empty strings or whitespace (`query="   "`) are rejected with `HTTP 400 Bad Request`.
2. **Missing Vector Store**: If the backend is started before running `build_index`, queries return `HTTP 503 Service Unavailable` instructing the operator to run `python -m app.retrieval.build_index`.
3. **Invalid Filter Types**: Unsupported `source_type` inputs are caught before similarity calculation and rejected with `HTTP 400`.
4. **Out-of-Bounds `top_k`**: Values $< 1$ or $> 50$ are blocked by FastAPI validation with `HTTP 422 Unprocessable Entity`.
5. **Score Stability**: L2 vector normalization prevents inner product score drift, keeping scores strictly in $[-1.0, 1.0]$.

---

## 19. Known Limitations

- **Exact Keyword vs Semantic Balance**: Very short or acronym-heavy queries (e.g. `"MFA"`) rely on semantic proximity; future phases may optionally combine lexical BM25/hybrid search if exact token matching is prioritized.
- **Index Rebuild Requirement**: Modifying documents in the SQLite database requires re-running `build_index.py` to synchronize vector weights.

---

## 20. Phase Boundaries & Non-Goals

The following items were **strictly avoided** in Phase 2 in adherence with the specification:
- ❌ No LLM prompts or completions (OpenAI, Anthropic, Gemini, local Ollama).
- ❌ No LangChain or LangGraph frameworks.
- ❌ No agent decision logic, routing, or autonomous actions.
- ❌ No automated ticket creation, approval decisions, or escalations.
- ❌ No modifications to `README.md`.
- ❌ No modification or deletion of `Phase_*.md` and `*.env.example` in `.gitignore`.

---

## 21. Readiness for Phase 3

The retrieval foundation is fully ready for Phase 3 (Agent Architecture & Workflow):
- `RetrievalService.search()` provides a clean Python API for agent tool calls.
- `GET /api/retrieval/search` provides HTTP access for frontend and external agents.
- All 21 corporate documents (KB, policies, tickets) are indexed with sub-millisecond retrieval.
- Ground truth semantic scenarios demonstrate high-confidence rank-1 matching.
