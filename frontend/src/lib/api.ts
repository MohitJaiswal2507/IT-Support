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
