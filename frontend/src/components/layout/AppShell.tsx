"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, NavView } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { checkBackendHealth, HealthCheckResult } from "@/lib/api";
import { X, Bot } from "lucide-react";

interface AppShellProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  children: React.ReactNode;
  pendingApprovalsCount?: number;
}

export function AppShell({
  activeView,
  setActiveView,
  children,
  pendingApprovalsCount = 0,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const refreshHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch {
      setHealth({
        ok: false,
        checkedAt: new Date().toLocaleTimeString(),
        endpoint: "/health",
        error: "Connection failed",
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#E0E1DD] text-[#0D1B2A]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          pendingApprovalsCount={pendingApprovalsCount}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-[#0D1B2A] text-white h-full z-10 shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-[#1B263B]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#415A77] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-[#E0E1DD]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm tracking-wider uppercase">
                    VERIDIAN
                  </span>
                  <span className="text-[10px] text-[#778DA9]">IT Support</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-[#778DA9] hover:text-white hover:bg-[#1B263B]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeView={activeView}
                setActiveView={(v) => {
                  setActiveView(v);
                  setMobileMenuOpen(false);
                }}
                isCollapsed={false}
                setIsCollapsed={() => {}}
                pendingApprovalsCount={pendingApprovalsCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <TopHeader
          activeView={activeView}
          health={health}
          checkingHealth={checkingHealth}
          onRefreshHealth={refreshHealth}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
