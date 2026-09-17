"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertOctagon,
  FileCheck,
  Building,
  CheckCircle2,
} from "lucide-react";
import { fetchPolicies, PolicyItem } from "@/lib/api";

export function PoliciesView() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetchPolicies();
      setPolicies(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1B263B] text-white mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            Authoritative Governance
          </div>
          <h2 className="text-lg font-bold text-[#0D1B2A]">
            Corporate IT Policies
          </h2>
          <p className="text-xs text-[#778DA9]">
            Active governance rules governing device lifecycle, access controls, and security procedures.
          </p>
        </div>

        <button
          onClick={loadPolicies}
          disabled={loading}
          className="p-2 rounded-lg border border-[#E0E1DD] text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
          title="Refresh policies"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Featured Policy: POL-01 Asset Management Policy */}
      <div className="bg-white rounded-xl border-2 border-[#415A77] p-6 shadow-xs space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#415A77] text-white text-[10px] font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wider font-mono">
          Authoritative • Binding
        </div>

        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#1B263B] text-white flex items-center justify-center shrink-0 shadow-sm border border-[#415A77]/40">
            <ShieldCheck className="h-6 w-6 text-[#10B981]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#415A77] bg-[#E0E1DD]/60 px-2 py-0.5 rounded">
                POL-01
              </span>
              <span className="text-xs text-[#778DA9]">
                Issued by: IT Governance & Operations
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D1B2A]">
              Asset Management Policy & Hardware Lifecycle
            </h3>
            <p className="text-xs text-[#415A77]">
              Enforces lifecycle rules, replacement qualifications, and early hardware escalation criteria.
            </p>
          </div>
        </div>

        {/* Core Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rule 1: 3-Year Lifecycle */}
          <div className="p-4 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
              <Clock className="h-4 w-4 text-[#415A77]" />
              Standard Device Refresh
            </div>
            <div className="text-xl font-bold font-mono text-[#415A77]">
              3 Years
            </div>
            <p className="text-[11px] text-[#778DA9] leading-relaxed">
              Standard corporate laptop lifecycle is exactly 3 years (36 months). Devices exceeding 3 years qualify for standard refresh approval.
            </p>
          </div>

          {/* Rule 2: Early Replacement */}
          <div className="p-4 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
              <AlertOctagon className="h-4 w-4 text-[#F59E0B]" />
              Early Replacement Criteria
            </div>
            <div className="text-sm font-bold text-[#0D1B2A]">
              Hardware Failure Only
            </div>
            <p className="text-[11px] text-[#778DA9] leading-relaxed">
              Devices under 3 years old cannot be replaced without confirmed, verified physical hardware failure diagnosed by an IT technician.
            </p>
          </div>

          {/* Rule 3: Upgrades */}
          <div className="p-4 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
              <Building className="h-4 w-4 text-[#10B981]" />
              Upgrade Escalations
            </div>
            <div className="text-sm font-bold text-[#0D1B2A]">
              Dept Head Approval
            </div>
            <p className="text-[11px] text-[#778DA9] leading-relaxed">
              Non-standard specifications require Department Head sign-off and written technical justification submitted to IT Services.
            </p>
          </div>
        </div>
      </div>

      {/* Full Policy List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#0D1B2A] uppercase tracking-wider">
          Complete Policy Registry
        </h3>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#E0E1DD] p-12 text-center text-[#778DA9]">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#415A77]" />
            Loading corporate policies...
          </div>
        ) : (
          policies.map((pol) => (
            <div
              key={pol.id}
              className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#415A77] bg-[#E0E1DD]/60 px-2 py-0.5 rounded">
                    {pol.id}
                  </span>
                  <h4 className="text-sm font-bold text-[#0D1B2A]">{pol.title}</h4>
                </div>
                {pol.issued_by && (
                  <span className="text-[11px] text-[#778DA9]">
                    {pol.issued_by}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#E0E1DD]/20 border border-[#E0E1DD] text-xs text-[#0D1B2A] leading-relaxed whitespace-pre-line">
                {pol.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
