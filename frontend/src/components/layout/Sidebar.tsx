"use client";

import React from "react";
import {
  LayoutDashboard,
  Sparkles,
  Ticket,
  ClipboardList,
  BookOpen,
  ShieldCheck,
  Laptop,
  Zap,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";

export type NavView =
  | "dashboard"
  | "agent"
  | "tickets"
  | "requests"
  | "knowledge"
  | "policies"
  | "assets"
  | "actions"
  | "activity"
  | "settings";

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  pendingApprovalsCount?: number;
}

export function Sidebar({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  pendingApprovalsCount = 0,
}: SidebarProps) {
  const navSections: NavSection[] = [
    {
      title: "WORKSPACE",
      items: [
        { id: "dashboard" as NavView, label: "Dashboard", icon: LayoutDashboard },
        { id: "agent" as NavView, label: "AI Support Agent", icon: Sparkles, badge: "AI" },
        { id: "tickets" as NavView, label: "Tickets", icon: Ticket },
        { id: "requests" as NavView, label: "Requests", icon: ClipboardList },
      ],
    },
    {
      title: "KNOWLEDGE",
      items: [
        { id: "knowledge" as NavView, label: "Knowledge Base", icon: BookOpen },
        { id: "policies" as NavView, label: "Policies", icon: ShieldCheck },
        { id: "assets" as NavView, label: "Assets", icon: Laptop },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          id: "actions" as NavView,
          label: "Action Requests",
          icon: Zap,
          count: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: "activity" as NavView, label: "Activity", icon: History },
      ],
    },
    {
      title: "SYSTEM",
      items: [{ id: "settings" as NavView, label: "Settings", icon: Settings }],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0D1B2A] text-[#E0E1DD] transition-all duration-300 ease-in-out border-r border-[#1B263B] select-none z-30 shrink-0 ${
        isCollapsed ? "w-[76px]" : "w-[250px]"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1B263B]">
        <div
          onClick={() => setActiveView("dashboard")}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="h-9 w-9 rounded-lg bg-[#415A77] flex items-center justify-center shrink-0 shadow-sm border border-[#778DA9]/30">
            <Bot className="h-5 w-5 text-[#E0E1DD]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-wider text-white uppercase">
                VERIDIAN
              </span>
              <span className="text-[11px] text-[#778DA9] truncate">
                IT Support Agent
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md text-[#778DA9] hover:text-white hover:bg-[#1B263B] transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[11px] font-semibold text-[#778DA9]/80 uppercase tracking-wider mb-2">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                    isActive
                      ? "bg-[#1B263B] text-white border-l-3 border-[#415A77] font-semibold shadow-xs"
                      : "text-[#E0E1DD]/80 hover:text-white hover:bg-[#1B263B]/60"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-[#778DA9]" : "text-[#778DA9]/70"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                      {item.badge}
                    </span>
                  )}
                  {!isCollapsed && item.count !== undefined && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-[#0D1B2A]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Status Block */}
      <div className="p-3 border-t border-[#1B263B] bg-[#0D1B2A]/90">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-lg bg-[#1B263B]/50 border border-[#1B263B] ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-white">
                System Operational
              </span>
              <span className="text-[10px] text-[#778DA9] truncate">
                Phase 0–6 Enterprise
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
