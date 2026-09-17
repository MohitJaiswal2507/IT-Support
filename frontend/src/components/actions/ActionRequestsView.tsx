"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  X,
  Lock,
  Cpu,
} from "lucide-react";
import {
  fetchActionRequests,
  getRegisteredTools,
  approveActionRequest,
  rejectActionRequest,
  ActionRecordItem,
  ToolMetadataItem,
} from "@/lib/api";

export function ActionRequestsView() {
  const [actions, setActions] = useState<ActionRecordItem[]>([]);
  const [tools, setTools] = useState<ToolMetadataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<ActionRecordItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionsRes, toolsRes] = await Promise.all([
        fetchActionRequests(),
        getRegisteredTools(),
      ]);
      setActions(actionsRes.items);
      setTools(toolsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (actionId: string) => {
    setActionLoadingId(actionId);
    try {
      await approveActionRequest(actionId, "demo-admin", "Approved from Action Console");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (actionId: string) => {
    setActionLoadingId(actionId);
    try {
      await rejectActionRequest(actionId, "demo-admin", "Rejected from Action Console");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredActions = actions.filter((a) => {
    const matchesFilter =
      statusFilter === "ALL"
        ? true
        : a.status.toUpperCase() === statusFilter.toUpperCase();

    const matchesSearch =
      search === "" ||
      a.action_id.toLowerCase().includes(search.toLowerCase()) ||
      a.action_name.toLowerCase().includes(search.toLowerCase()) ||
      a.requester.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1B263B] text-white mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            Phase 5 Controlled Execution
          </div>
          <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#F59E0B]" />
            Action Requests &amp; Tool Registry
          </h2>
          <p className="text-xs text-[#778DA9]">
            Auditable IT tool executions governed by deterministic authorization and human-in-the-loop approvals.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-lg border border-[#E0E1DD] text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
          title="Refresh actions"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Closed Tool Registry Whitelist Banner */}
      <div className="bg-[#0D1B2A] text-white rounded-xl p-5 shadow-xs border border-[#1B263B] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#10B981]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Closed Tool Registry Whitelist
            </h3>
          </div>
          <span className="text-[10px] text-[#778DA9] font-mono">
            Deterministic Authorization Boundary
          </span>
        </div>
        <p className="text-xs text-[#778DA9]">
          Only explicitly registered service tools can be called. The LLM has zero authority to execute arbitrary tools, run arbitrary SQL, or bypass policy checks.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {tools.length > 0 ? (
            tools.map((t) => (
              <div
                key={t.name}
                className="p-3 rounded-lg bg-[#1B263B] border border-[#415A77]/30 space-y-1"
              >
                <div className="text-[11px] font-mono font-bold text-[#E0E1DD] truncate">
                  {t.name}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#778DA9]">{t.risk_level}</span>
                  <span
                    className={`font-semibold ${
                      t.requires_approval ? "text-[#F59E0B]" : "text-[#10B981]"
                    }`}
                  >
                    {t.requires_approval ? "Approval Required" : "Automatic"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-5 text-xs text-[#778DA9]">
              Loading registered tool whitelist...
            </div>
          )}
        </div>
      </div>

      {/* Action Requests Table Controls */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {["ALL", "PENDING_APPROVAL", "COMPLETED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? "bg-[#1B263B] text-white font-semibold shadow-xs"
                  : "bg-[#E0E1DD]/40 text-[#415A77] hover:bg-[#E0E1DD]"
              }`}
            >
              {st === "ALL"
                ? `All (${actions.length})`
                : st === "PENDING_APPROVAL"
                ? `Pending (${actions.filter((a) => a.status === "PENDING_APPROVAL").length})`
                : st === "COMPLETED"
                ? `Executed (${actions.filter((a) => a.status === "COMPLETED").length})`
                : `Rejected (${actions.filter((a) => a.status === "REJECTED").length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-[#778DA9] absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions or requester..."
            className="w-full bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg pl-8 pr-3 py-1.5 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1B2A] text-[#E0E1DD] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Action ID</th>
                <th className="py-3 px-4">Tool Name</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Requested At</th>
                <th className="py-3 px-4 text-right">Approval Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E1DD]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#778DA9]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#415A77]" />
                    Loading action requests...
                  </td>
                </tr>
              ) : filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#778DA9]">
                    No action requests found. Execute actions in the AI Support Agent or Assets page to populate this audit log.
                  </td>
                </tr>
              ) : (
                filteredActions.map((action) => (
                  <tr
                    key={action.action_id}
                    onClick={() => setSelectedAction(action)}
                    className="hover:bg-[#E0E1DD]/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#415A77]">
                      {action.action_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#0D1B2A]">
                      {action.action_name}
                    </td>
                    <td className="py-3 px-4 text-[#0D1B2A] font-medium">
                      {action.requester}
                    </td>
                    <td className="py-3 px-4">
                      {action.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          COMPLETED
                        </span>
                      ) : action.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          <Clock className="h-2.5 w-2.5" />
                          PENDING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                          <XCircle className="h-2.5 w-2.5" />
                          {action.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#778DA9] font-mono text-[11px]">
                      {action.requested_at
                        ? new Date(action.requested_at).toLocaleString()
                        : "N/A"}
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {action.status === "PENDING_APPROVAL" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(action.action_id)}
                            disabled={actionLoadingId === action.action_id}
                            className="px-2.5 py-1 rounded bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(action.action_id)}
                            disabled={actionLoadingId === action.action_id}
                            className="px-2.5 py-1 rounded bg-[#EF4444] hover:bg-[#DC2626] text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#778DA9] hover:underline font-semibold flex items-center justify-end gap-1">
                          Audit Record
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Detail Drawer */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedAction(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E1DD]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#415A77]">
                  {selectedAction.action_id}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1B263B] text-white">
                  {selectedAction.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-1 rounded-md text-[#778DA9] hover:bg-[#E0E1DD]/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Tool Executed
                </label>
                <p className="font-mono text-sm font-bold text-[#0D1B2A]">
                  {selectedAction.action_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                    Requester
                  </label>
                  <p className="font-semibold text-[#0D1B2A]">
                    {selectedAction.requester}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                    Approval Required
                  </label>
                  <p className="font-semibold text-[#0D1B2A]">
                    {selectedAction.approval_required ? "Yes" : "No (Auto)"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Input Parameters
                </label>
                <pre className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedAction.parameters, null, 2)}
                </pre>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Execution Output / Result
                </label>
                <pre className="p-3 rounded-lg bg-[#1B263B]/5 border border-[#1B263B]/20 font-mono text-[11px] text-[#0D1B2A] overflow-x-auto">
                  {JSON.stringify(selectedAction.result, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block">
                  Audit Timestamps
                </label>
                <div className="text-[11px] text-[#415A77] space-y-0.5">
                  <div>Requested: {selectedAction.requested_at || "N/A"}</div>
                  <div>Approved: {selectedAction.approved_at || "N/A"}</div>
                  <div>Completed: {selectedAction.completed_at || "N/A"}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E1DD] mt-auto">
              <button
                onClick={() => setSelectedAction(null)}
                className="w-full py-2 rounded-lg bg-[#415A77] hover:bg-[#1B263B] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
