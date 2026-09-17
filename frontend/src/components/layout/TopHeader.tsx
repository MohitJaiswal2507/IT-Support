"use client";

import React from "react";
import {
  Menu,
  Search,
  Bell,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { NavView } from "./Sidebar";
import { HealthCheckResult } from "@/lib/api";

interface TopHeaderProps {
  activeView: NavView;
  health: HealthCheckResult | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const VIEW_TITLES: Record<NavView, { title: string; breadcrumb: string }> = {
  dashboard: { title: "Dashboard", breadcrumb: "Home / Dashboard" },
  agent: { title: "AI Support Agent", breadcrumb: "Workspace / AI Support Agent" },
  tickets: { title: "Tickets", breadcrumb: "Workspace / Tickets" },
  requests: { title: "Employee Requests", breadcrumb: "Workspace / Requests" },
  knowledge: { title: "Knowledge Base", breadcrumb: "Knowledge / Articles" },
  policies: { title: "Policies", breadcrumb: "Knowledge / Corporate Policies" },
  assets: { title: "Hardware Assets", breadcrumb: "Knowledge / Hardware Assets" },
  actions: { title: "Action Requests", breadcrumb: "Operations / Controlled Actions" },
  activity: { title: "Audit Activity", breadcrumb: "Operations / Activity Log" },
  settings: { title: "System Settings", breadcrumb: "System / Settings" },
};

export function TopHeader({
  activeView,
  health,
  checkingHealth,
  onRefreshHealth,
  onOpenMobileMenu,
  searchQuery,
  setSearchQuery,
}: TopHeaderProps) {
  const current = VIEW_TITLES[activeView] || { title: "Dashboard", breadcrumb: "Home" };

  return (
    <header className="h-16 bg-white border-b border-[#E0E1DD] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile hamburger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#415A77] hover:bg-[#E0E1DD]/40 focus:outline-hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-medium text-[#778DA9] truncate">
            {current.breadcrumb}
          </span>
          <h1 className="text-base sm:text-lg font-semibold text-[#0D1B2A] truncate">
            {current.title}
          </h1>
        </div>
      </div>

      {/* Center / Search bar */}
      <div className="hidden md:flex items-center max-w-sm w-full relative">
        <Search className="h-4 w-4 text-[#778DA9] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tickets, policies, KB, actions..."
          className="w-full bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg pl-9 pr-8 py-2 outline-hidden transition-all"
        />
        <kbd className="hidden sm:inline-block absolute right-2.5 text-[10px] text-[#778DA9] bg-white border border-[#E0E1DD] px-1.5 py-0.5 rounded shadow-2xs font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right: Health pill, notification, profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Backend health status pill */}
        <button
          onClick={onRefreshHealth}
          disabled={checkingHealth}
          title="Click to re-check backend connection status"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E0E1DD]/40 hover:bg-[#E0E1DD]/70 border border-[#E0E1DD] text-[#0D1B2A] transition-colors"
        >
          {checkingHealth ? (
            <RefreshCw className="h-3 w-3 text-[#415A77] animate-spin" />
          ) : health?.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-[#EF4444]" />
          )}
          <span className="hidden sm:inline text-[11px]">
            {checkingHealth ? "Checking..." : health?.ok ? "API Connected" : "Backend Offline"}
          </span>
          {health?.latencyMs !== undefined && health.ok && (
            <span className="text-[10px] font-mono text-[#778DA9] hidden md:inline">
              {health.latencyMs}ms
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F59E0B]"></span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E0E1DD]">
          <div className="h-8 w-8 rounded-full bg-[#1B263B] text-white flex items-center justify-center text-xs font-bold border border-[#415A77]/30 shadow-xs">
            M
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#0D1B2A] leading-tight">
              IT Support Admin
            </span>
            <span className="text-[10px] text-[#778DA9] leading-tight">
              demo-admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
