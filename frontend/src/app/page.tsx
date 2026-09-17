"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NavView } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { AgentWorkspaceView } from "@/components/agent/AgentWorkspaceView";
import { TicketsView } from "@/components/tickets/TicketsView";
import { RequestsView } from "@/components/requests/RequestsView";
import { KnowledgeBaseView } from "@/components/knowledge/KnowledgeBaseView";
import { PoliciesView } from "@/components/policies/PoliciesView";
import { AssetsView } from "@/components/assets/AssetsView";
import { ActionRequestsView } from "@/components/actions/ActionRequestsView";
import { ActivityView } from "@/components/activity/ActivityView";
import { SettingsView } from "@/components/settings/SettingsView";
import { fetchActionRequests } from "@/lib/api";

export default function Home() {
  const [activeView, setActiveView] = useState<NavView>("dashboard");
  const [agentInitialQuery, setAgentInitialQuery] = useState<string>("");
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const updatePendingCount = async () => {
    try {
      const res = await fetchActionRequests();
      const pending = res.items.filter((a) => a.status === "PENDING_APPROVAL").length;
      setPendingApprovalsCount(pending);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (view: NavView, query?: string) => {
    if (query) {
      setAgentInitialQuery(query);
    }
    setActiveView(view);
  };

  return (
    <AppShell
      activeView={activeView}
      setActiveView={(v) => {
        if (v !== "agent") setAgentInitialQuery("");
        setActiveView(v);
      }}
      pendingApprovalsCount={pendingApprovalsCount}
    >
      {activeView === "dashboard" && (
        <DashboardView onNavigate={handleNavigate} />
      )}
      {activeView === "agent" && (
        <AgentWorkspaceView
          key={agentInitialQuery}
          initialQuery={agentInitialQuery}
        />
      )}
      {activeView === "tickets" && <TicketsView />}
      {activeView === "requests" && <RequestsView />}
      {activeView === "knowledge" && <KnowledgeBaseView />}
      {activeView === "policies" && <PoliciesView />}
      {activeView === "assets" && <AssetsView />}
      {activeView === "actions" && <ActionRequestsView />}
      {activeView === "activity" && <ActivityView />}
      {activeView === "settings" && <SettingsView />}
    </AppShell>
  );
}
