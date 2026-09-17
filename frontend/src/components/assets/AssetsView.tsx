"use client";

import React, { useState } from "react";
import {
  Laptop,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  User,
} from "lucide-react";
import { executeDirectAction, AgentActionItem } from "@/lib/api";

interface AssetRecord {
  id: string;
  device: string;
  assignedTo: string;
  ageYears: number;
  serialNumber: string;
  hasHardwareFailure: boolean;
}

const DEMO_ASSETS: AssetRecord[] = [
  {
    id: "AST-104",
    device: "Dell Latitude 7420",
    assignedTo: "Sarah Jenkins (Finance)",
    ageYears: 3.5,
    serialNumber: "DL-7420-9941",
    hasHardwareFailure: false,
  },
  {
    id: "AST-209",
    device: "MacBook Pro 14 (M1 Pro)",
    assignedTo: "Alex Chen (Engineering)",
    ageYears: 3.2,
    serialNumber: "AP-MBP-8120",
    hasHardwareFailure: false,
  },
  {
    id: "AST-318",
    device: "ThinkPad T14 Gen 2",
    assignedTo: "David Kim (Operations)",
    ageYears: 1.8,
    serialNumber: "LN-TP14-3321",
    hasHardwareFailure: false,
  },
  {
    id: "AST-420",
    device: "Dell Precision 5560",
    assignedTo: "Elena Rostova (Data)",
    ageYears: 2.1,
    serialNumber: "DL-PR55-7712",
    hasHardwareFailure: true,
  },
  {
    id: "AST-512",
    device: "MacBook Air M2",
    assignedTo: "Marcus Vance (Product)",
    ageYears: 1.0,
    serialNumber: "AP-MBA-1190",
    hasHardwareFailure: false,
  },
];

export function AssetsView() {
  const [assets] = useState<AssetRecord[]>(DEMO_ASSETS);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<AgentActionItem | null>(null);

  const handleRequestReplacement = async (asset: AssetRecord) => {
    setActionLoadingId(asset.id);
    setActionResult(null);
    try {
      const res = await executeDirectAction(
        "REQUEST_LAPTOP_REPLACEMENT",
        {
          device_age_years: asset.ageYears,
          hardware_failure: asset.hasHardwareFailure,
          serial_number: asset.serialNumber,
          model: asset.device,
        },
        asset.assignedTo
      );
      setActionResult(res);
    } catch (err: unknown) {
      setActionResult({
        action_name: "REQUEST_LAPTOP_REPLACEMENT",
        status: "DENIED",
        message: err instanceof Error ? err.message : "Execution failed",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1B263B] text-white mb-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            POL-01 Lifecycle Compliant
          </div>
          <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
            <Laptop className="h-5 w-5 text-[#415A77]" />
            Hardware Asset Management
          </h2>
          <p className="text-xs text-[#778DA9]">
            Corporate laptop inventory evaluated strictly against the Asset Management Policy 3-year refresh rule.
          </p>
        </div>
      </div>

      {/* Outcome Banner if an action was triggered */}
      {actionResult && (
        <div
          className={`p-4 rounded-xl border shadow-xs text-xs space-y-1.5 ${
            actionResult.status === "PENDING_APPROVAL" || actionResult.status === "COMPLETED"
              ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#0D1B2A]"
              : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#0D1B2A]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              {actionResult.status === "PENDING_APPROVAL" ? (
                <>
                  <Clock className="h-4 w-4 text-[#F59E0B]" />
                  REPLACEMENT REQUEST QUEUED (PENDING APPROVAL)
                </>
              ) : actionResult.status === "COMPLETED" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  REPLACEMENT APPROVED & COMPLETED
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                  REPLACEMENT REJECTED BY POL-01
                </>
              )}
            </span>
            {actionResult.action_request_id && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-[#E0E1DD]">
                {actionResult.action_request_id}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#415A77]">
            {actionResult.message}
          </p>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1B2A] text-[#E0E1DD] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Device Model</th>
                <th className="py-3 px-4">Assigned Employee</th>
                <th className="py-3 px-4">Device Age</th>
                <th className="py-3 px-4">POL-01 Eligibility</th>
                <th className="py-3 px-4 text-right">Controlled Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E1DD]">
              {assets.map((asset) => {
                const isEligibleByAge = asset.ageYears >= 3.0;
                const isEligibleByFailure = asset.hasHardwareFailure;
                const isEligible = isEligibleByAge || isEligibleByFailure;

                return (
                  <tr key={asset.id} className="hover:bg-[#E0E1DD]/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#415A77]">
                      {asset.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0D1B2A]">
                      {asset.device}
                      <span className="block font-mono text-[10px] text-[#778DA9]">
                        {asset.serialNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0D1B2A]">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-[#778DA9]" />
                        {asset.assignedTo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {asset.ageYears.toFixed(1)} yrs
                    </td>
                    <td className="py-3 px-4">
                      {isEligibleByAge ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Eligible (&gt; 3 yrs)
                        </span>
                      ) : isEligibleByFailure ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Eligible (Hardware Failure)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#778DA9]/20 text-[#415A77] border border-[#778DA9]/40">
                          Ineligible (&lt; 3 yrs)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRequestReplacement(asset)}
                        disabled={actionLoadingId === asset.id}
                        className="px-3 py-1.5 rounded-md bg-[#415A77] hover:bg-[#1B263B] text-white text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {actionLoadingId === asset.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3 text-[#F59E0B]" />
                        )}
                        Request Replacement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
