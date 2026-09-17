"use client";

import React, { useEffect, useState, useCallback } from "react";
import { checkBackendHealth, HealthCheckResult } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Globe,
  Clock,
  Radio,
} from "lucide-react";

export function StatusCard() {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await checkBackendHealth();
      setResult(res);
    } catch {
      setResult({
        ok: false,
        error: "Unexpected client exception during health check",
        checkedAt: new Date().toLocaleTimeString(),
        endpoint: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/health",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const isConnected = result?.ok === true;

  return (
    <Card className="max-w-xl mx-auto border-slate-200 shadow-sm bg-white">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-slate-700" />
            <CardTitle className="text-base font-semibold text-slate-900">
              Backend Connectivity Status
            </CardTitle>
          </div>
          <div>
            {isLoading ? (
              <Badge variant="secondary" className="flex items-center gap-1.5 text-slate-600">
                <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />
                Checking...
              </Badge>
            ) : isConnected ? (
              <Badge variant="success" className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                Unable to connect
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 mt-1">
          Real-time health verification communicating with the FastAPI backend service.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Main Status Display */}
        <div
          className={`p-4 rounded-lg border flex items-start space-x-3.5 ${
            isLoading
              ? "bg-slate-50 border-slate-200"
              : isConnected
              ? "bg-emerald-50/60 border-emerald-200/80"
              : "bg-rose-50/60 border-rose-200/80"
          }`}
        >
          <div className="mt-0.5">
            {isLoading ? (
              <Activity className="h-5 w-5 text-slate-400" />
            ) : isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-0.5">
              Backend Status
            </div>
            <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
              {isLoading ? (
                <span>Checking service status...</span>
              ) : isConnected ? (
                <>
                  <span className="text-emerald-700">● Connected</span>
                  <span className="text-xs text-slate-500 font-normal">
                    (System operational)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-rose-700">● Offline</span>
                  <span className="text-xs text-slate-500 font-normal">
                    (Backend unavailable)
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {isLoading
                ? "Sending request to GET /health..."
                : isConnected
                ? `Successfully verified response from ${result?.data?.service || "backend"}.`
                : result?.error || "Unable to reach the backend service. Ensure Uvicorn is running."}
            </p>
          </div>
        </div>

        {/* Technical Diagnostics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              Target Endpoint
            </div>
            <div className="font-mono text-xs text-slate-800 truncate" title={result?.endpoint}>
              {result?.endpoint || "http://localhost:8000/health"}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-slate-400" />
              Response Latency
            </div>
            <div className="font-mono text-xs text-slate-800">
              {result?.latencyMs !== undefined ? `${result.latencyMs} ms` : "—"}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-slate-400" />
              Service Identifier
            </div>
            <div className="font-mono text-xs text-slate-800">
              {result?.data?.service || "—"}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Last Checked
            </div>
            <div className="font-mono text-xs text-slate-800">
              {result?.checkedAt || "—"}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-100 pt-4 flex items-center justify-between bg-slate-50/30">
        <span className="text-xs text-slate-500">
          Configured via <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Retry Connection
        </Button>
      </CardFooter>
    </Card>
  );
}
