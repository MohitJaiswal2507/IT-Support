"use client";

import React from "react";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Database,
  Sparkles,
  Server,
  Layers,
  Lock,
} from "lucide-react";

export function SettingsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs">
        <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#415A77]" />
          System Settings &amp; Architecture Status
        </h2>
        <p className="text-xs text-[#778DA9]">
          Platform configuration, AI engine status, and operational parameters for Veridian IT Support Agent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Preferences */}
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0E1DD]">
            <Layers className="h-4 w-4 text-[#415A77]" />
            <h3 className="text-sm font-bold text-[#0D1B2A]">
              Application &amp; Design System
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Design Palette</span>
              <span className="font-mono font-bold text-[#415A77]">
                Veridian Enterprise (5-Color)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Typography</span>
              <span className="font-mono text-[#415A77]">
                Inter + JetBrains Mono
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Current Phase</span>
              <span className="font-bold text-[#10B981]">
                Phase 6 — Enterprise UI/UX Redesign
              </span>
            </div>
          </div>
        </div>

        {/* AI Engine Status */}
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0E1DD]">
            <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
            <h3 className="text-sm font-bold text-[#0D1B2A]">
              AI Support Agent Engine
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">LLM Provider</span>
              <span className="font-mono text-[#0D1B2A]">
                OpenAI (gpt-4o-mini)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Grounding Validator</span>
              <span className="font-bold text-[#10B981]">
                Active (Evidence-Grounded)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Fallback Mode</span>
              <span className="font-mono text-[#415A77]">
                Deterministic Rule-Based Fallback
              </span>
            </div>
          </div>
        </div>

        {/* Retrieval & Data Layer */}
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0E1DD]">
            <Database className="h-4 w-4 text-[#415A77]" />
            <h3 className="text-sm font-bold text-[#0D1B2A]">
              Data &amp; Retrieval Foundation
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Relational Database</span>
              <span className="font-mono text-[#0D1B2A]">
                SQLite / SQLAlchemy
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Vector Index</span>
              <span className="font-mono text-[#0D1B2A]">
                FAISS (all-MiniLM-L6-v2)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Evidence Scope</span>
              <span className="text-[#778DA9]">
                KB + Policies + Historical Tickets
              </span>
            </div>
          </div>
        </div>

        {/* Action & Tool Authorization */}
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0E1DD]">
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
            <h3 className="text-sm font-bold text-[#0D1B2A]">
              Safety &amp; Authorization Layer
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Tool Whitelist Boundary</span>
              <span className="font-bold text-[#10B981]">
                Enforced (5 Closed Tools)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Arbitrary Code / SQL</span>
              <span className="font-bold text-[#EF4444]">
                Strictly Blocked
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E0E1DD]/30 border border-[#E0E1DD]">
              <span className="text-[#0D1B2A] font-medium">Password Security</span>
              <span className="text-[#0D1B2A]">
                Zero password generation or storage
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
