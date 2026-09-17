export interface HealthResponse {
  status: string;
  service: string;
  environment?: string;
  version?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  data?: HealthResponse;
  error?: string;
  latencyMs?: number;
  checkedAt: string;
  endpoint: string;
}

export interface DatasetCounts {
  knowledgeBase: number;
  policies: number;
  requests: number;
  tickets: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Checks backend health status by calling GET /health
 * Gracefully captures connection errors without throwing unhandled exceptions.
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const endpoint = `${API_BASE_URL.replace(/\/+$/, "")}/health`;
  const startTime = performance.now();
  const checkedAt = new Date().toLocaleTimeString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      return {
        ok: false,
        error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
        latencyMs,
        checkedAt,
        endpoint,
      };
    }

    const data: HealthResponse = await res.json();
    return {
      ok: true,
      data,
      latencyMs,
      checkedAt,
      endpoint,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    let errorMessage = "Unable to connect to backend server";

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        errorMessage = "Connection timed out (backend not responding)";
      } else {
        errorMessage = err.message;
      }
    }

    return {
      ok: false,
      error: errorMessage,
      latencyMs,
      checkedAt,
      endpoint,
    };
  }
}

/**
 * Fetches dataset counts dynamically from Phase 1 backend APIs.
 */
export async function fetchDatasetCounts(): Promise<DatasetCounts | null> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  try {
    const [kbRes, polRes, reqRes, tickRes] = await Promise.all([
      fetch(`${baseUrl}/api/knowledge-base`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/policies`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/requests`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/tickets`, { cache: "no-store" }),
    ]);

    if (!kbRes.ok || !polRes.ok || !reqRes.ok || !tickRes.ok) {
      return null;
    }

    const [kbData, polData, reqData, tickData] = await Promise.all([
      kbRes.json(),
      polRes.json(),
      reqRes.json(),
      tickRes.json(),
    ]);

    return {
      knowledgeBase: kbData.total ?? 0,
      policies: polData.total ?? 0,
      requests: reqData.total ?? 0,
      tickets: tickData.total ?? 0,
    };
  } catch {
    return null;
  }
}

export interface SearchResultItem {
  chunk_id: string;
  source_id: string;
  source_type: "knowledge_base" | "policy" | "ticket";
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

export interface RetrievalSearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

/**
 * Searches the local vector store via GET /api/retrieval/search
 */
export async function searchRetrieval(
  query: string,
  topK: number = 3,
  sourceType?: string
): Promise<RetrievalSearchResponse> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const params = new URLSearchParams({
    query,
    top_k: topK.toString(),
  });
  if (sourceType && sourceType !== "all") {
    params.set("source_type", sourceType);
  }

  const res = await fetch(`${baseUrl}/api/retrieval/search?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export interface AgentSourceItem {
  source_id: string;
  source_type: string;
  score: number;
  title?: string | null;
}

export interface AgentActionItem {
  action_name: string;
  status: string;
  action_request_id?: string | null;
  message?: string | null;
  data?: Record<string, unknown> | null;
}

export interface AgentQueryResponse {
  query: string;
  intent: string;
  confidence: number;
  decision: "RESOLVE" | "CLARIFY" | "ESCALATE";
  clarification_required: boolean;
  clarification_question?: string | null;
  response: string;
  response_source?: "llm" | "deterministic_fallback";
  relevant_sources?: string[];
  sources: AgentSourceItem[];
  escalation_reason?: string | null;
  action?: AgentActionItem | null;
}

/**
 * Sends an IT support query to the agent workflow via POST /api/agent/query
 */
export async function sendAgentQuery(query: string): Promise<AgentQueryResponse> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/agent/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export interface ToolMetadataItem {
  name: string;
  description: string;
  risk_level: "READ_ONLY" | "REQUEST_CREATION" | "SENSITIVE";
  requires_approval: boolean;
}

/**
 * Lists all registered IT tools via GET /api/tools
 */
export async function getRegisteredTools(): Promise<ToolMetadataItem[]> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/tools`, { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

/**
 * Approves a pending action request via POST /api/actions/{id}/approve
 */
export async function approveActionRequest(
  actionRequestId: string,
  approver: string = "demo-admin",
  reason: string = "Approved in demo"
): Promise<AgentActionItem> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/actions/${actionRequestId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver, reason }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Approval failed (${res.status})`);
  }
  return res.json();
}

/**
 * Rejects a pending action request via POST /api/actions/{id}/reject
 */
export async function rejectActionRequest(
  actionRequestId: string,
  approver: string = "demo-admin",
  reason: string = "Rejected in demo"
): Promise<AgentActionItem> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/actions/${actionRequestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver, reason }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Rejection failed (${res.status})`);
  }
  return res.json();
}

/* =========================================================================
   Phase 6 Enterprise Entities & Fetchers
   ========================================================================= */

export interface TicketItem {
  id: string;
  employee: string;
  issue_summary: string;
  status: string;
  is_active: boolean;
}

export async function fetchTickets(status?: string, isActive?: boolean): Promise<{ items: TicketItem[]; total: number }> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (isActive !== undefined) params.set("is_active", String(isActive));

  const url = `${baseUrl}/api/tickets${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch tickets: ${res.status}`);
  return res.json();
}

export async function fetchTicketById(id: string): Promise<TicketItem> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/tickets/${id.toUpperCase()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Ticket ${id} not found`);
  return res.json();
}

export interface EmployeeRequestItem {
  id: string;
  employee: string;
  email: string;
  date_opened: string;
  request: string;
  initial_action_taken: string;
}

export async function fetchRequests(): Promise<{ items: EmployeeRequestItem[]; total: number }> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/requests`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch requests: ${res.status}`);
  return res.json();
}

export interface PolicyItem {
  id: string;
  title: string;
  issued_by?: string | null;
  last_updated?: string | null;
  content: string;
}

export async function fetchPolicies(): Promise<{ items: PolicyItem[]; total: number }> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/policies`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch policies: ${res.status}`);
  return res.json();
}

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  category?: string | null;
  content: string;
  source_file?: string | null;
}

export async function fetchKnowledgeBase(): Promise<{ items: KnowledgeBaseItem[]; total: number }> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/knowledge-base`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch knowledge base: ${res.status}`);
  return res.json();
}

export interface ActionRecordItem {
  action_id: string;
  action_name: string;
  status: string;
  requester: string;
  requested_at: string;
  approved_at?: string | null;
  completed_at?: string | null;
  approval_required: boolean;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export async function fetchActionRequests(status?: string): Promise<{ items: ActionRecordItem[]; total: number }> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const url = `${baseUrl}/api/actions${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    // If backend doesn't support /api/actions yet or errors, return empty list gracefully
    return { items: [], total: 0 };
  }
  return res.json();
}

export async function executeDirectAction(
  actionName: string,
  parameters: Record<string, unknown>,
  requester: string = "demo-user"
): Promise<AgentActionItem> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/api/actions/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_name: actionName,
      parameters,
      requester,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Action execution failed: ${res.status}`);
  }
  return res.json();
}
