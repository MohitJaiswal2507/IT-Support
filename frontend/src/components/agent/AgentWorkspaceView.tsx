"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  RotateCcw,
  Bot,
  User,
  History,
  Info,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  sendAgentQuery,
  getRegisteredTools,
  approveActionRequest,
  rejectActionRequest,
  AgentQueryResponse,
  ToolMetadataItem,
} from "@/lib/api";

interface MessageItem {
  id: string;
  sender: "user" | "agent";
  text?: string;
  data?: AgentQueryResponse;
  timestamp: string;
}

interface AgentWorkspaceViewProps {
  initialQuery?: string;
}

export function AgentWorkspaceView({ initialQuery }: AgentWorkspaceViewProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<ToolMetadataItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<AgentQueryResponse | null>(null);

  const demoScenarios = [
    {
      id: "sc-1",
      title: "Password Locked",
      query: "My password is locked after multiple attempts.",
      tag: "RESOLVE",
    },
    {
      id: "sc-2",
      title: "VPN Expired",
      query: "My VPN certificate has expired.",
      tag: "RESOLVE + TOOL",
    },
    {
      id: "sc-3",
      title: "Password Reset",
      query: "I need to reset my password.",
      tag: "APPROVAL REQ",
    },
    {
      id: "sc-4",
      title: "Laptop > 3 Years",
      query: "My laptop is more than 3 years old.",
      tag: "POL-01 POLICY",
    },
    {
      id: "sc-5",
      title: "Ambiguous Laptop",
      query: "I need help with my laptop.",
      tag: "CLARIFY",
    },
    {
      id: "sc-6",
      title: "Delete Account",
      query: "Delete my colleague's account immediately.",
      tag: "ESCALATE / DENY",
    },
  ];

  // Load registered tools catalog
  useEffect(() => {
    getRegisteredTools()
      .then((tools) => setRegisteredTools(tools))
      .catch(() => {});
  }, []);

  // Handle initialQuery if passed from dashboard
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && messages.length === 0) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: MessageItem = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const response = await sendAgentQuery(q);
      const agentMsg: MessageItem = {
        id: `msg-${Date.now()}-agent`,
        sender: "agent",
        data: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setActiveAnalysis(response);
    } catch (err: unknown) {
      const errorMsg: MessageItem = {
        id: `msg-${Date.now()}-error`,
        sender: "agent",
        text: `Error contacting Veridian Agent: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (actionRequestId: string) => {
    setActionLoadingId(actionRequestId);
    try {
      const updatedAction = await approveActionRequest(
        actionRequestId,
        "demo-admin",
        "Approved in Veridian AI workspace"
      );
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.data?.action?.action_request_id === actionRequestId) {
            return {
              ...msg,
              data: {
                ...msg.data,
                action: {
                  ...msg.data.action,
                  status: updatedAction.status,
                  message: updatedAction.message,
                  data: updatedAction.data,
                },
              },
            };
          }
          return msg;
        })
      );
      if (activeAnalysis?.action?.action_request_id === actionRequestId) {
        setActiveAnalysis((prev) =>
          prev
            ? {
                ...prev,
                action: {
                  ...prev.action!,
                  status: updatedAction.status,
                  message: updatedAction.message,
                  data: updatedAction.data,
                },
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (actionRequestId: string) => {
    setActionLoadingId(actionRequestId);
    try {
      const updatedAction = await rejectActionRequest(
        actionRequestId,
        "demo-admin",
        "Rejected in Veridian AI workspace"
      );
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.data?.action?.action_request_id === actionRequestId) {
            return {
              ...msg,
              data: {
                ...msg.data,
                action: {
                  ...msg.data.action,
                  status: updatedAction.status,
                  message: updatedAction.message,
                },
              },
            };
          }
          return msg;
        })
      );
      if (activeAnalysis?.action?.action_request_id === actionRequestId) {
        setActiveAnalysis((prev) =>
          prev
            ? {
                ...prev,
                action: {
                  ...prev.action!,
                  status: updatedAction.status,
                  message: updatedAction.message,
                },
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setActiveAnalysis(null);
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-[calc(100vh-8.5rem)] min-h-[600px]">
      {/* =========================================================================
          COLUMN 1 (LEFT): Conversation / Scenarios (lg:col-span-3)
         ========================================================================= */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-[#E0E1DD]">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#415A77]" />
            <h3 className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider">
              AI Support Hub
            </h3>
          </div>
          <button
            onClick={handleResetChat}
            className="p-1 rounded text-[#778DA9] hover:text-[#0D1B2A] hover:bg-[#E0E1DD]/40 transition-colors"
            title="Start New Request"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Demo Scenarios Section */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2">
          <div className="text-[11px] font-semibold text-[#778DA9] uppercase tracking-wider mb-1 px-1">
            Demo Scenarios
          </div>
          {demoScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSend(sc.query)}
              disabled={loading}
              className="w-full text-left p-2.5 rounded-lg border border-[#E0E1DD] hover:border-[#415A77] hover:bg-[#E0E1DD]/30 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-[#0D1B2A] group-hover:text-[#415A77] transition-colors">
                  {sc.title}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E0E1DD] text-[#415A77] font-semibold">
                  {sc.tag}
                </span>
              </div>
              <p className="text-[11px] text-[#778DA9] line-clamp-2 leading-relaxed">
                &ldquo;{sc.query}&rdquo;
              </p>
            </button>
          ))}
        </div>

        {/* Tool Whitelist Count Card */}
        <div className="pt-3 border-t border-[#E0E1DD] mt-2">
          <div className="p-2.5 rounded-lg bg-[#1B263B] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[#F59E0B]" />
              <span className="text-[11px] font-medium">Tools Registered</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#E0E1DD]">
              {registeredTools.length || 5} active
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COLUMN 2 (CENTER): AI Conversation Area (lg:col-span-6)
         ========================================================================= */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#E0E1DD] shadow-xs flex flex-col h-full overflow-hidden">
        {/* Closed Tool Registry Banner */}
        <div className="px-4 py-2 bg-[#0D1B2A] text-[#E0E1DD] flex items-center justify-between text-[11px] border-b border-[#1B263B]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            <span className="font-semibold text-white">Closed Tool Registry</span>
            <span className="text-[#778DA9] hidden sm:inline">• Deterministic Authorization</span>
          </div>
          <span className="font-mono text-[10px] text-[#778DA9]">
            Phases 1–5 Protected
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#778DA9]">
              <div className="h-12 w-12 rounded-2xl bg-[#E0E1DD]/50 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-[#415A77]" />
              </div>
              <h4 className="text-sm font-semibold text-[#0D1B2A] mb-1">
                Veridian AI Support Agent Ready
              </h4>
              <p className="text-xs max-w-sm leading-relaxed mb-4">
                Ask an IT support question, or select a demo scenario from the left panel to test intent classification, policy enforcement, and controlled tool execution.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                <button
                  onClick={() => handleSend("My VPN certificate has expired.")}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E0E1DD]/60 hover:bg-[#415A77] hover:text-white transition-colors"
                >
                  VPN Renewal Test
                </button>
                <button
                  onClick={() => handleSend("I need to reset my password.")}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E0E1DD]/60 hover:bg-[#415A77] hover:text-white transition-colors"
                >
                  Password Reset Approval
                </button>
                <button
                  onClick={() => handleSend("My laptop is more than 3 years old.")}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E0E1DD]/60 hover:bg-[#415A77] hover:text-white transition-colors"
                >
                  Hardware Policy POL-01
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "agent" && (
                  <div className="h-7 w-7 rounded-lg bg-[#1B263B] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-[#E0E1DD]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2.5 text-xs ${
                    msg.sender === "user"
                      ? "bg-[#415A77] text-white shadow-xs ml-8"
                      : "bg-[#E0E1DD]/30 border border-[#E0E1DD] text-[#0D1B2A] shadow-xs mr-8"
                  }`}
                >
                  {/* User message */}
                  {msg.sender === "user" && (
                    <div className="leading-relaxed">{msg.text}</div>
                  )}

                  {/* Agent message */}
                  {msg.sender === "agent" && msg.text && !msg.data && (
                    <div className="leading-relaxed">{msg.text}</div>
                  )}

                  {/* Agent Structured Response Card */}
                  {msg.sender === "agent" && msg.data && (
                    <div className="space-y-3">
                      {/* Top Header: Decision Badge & Source */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E0E1DD]">
                        <div className="flex items-center gap-1.5">
                          {msg.data.decision === "RESOLVE" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              <CheckCircle2 className="h-3 w-3" />
                              RESOLVE
                            </span>
                          )}
                          {msg.data.decision === "CLARIFY" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                              <AlertTriangle className="h-3 w-3" />
                              CLARIFY
                            </span>
                          )}
                          {msg.data.decision === "ESCALATE" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                              <XCircle className="h-3 w-3" />
                              ESCALATE
                            </span>
                          )}

                          <span className="text-[10px] font-mono text-[#778DA9]">
                            {msg.data.intent} ({Math.round(msg.data.confidence * 100)}%)
                          </span>
                        </div>

                        {/* LLM or Deterministic Source Pill */}
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                            msg.data.response_source === "llm"
                              ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30 font-semibold"
                              : "bg-[#778DA9]/20 text-[#415A77] border-[#778DA9]/40"
                          }`}
                        >
                          Source: {msg.data.response_source === "llm" ? "LLM Grounded" : "Deterministic"}
                        </span>
                      </div>

                      {/* Main Response Text */}
                      <div className="text-xs leading-relaxed text-[#0D1B2A] whitespace-pre-line">
                        {msg.data.response}
                      </div>

                      {/* Clarification prompt if applicable */}
                      {msg.data.clarification_required && msg.data.clarification_question && (
                        <div className="p-2 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#0D1B2A] text-xs">
                          <span className="font-semibold block mb-0.5">Clarification Required:</span>
                          {msg.data.clarification_question}
                        </div>
                      )}

                      {/* Escalation reason if applicable */}
                      {msg.data.escalation_reason && (
                        <div className="p-2 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs">
                          <span className="font-semibold block mb-0.5">Escalation Reason:</span>
                          {msg.data.escalation_reason}
                        </div>
                      )}

                      {/* Verified Evidence Badges */}
                      {msg.data.sources && msg.data.sources.length > 0 && (
                        <div className="pt-2 border-t border-[#E0E1DD] space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#778DA9] block">
                            Verified Evidence
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.data.sources.map((src) => {
                              const isTicket = src.source_type === "ticket";
                              const isPolicy = src.source_type === "policy";
                              return (
                                <span
                                  key={src.source_id}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                                    isTicket
                                      ? "bg-[#778DA9]/20 text-[#415A77] border-[#778DA9]/40"
                                      : isPolicy
                                      ? "bg-[#1B263B] text-[#E0E1DD] border-[#1B263B]"
                                      : "bg-[#415A77] text-white border-[#415A77]"
                                  }`}
                                >
                                  <FileText className="h-2.5 w-2.5" />
                                  <span className="font-bold">{src.source_id}</span>
                                  {isTicket ? " (Historical)" : isPolicy ? " (Policy)" : " (KB)"}
                                </span>
                              );
                            })}
                          </div>

                          {/* Historical Context Disclaimer if tickets were used */}
                          {msg.data.sources.some((s) => s.source_type === "ticket") && (
                            <div className="flex items-start gap-1.5 p-2 rounded bg-[#778DA9]/10 border border-[#778DA9]/20 text-[10px] text-[#415A77]">
                              <Info className="h-3 w-3 shrink-0 mt-0.5 text-[#415A77]" />
                              <span>
                                <strong>Historical Context Notice:</strong> Historical tickets are referenced for precedent only and do not override current Veridian corporate policy.
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Controlled Action Execution Block */}
                      {msg.data.action && (
                        <div className="pt-2 border-t border-[#E0E1DD]">
                          {/* COMPLETED */}
                          {msg.data.action.status === "COMPLETED" && (
                            <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  ACTION EXECUTED
                                </span>
                                {msg.data.action.action_request_id && (
                                  <span className="text-[9px] font-mono text-[#0D1B2A] font-bold bg-[#10B981]/20 px-1.5 py-0.5 rounded">
                                    {msg.data.action.action_request_id}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono font-bold text-[#0D1B2A]">
                                {msg.data.action.action_name}
                              </div>
                              <div className="text-[11px] text-[#415A77]">
                                Risk: <span className="font-semibold text-[#0D1B2A]">READ_ONLY</span> • Auth: <span className="font-semibold text-[#10B981]">ALLOWED</span>
                              </div>
                              {msg.data.action.message && (
                                <p className="text-[11px] text-[#0D1B2A]">
                                  {msg.data.action.message}
                                </p>
                              )}
                              {msg.data.action.data && (
                                <div className="text-[10px] font-mono bg-white/70 p-2 rounded border border-[#10B981]/20 overflow-x-auto text-[#0D1B2A]">
                                  {JSON.stringify(msg.data.action.data, null, 2)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* PENDING APPROVAL */}
                          {msg.data.action.status === "PENDING_APPROVAL" && (
                            <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  APPROVAL REQUIRED
                                </span>
                                {msg.data.action.action_request_id && (
                                  <span className="text-[9px] font-mono text-[#0D1B2A] font-bold bg-[#F59E0B]/20 px-1.5 py-0.5 rounded">
                                    {msg.data.action.action_request_id}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono font-bold text-[#0D1B2A]">
                                {msg.data.action.action_name}
                              </div>
                              <div className="text-[11px] text-[#415A77]">
                                Risk: <span className="font-semibold text-[#0D1B2A]">REQUEST_CREATION</span> • Auth: <span className="font-semibold text-[#F59E0B]">PENDING</span>
                              </div>
                              <p className="text-[11px] text-[#0D1B2A]">
                                {msg.data.action.message || "This sensitive request requires administrator authorization."}
                              </p>
                              <div className="text-[10px] text-[#415A77] bg-white/60 p-1.5 rounded border border-[#F59E0B]/20 font-medium">
                                Security Rule: No passwords are generated, accepted, or stored.
                              </div>

                              {/* Demo Approval Controls */}
                              {msg.data.action.action_request_id && (
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    onClick={() => handleApprove(msg.data!.action!.action_request_id!)}
                                    disabled={actionLoadingId === msg.data.action.action_request_id}
                                    className="px-3 py-1 rounded bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {actionLoadingId === msg.data.action.action_request_id ? "..." : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleReject(msg.data!.action!.action_request_id!)}
                                    disabled={actionLoadingId === msg.data.action.action_request_id}
                                    className="px-3 py-1 rounded bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                  <span className="text-[10px] text-[#778DA9] italic">
                                    DEMO APPROVAL CONTROLS
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* REJECTED / DENIED */}
                          {(msg.data.action.status === "REJECTED" || msg.data.action.status === "DENIED") && (
                            <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1">
                                  <XCircle className="h-3.5 w-3.5" />
                                  ACTION DENIED
                                </span>
                                {msg.data.action.action_request_id && (
                                  <span className="text-[9px] font-mono text-[#0D1B2A] font-bold bg-[#EF4444]/20 px-1.5 py-0.5 rounded">
                                    {msg.data.action.action_request_id}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono font-bold text-[#0D1B2A]">
                                {msg.data.action.action_name}
                              </div>
                              <p className="text-[11px] text-[#EF4444]">
                                Reason: {msg.data.action.message || "Policy or administrator authorization rejected."}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-[#778DA9] text-right pt-1">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-[#415A77] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-[#778DA9]">
              <div className="h-7 w-7 rounded-lg bg-[#1B263B] flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-[#E0E1DD] animate-pulse" />
              </div>
              <div className="bg-[#E0E1DD]/30 border border-[#E0E1DD] rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#415A77] animate-ping"></span>
                <span>Veridian Agent analyzing query, policies & tools...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#E0E1DD] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask the Veridian AI Agent (e.g. 'My VPN expired' or 'I need to reset my password')..."
              disabled={loading}
              className="flex-1 bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg px-3.5 py-2.5 outline-hidden transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#415A77] hover:bg-[#1B263B] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          COLUMN 3 (RIGHT): Context Panel / Request Analysis (lg:col-span-3)
         ========================================================================= */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs flex flex-col h-full overflow-y-auto space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E0E1DD]">
          <ShieldAlert className="h-4 w-4 text-[#415A77]" />
          <h3 className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider">
            Request Analysis
          </h3>
        </div>

        {activeAnalysis ? (
          <div className="space-y-4 text-xs">
            {/* Intent & Confidence */}
            <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-1">
              <span className="text-[10px] font-semibold text-[#778DA9] uppercase tracking-wider block">
                Detected Intent
              </span>
              <div className="font-mono font-bold text-[#0D1B2A] text-sm">
                {activeAnalysis.intent}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#415A77] pt-1">
                <span>Confidence</span>
                <span className="font-mono font-bold">
                  {Math.round(activeAnalysis.confidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-[#E0E1DD] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#415A77] h-full rounded-full transition-all"
                  style={{ width: `${Math.round(activeAnalysis.confidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Decision */}
            <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-1">
              <span className="text-[10px] font-semibold text-[#778DA9] uppercase tracking-wider block">
                Workflow Decision
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeAnalysis.decision === "RESOLVE"
                      ? "bg-[#10B981]/15 text-[#10B981]"
                      : activeAnalysis.decision === "CLARIFY"
                      ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                      : "bg-[#EF4444]/15 text-[#EF4444]"
                  }`}
                >
                  {activeAnalysis.decision}
                </span>
              </div>
            </div>

            {/* Policy & Historical Context */}
            <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-2">
              <span className="text-[10px] font-semibold text-[#778DA9] uppercase tracking-wider block">
                Evidence Evaluation
              </span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#415A77]">Policy Relevant</span>
                <span className="font-semibold text-[#0D1B2A]">
                  {activeAnalysis.sources?.some((s) => s.source_type === "policy")
                    ? "Yes (POL-01)"
                    : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#415A77]">Historical Context</span>
                <span className="font-semibold text-[#0D1B2A]">
                  {activeAnalysis.sources?.some((s) => s.source_type === "ticket")
                    ? "Yes (Precedent)"
                    : "No"}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-[#778DA9] block mb-1">
                  Evidence Keys:
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeAnalysis.sources?.map((s) => (
                    <span
                      key={s.source_id}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E0E1DD] font-medium text-[#0D1B2A]"
                    >
                      {s.source_id}
                    </span>
                  )) || <span className="text-[10px] text-[#778DA9]">None</span>}
                </div>
              </div>
            </div>

            {/* Action & Authorization Boundary */}
            <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-2">
              <span className="text-[10px] font-semibold text-[#778DA9] uppercase tracking-wider block">
                Action Authorization
              </span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#415A77]">Action</span>
                <span className="font-mono font-bold text-[#0D1B2A]">
                  {activeAnalysis.action?.action_name || "None Required"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#415A77]">Status</span>
                <span className="font-bold text-[#0D1B2A]">
                  {activeAnalysis.action?.status || "N/A"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#778DA9]">
            <Info className="h-6 w-6 text-[#778DA9] mb-2" />
            <p className="text-xs leading-relaxed">
              No query executed yet. Submit a prompt to inspect intent classification, confidence scores, evidence mapping, and action authorization.
            </p>
          </div>
        )}

        {/* Security Compliance Footer */}
        <div className="pt-3 border-t border-[#E0E1DD] text-[10px] text-[#778DA9] leading-relaxed">
          <strong className="text-[#415A77]">Safety Boundary:</strong> Only structured metadata is presented. Internal chain-of-thought and private system tokens are protected.
        </div>
      </div>
    </div>
  );
}
