"use client";

import React, { useState } from "react";
import {
  sendAgentQuery,
  AgentQueryResponse,
  approveActionRequest,
  rejectActionRequest
} from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Send,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Shield,
  Ticket,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Wrench,
  Clock,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

const AGENT_SCENARIOS = [
  { label: "Scenario 1 (Lockout)", query: "My password is locked." },
  { label: "Scenario 2 (Software)", query: "I need software that is not in the catalog." },
  { label: "Scenario 3 (Guest Wi-Fi)", query: "How do I connect to guest Wi-Fi?" },
  { label: "Scenario 4 (VPN Expired)", query: "My VPN credentials have expired." },
  { label: "Scenario 5 (Laptop Refresh)", query: "My laptop is old and I think it needs to be replaced." },
  { label: "Action: Check VPN", query: "Check my VPN status" },
  { label: "Action: Reset Password", query: "I need to reset my password" },
  { label: "Action: Check Ticket", query: "Check ticket TK-1042" },
  { label: "Action: Check Account", query: "Is my account locked?" },
  { label: "Action: Replace Laptop", query: "I need a replacement laptop" },
  { label: "Action: Malicious Delete", query: "Delete my colleague's account" },
];

export function AgentQueryCard() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AgentQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (userQuery: string = query) => {
    if (!userQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendAgentQuery(userQuery.trim());
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Agent workflow query failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (actionRequestId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const updatedAction = await approveActionRequest(actionRequestId);
      if (result) {
        setResult({
          ...result,
          action: {
            ...result.action,
            ...updatedAction,
            status: "EXECUTED",
          }
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Approval request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (actionRequestId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const updatedAction = await rejectActionRequest(actionRequestId);
      if (result) {
        setResult({
          ...result,
          action: {
            ...result.action,
            ...updatedAction,
            status: "REJECTED",
          }
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Rejection request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "RESOLVE":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 inline-flex items-center gap-1 font-semibold text-[11px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            RESOLVE
          </Badge>
        );
      case "CLARIFY":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 inline-flex items-center gap-1 font-semibold text-[11px]">
            <HelpCircle className="h-3 w-3 text-amber-600" />
            CLARIFY
          </Badge>
        );
      case "ESCALATE":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 inline-flex items-center gap-1 font-semibold text-[11px]">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            ESCALATE
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] font-mono">
            {decision}
          </Badge>
        );
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "knowledge_base":
        return <BookOpen className="h-3.5 w-3.5 text-blue-600" />;
      case "policy":
        return <Shield className="h-3.5 w-3.5 text-amber-600" />;
      case "ticket":
        return <Ticket className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-xl mx-auto border-indigo-200 shadow-md bg-white mt-6 ring-1 ring-indigo-50">
      <CardHeader className="border-b border-slate-100 pb-3 bg-gradient-to-r from-slate-50 to-indigo-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Phase 5 — Veridian IT Support Agent
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Controlled Action Execution, Authorization Boundary & Demo Approvals
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border-indigo-200">
            Phase 5 Agent
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Available Tools Registry Banner */}
        <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-2.5 text-[11px] text-slate-700">
          <div className="font-semibold text-indigo-900 mb-1 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
            <span>Available IT Tools (Controlled Registry):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-slate-600 text-[10px]">
            <span className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono">✓ Check Account (Read-Only)</span>
            <span className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono">✓ Check VPN (Read-Only)</span>
            <span className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono">✓ Check Ticket (Read-Only)</span>
            <span className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono">✓ Reset Password (Approval Req)</span>
            <span className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono">✓ Replace Laptop (POL-01)</span>
          </div>
        </div>

        {/* Input form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="agent-query-input"
              placeholder="Ask an IT support question or request an action..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="text-xs"
            />
            <Button
              id="agent-submit-button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 gap-1.5"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Ask Agent
            </Button>
          </div>

          {/* Quick test scenarios */}
          <div className="space-y-1 pt-1">
            <div className="text-[11px] font-medium text-slate-400">Quick Test Scenarios & Actions:</div>
            <div className="flex flex-wrap gap-1.5">
              {AGENT_SCENARIOS.map((scenario, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(scenario.query);
                    handleSubmit(scenario.query);
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition text-left"
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Agent Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Agent result */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {/* Metadata badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Decision:</span>
                {getDecisionBadge(result.decision)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Intent:</span>
                <Badge variant="outline" className="font-mono text-[10px] text-slate-700 bg-white">
                  {result.intent}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({Math.round(result.confidence * 100)}% conf)
                </span>
              </div>
            </div>

            {/* Clarification callout */}
            {result.clarification_required && result.clarification_question && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-800">Clarification Needed</div>
                  <p className="leading-relaxed">{result.clarification_question}</p>
                </div>
              </div>
            )}

            {/* Escalation callout */}
            {result.decision === "ESCALATE" && result.escalation_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-900">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-rose-800">Escalation Required</div>
                  <p className="leading-relaxed">{result.escalation_reason}</p>
                </div>
              </div>
            )}

            {/* Phase 5 Action Execution & Approval Block */}
            {result.action && (
              <div className="space-y-2">
                {result.action.status === "PENDING_APPROVAL" && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-2 text-amber-950">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Approval Required: {result.action.action_name}</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-[10px]">
                        Pending Approval
                      </Badge>
                    </div>
                    <div className="text-[11px] text-amber-800 leading-relaxed">
                      {result.action.message}
                    </div>
                    {result.action.action_request_id && (
                      <div className="text-[10px] font-mono text-amber-700">
                        Request ID: <span className="font-semibold">{result.action.action_request_id}</span>
                      </div>
                    )}
                    {/* Demo Approval Controls */}
                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-amber-700 italic">Demo Approval Controls:</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleApprove(result.action?.action_request_id || "")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 gap-1"
                        >
                          <ThumbsUp className="w-3 h-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => handleReject(result.action?.action_request_id || "")}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] h-7 px-2.5 gap-1"
                        >
                          <ThumbsDown className="w-3 h-3" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(result.action.status === "COMPLETED" || result.action.status === "EXECUTED") && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1.5 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Action Executed: {result.action.action_name}</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-[10px]">
                        {result.action.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-emerald-800 leading-relaxed">
                      {result.action.message}
                    </div>
                    {result.action.data && (
                      <div className="bg-white/80 p-2 rounded border border-emerald-100 font-mono text-[10px] text-slate-600 max-h-24 overflow-auto">
                        {JSON.stringify(result.action.data, null, 2)}
                      </div>
                    )}
                  </div>
                )}

                {result.action.status === "REJECTED" && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-1.5 text-rose-950">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Action Not Authorized: {result.action.action_name}</span>
                      </div>
                      <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 font-mono text-[10px]">
                        Rejected
                      </Badge>
                    </div>
                    <div className="text-[11px] text-rose-800 leading-relaxed">
                      {result.action.message}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grounded response */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Grounded Agent Response
                </div>
                {result.response_source === "llm" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    AI-generated from verified IT sources
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                    <ShieldCheck className="h-3 w-3 text-slate-500" />
                    Using verified fallback response
                  </span>
                )}
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {result.response}
              </div>
            </div>

            {/* Sources referenced */}
            {result.sources.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Referenced Grounding Sources ({result.sources.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] text-slate-700"
                    >
                      {getSourceIcon(src.source_type)}
                      <span className="font-semibold font-mono">{src.source_id}</span>
                      {src.title && <span className="text-slate-500 truncate max-w-[140px]">({src.title})</span>}
                      <span className="text-[10px] text-emerald-600 font-mono font-medium">
                        {src.score.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
