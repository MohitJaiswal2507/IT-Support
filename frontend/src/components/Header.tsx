import React from "react";
import { Shield, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-semibold">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">
                VERIDIAN
              </span>
              <span className="text-slate-400 font-medium text-sm">|</span>
              <span className="text-slate-600 font-medium text-sm">
                Internal Service Agent
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 py-1 px-3 text-slate-600 bg-slate-50">
            <Terminal className="h-3 w-3 text-slate-400" />
            Phase 0: Project Foundation
          </Badge>
          <span className="text-xs font-mono text-slate-400">v0.1.0</span>
        </div>
      </div>
    </header>
  );
}
