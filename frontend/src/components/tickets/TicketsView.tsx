"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  Info,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { fetchTickets, TicketItem } from "@/lib/api";

export function TicketsView() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchTickets();
      setTickets(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "open"
        ? t.is_active
        : !t.is_active;

    const matchesSearch =
      search === "" ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.employee.toLowerCase().includes(search.toLowerCase()) ||
      t.issue_summary.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#415A77]" />
            ITSM Tickets
          </h2>
          <p className="text-xs text-[#778DA9]">
            Enterprise support tickets repository with historical context distinction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter Buttons */}
          <div className="flex rounded-lg border border-[#E0E1DD] p-0.5 bg-[#E0E1DD]/30 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === "all"
                  ? "bg-white text-[#0D1B2A] shadow-2xs font-semibold"
                  : "text-[#778DA9] hover:text-[#0D1B2A]"
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === "open"
                  ? "bg-white text-[#0D1B2A] shadow-2xs font-semibold"
                  : "text-[#778DA9] hover:text-[#0D1B2A]"
              }`}
            >
              Open ({tickets.filter((t) => t.is_active).length})
            </button>
            <button
              onClick={() => setFilter("closed")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === "closed"
                  ? "bg-white text-[#0D1B2A] shadow-2xs font-semibold"
                  : "text-[#778DA9] hover:text-[#0D1B2A]"
              }`}
            >
              Closed ({tickets.filter((t) => !t.is_active).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-[#778DA9] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, user, summary..."
              className="w-full bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg pl-8 pr-3 py-1.5 outline-hidden transition-all"
            />
          </div>

          <button
            onClick={loadTickets}
            disabled={loading}
            className="p-2 rounded-lg border border-[#E0E1DD] text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
            title="Refresh tickets"
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
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Issue Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E1DD]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#778DA9]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#415A77]" />
                    Loading ITSM tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#778DA9]">
                    No tickets found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-[#E0E1DD]/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#415A77]">
                      {ticket.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0D1B2A]">
                      {ticket.employee}
                    </td>
                    <td className="py-3 px-4 text-[#0D1B2A] max-w-md truncate">
                      {ticket.issue_summary}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ticket.is_active
                            ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                            : "bg-[#778DA9]/20 text-[#415A77] border border-[#778DA9]/40"
                        }`}
                      >
                        {ticket.is_active ? (
                          <Clock className="h-2.5 w-2.5" />
                        ) : (
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        )}
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#415A77] font-semibold">
                      <span className="hover:underline flex items-center justify-end gap-1">
                        View Details
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

      {/* Ticket Detail Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTicket(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E1DD]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#415A77]">
                  {selectedTicket.id}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedTicket.is_active
                      ? "bg-[#10B981]/15 text-[#10B981]"
                      : "bg-[#778DA9]/20 text-[#415A77]"
                  }`}
                >
                  {selectedTicket.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-md text-[#778DA9] hover:bg-[#E0E1DD]/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Employee / Requester
                </label>
                <p className="text-sm font-semibold text-[#0D1B2A]">
                  {selectedTicket.employee}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#778DA9] block mb-1">
                  Issue Summary
                </label>
                <p className="text-xs text-[#0D1B2A] leading-relaxed p-3 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
                  {selectedTicket.issue_summary}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#778DA9]/10 border border-[#778DA9]/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#415A77]">
                  <Info className="h-4 w-4 text-[#415A77]" />
                  Historical Context Classification
                </div>
                <p className="text-[11px] text-[#415A77] leading-relaxed">
                  In the Veridian IT Support architecture, this ticket is indexed as historical reference precedent. It assists in understanding past resolutions but cannot override active corporate policy documents (e.g. POL-01).
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E1DD] mt-auto">
              <button
                onClick={() => setSelectedTicket(null)}
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
