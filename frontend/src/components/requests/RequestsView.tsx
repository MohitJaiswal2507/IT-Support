"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  ExternalLink,
  X,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { fetchRequests, EmployeeRequestItem } from "@/lib/api";

export function RequestsView() {
  const [requests, setRequests] = useState<EmployeeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState<EmployeeRequestItem | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetchRequests();
      setRequests(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.employee.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.request.toLowerCase().includes(q) ||
      r.initial_action_taken.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#415A77]" />
            Employee Requests
          </h2>
          <p className="text-xs text-[#778DA9]">
            Active and triaged employee service desk requests.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-[#778DA9] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee requests..."
              className="w-full bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg pl-8 pr-3 py-1.5 outline-hidden transition-all"
            />
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="p-2 rounded-lg border border-[#E0E1DD] text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
            title="Refresh requests"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1B2A] text-[#E0E1DD] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Date Opened</th>
                <th className="py-3 px-4">Request Summary</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E1DD]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#778DA9]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#415A77]" />
                    Loading employee requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#778DA9]">
                    No employee requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className="hover:bg-[#E0E1DD]/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#415A77]">
                      {req.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0D1B2A]">
                      {req.employee}
                    </td>
                    <td className="py-3 px-4 text-[#778DA9] font-mono text-[11px]">
                      {req.email}
                    </td>
                    <td className="py-3 px-4 text-[#778DA9]">
                      {req.date_opened}
                    </td>
                    <td className="py-3 px-4 text-[#0D1B2A] max-w-xs truncate">
                      {req.request}
                    </td>
                    <td className="py-3 px-4 text-right text-[#415A77] font-semibold">
                      <span className="hover:underline flex items-center justify-end gap-1">
                        View
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedReq(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E1DD]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#415A77]">
                  {selectedReq.id}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#415A77]/15 text-[#415A77]">
                  Internal Request
                </span>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-md text-[#778DA9] hover:bg-[#E0E1DD]/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                    Employee
                  </label>
                  <p className="font-semibold text-[#0D1B2A] flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#415A77]" />
                    {selectedReq.employee}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                    Date Opened
                  </label>
                  <p className="font-semibold text-[#0D1B2A] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#415A77]" />
                    {selectedReq.date_opened}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Corporate Email
                </label>
                <p className="font-mono text-[#0D1B2A] p-2 rounded bg-[#E0E1DD]/30 border border-[#E0E1DD] flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#778DA9]" />
                  {selectedReq.email}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Original Request Text
                </label>
                <p className="text-[#0D1B2A] leading-relaxed p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
                  {selectedReq.request}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Initial Triage Action Taken
                </label>
                <p className="text-[#415A77] font-medium leading-relaxed p-3 rounded-lg bg-[#1B263B]/5 border border-[#1B263B]/20">
                  {selectedReq.initial_action_taken}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E1DD] mt-auto">
              <button
                onClick={() => setSelectedReq(null)}
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
