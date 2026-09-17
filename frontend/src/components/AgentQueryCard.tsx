"use client";

import React, { useState } from "react";
import { sendAgentQuery, AgentQueryResponse } from "@/lib/api";
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
  ShieldCheck
} from "lucide-react";

const AGENT_SCENARIOS = [
  { label: "Scenario 1 (Lockout)", query: "My password is locked." },
  { label: "Scenario 2 (Software)", query: "I need software that is not in the catalog." },
  { label: "Scenario 3 (Guest Wi-Fi)", query: "How do I connect to guest Wi-Fi?" },
  { label: "Scenario 4 (VPN Expired)", query: "My VPN credentials have expired." },
  { label: "Scenario 5 (Laptop Refresh)", query: "My laptop is old and I think it needs to be replaced." },
  { label: "Scenario 6 (Ambiguous)", query: "My laptop." },
  { label: "Scenario 7 (Out of Scope)", query: "Can you book a flight ticket to Paris for my vacation?" },
  { label: "Scenario 8 (Past Ticket)", query: "VPN certificate has expired for remote login" },
];

export function AgentQueryCard() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AgentQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
                Phase 4 — Veridian IT Support Agent
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Grounded response generation with deterministic workflow controls & fallback
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border-indigo-200">
            Agent Workflow
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Input form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="agent-query-input"
              placeholder="Ask an IT support question (e.g. My password is locked)..."
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
            <div className="text-[11px] font-medium text-slate-400">Assignment Test Scenarios:</div>
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
