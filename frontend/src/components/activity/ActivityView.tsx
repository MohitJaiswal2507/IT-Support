"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Zap,
  Bot,
  User,
} from "lucide-react";
import { fetchActionRequests, ActionRecordItem } from "@/lib/api";

export function ActivityView() {
  const [actions, setActions] = useState<ActionRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const res = await fetchActionRequests();
      setActions(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1B263B] text-white mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            Enterprise Audit Trail
          </div>
          <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
            <History className="h-5 w-5 text-[#415A77]" />
            Activity &amp; Audit Log
          </h2>
          <p className="text-xs text-[#778DA9]">
            Chronological audit timeline tracing all user interactions, policy evaluations, and tool executions.
          </p>
        </div>

        <button
          onClick={loadActivity}
          disabled={loading}
          className="p-2 rounded-lg border border-[#E0E1DD] text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
          title="Refresh audit log"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Timeline Card */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#778DA9]">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#415A77]" />
            Loading audit events...
          </div>
        ) : actions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#778DA9] space-y-1">
            <History className="h-6 w-6 mx-auto text-[#778DA9] mb-1.5" />
            <p className="font-semibold text-[#0D1B2A]">No audit events logged yet</p>
            <p className="text-[11px]">Submit queries in the AI Support Agent to generate live audit records.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[#E0E1DD] ml-4 space-y-6">
            {actions.map((act) => {
              const isCompleted = act.status === "COMPLETED";
              const isPending = act.status === "PENDING_APPROVAL";
              const isRejected = act.status === "REJECTED" || act.status === "DENIED";

              return (
                <div key={act.action_id} className="relative pl-6">
                  {/* Timeline node icon */}
                  <div
                    className={`absolute -left-[13px] top-0.5 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs ${
                      isCompleted
                        ? "bg-[#10B981]"
                        : isPending
                        ? "bg-[#F59E0B]"
                        : "bg-[#EF4444]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isPending ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-[#E0E1DD] bg-[#E0E1DD]/15 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#415A77]">
                          {act.action_id}
                        </span>
                        <span className="font-bold text-[#0D1B2A]">
                          {act.action_name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#778DA9]">
                        {act.requested_at
                          ? new Date(act.requested_at).toLocaleString()
                          : "Timestamp N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#415A77]">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-[#778DA9]" />
                        Requester: <strong>{act.requester}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Status:{" "}
                        <strong
                          className={
                            isCompleted
                              ? "text-[#10B981]"
                              : isPending
                              ? "text-[#F59E0B]"
                              : "text-[#EF4444]"
                          }
                        >
                          {act.status}
                        </strong>
                      </span>
                    </div>

                    {act.result && Object.keys(act.result).length > 0 && (
                      <div className="p-2.5 rounded bg-white border border-[#E0E1DD] font-mono text-[10px] text-[#0D1B2A] overflow-x-auto">
                        {JSON.stringify(act.result, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
