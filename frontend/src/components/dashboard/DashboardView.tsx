"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Ticket,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { NavView } from "../layout/Sidebar";
import {
  fetchDatasetCounts,
  fetchTickets,
  fetchActionRequests,
  ActionRecordItem,
  TicketItem,
  approveActionRequest,
  rejectActionRequest,
} from "@/lib/api";

interface DashboardViewProps {
  onNavigate: (view: NavView, query?: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [queryInput, setQueryInput] = useState("");
  const [counts, setCounts] = useState({
    openTickets: 0,
    requests: 0,
    resolvedTickets: 0,
    pendingApprovals: 0,
  });
  const [pendingActions, setPendingActions] = useState<ActionRecordItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const quickActionChips = [
    { label: "Check VPN", query: "Check VPN status" },
    { label: "Password Reset", query: "I need to reset my password" },
    { label: "Laptop Replacement", query: "My laptop is more than 3 years old" },
    { label: "Check Ticket", query: "Check ticket status TK-1042" },
    { label: "Account Status", query: "Check account status" },
  ];

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [datasetRes, ticketsRes, actionsRes] = await Promise.all([
        fetchDatasetCounts().catch(() => null),
        fetchTickets().catch(() => ({ items: [], total: 0 })),
        fetchActionRequests().catch(() => ({ items: [], total: 0 })),
      ]);

      const openCount = ticketsRes.items.filter((t) => t.is_active).length;
      const closedCount = ticketsRes.items.filter((t) => !t.is_active).length;
      const pendingList = actionsRes.items.filter(
        (a) => a.status === "PENDING_APPROVAL"
      );

      setCounts({
        openTickets: openCount,
        requests: datasetRes?.requests ?? 0,
        resolvedTickets: closedCount,
        pendingApprovals: pendingList.length,
      });

      setPendingActions(pendingList.slice(0, 4));
      setRecentTickets(ticketsRes.items.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryInput.trim()) {
      onNavigate("agent", queryInput.trim());
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await approveActionRequest(id, "demo-admin", "Approved from Dashboard");
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await rejectActionRequest(id, "demo-admin", "Rejected from Dashboard");
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Morning Briefing Banner */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1B263B] text-[#E0E1DD] mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#778DA9]" />
            Veridian Internal Service Agent
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D1B2A] tracking-tight">
            Good morning, IT Support
          </h2>
          <p className="text-xs sm:text-sm text-[#415A77] max-w-2xl">
            AI-assisted IT support with grounded knowledge, authoritative policy enforcement, and controlled action workflows.
          </p>
        </div>

        <button
          onClick={() => onNavigate("agent")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#415A77] hover:bg-[#1B263B] text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
          Ask AI Support
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tickets */}
        <div
          onClick={() => onNavigate("tickets")}
          className="bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs hover:border-[#778DA9] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#415A77] mb-2">
            <span className="text-xs font-medium">Open Tickets</span>
            <Ticket className="h-4 w-4 text-[#415A77]" />
          </div>
          <div className="text-2xl font-bold text-[#0D1B2A] font-mono">
            {loading ? "..." : counts.openTickets}
          </div>
          <span className="text-[11px] text-[#778DA9] mt-1 block">
            Active in queue
          </span>
        </div>

        {/* Requests */}
        <div
          onClick={() => onNavigate("requests")}
          className="bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs hover:border-[#778DA9] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#415A77] mb-2">
            <span className="text-xs font-medium">Requests</span>
            <ClipboardList className="h-4 w-4 text-[#415A77]" />
          </div>
          <div className="text-2xl font-bold text-[#0D1B2A] font-mono">
            {loading ? "..." : counts.requests}
          </div>
          <span className="text-[11px] text-[#778DA9] mt-1 block">
            Total employee requests
          </span>
        </div>

        {/* Resolved Today */}
        <div
          onClick={() => onNavigate("tickets")}
          className="bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs hover:border-[#778DA9] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#415A77] mb-2">
            <span className="text-xs font-medium">Resolved Today</span>
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-bold text-[#0D1B2A] font-mono">
            {loading ? "..." : counts.resolvedTickets}
          </div>
          <span className="text-[11px] text-[#10B981] mt-1 block">
            Closed tickets
          </span>
        </div>

        {/* Approval Queue */}
        <div
          onClick={() => onNavigate("actions")}
          className="bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs hover:border-[#F59E0B] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#415A77] mb-2">
            <span className="text-xs font-medium">Approval Queue</span>
            <Clock className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#0D1B2A] font-mono">
            {loading ? "..." : counts.pendingApprovals}
          </div>
          <span className="text-[11px] text-[#F59E0B] font-medium mt-1 block">
            Requires authorization
          </span>
        </div>
      </div>

      {/* AI Support Quick Start Card */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#0D1B2A]">
          <div className="p-1.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">AI Support Quick Start</h3>
        </div>
        <p className="text-xs text-[#415A77]">
          Ask the Veridian AI Agent about passwords, VPN, software, Wi-Fi, hardware, tickets, and more.
        </p>

        <form onSubmit={handleQuickSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="e.g. My VPN certificate has expired, what do I do?"
            className="flex-1 bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg px-3.5 py-2.5 outline-hidden transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#415A77] hover:bg-[#1B263B] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Ask Agent
          </button>
        </form>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-[#778DA9] font-medium">
            Quick Prompts:
          </span>
          {quickActionChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => onNavigate("agent", chip.query)}
              className="px-2.5 py-1 rounded-md bg-[#E0E1DD]/40 hover:bg-[#415A77] hover:text-white border border-[#E0E1DD] text-[11px] font-medium text-[#0D1B2A] transition-colors cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Section: Pending Approvals Queue & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F59E0B]" />
              <h3 className="text-sm font-semibold text-[#0D1B2A]">
                Pending Action Approvals
              </h3>
            </div>
            <button
              onClick={() => onNavigate("actions")}
              className="text-xs text-[#415A77] hover:text-[#0D1B2A] font-medium flex items-center gap-1"
            >
              View all ({counts.pendingApprovals})
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-8 text-xs text-[#778DA9]">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading approval queue...
            </div>
          ) : pendingActions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-[#E0E1DD]/20 rounded-lg border border-dashed border-[#E0E1DD]">
              <CheckCircle2 className="h-6 w-6 text-[#10B981] mb-1.5" />
              <span className="text-xs font-semibold text-[#0D1B2A]">
                Approval Queue Clear
              </span>
              <span className="text-[11px] text-[#778DA9] mt-0.5">
                No IT actions currently awaiting authorization.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.action_id}
                  className="p-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#0D1B2A]">
                        {action.action_id}
                      </span>
                      <span className="text-xs font-semibold text-[#0D1B2A] truncate">
                        {action.action_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#415A77]">
                      Requester:{" "}
                      <span className="font-medium text-[#0D1B2A]">
                        {action.requester}
                      </span>{" "}
                      •{" "}
                      <span className="text-[#778DA9]">
                        {action.requested_at
                          ? new Date(action.requested_at).toLocaleTimeString()
                          : "Pending"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(action.action_id)}
                      disabled={actionLoadingId === action.action_id}
                      className="px-2.5 py-1 rounded bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === action.action_id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(action.action_id)}
                      disabled={actionLoadingId === action.action_id}
                      className="px-2.5 py-1 rounded bg-[#EF4444] hover:bg-[#DC2626] text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tickets Activity */}
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-[#415A77]" />
              <h3 className="text-sm font-semibold text-[#0D1B2A]">
                Recent Tickets
              </h3>
            </div>
            <button
              onClick={() => onNavigate("tickets")}
              className="text-xs text-[#415A77] hover:text-[#0D1B2A] font-medium flex items-center gap-1"
            >
              View all ({counts.openTickets + counts.resolvedTickets})
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-8 text-xs text-[#778DA9]">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading tickets...
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-xs text-[#778DA9]">
              No tickets recorded.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onNavigate("tickets")}
                  className="p-2.5 rounded-lg border border-[#E0E1DD] hover:bg-[#E0E1DD]/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-[#415A77]">
                        {ticket.id}
                      </span>
                      <span className="text-xs font-medium text-[#0D1B2A] truncate">
                        {ticket.issue_summary}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#778DA9] block truncate">
                      {ticket.employee}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      ticket.is_active
                        ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                        : "bg-[#778DA9]/20 text-[#415A77]"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
