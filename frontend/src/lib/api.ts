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
