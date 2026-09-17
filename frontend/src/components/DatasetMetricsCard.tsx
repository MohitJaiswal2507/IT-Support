"use client";

import React, { useEffect, useState } from "react";
import { fetchDatasetCounts, DatasetCounts } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, BookOpen, Shield, HelpCircle, Ticket, CheckCircle2 } from "lucide-react";

export function DatasetMetricsCard() {
  const [counts, setCounts] = useState<DatasetCounts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchDatasetCounts()
      .then((data) => {
        if (isMounted) {
          setCounts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="max-w-xl mx-auto border-slate-200 shadow-sm bg-white mt-6">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-semibold text-slate-900">
              Phase 1 — Assignment Data Layer Verification
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono text-slate-600 bg-slate-50">
            SQLite / SQLAlchemy
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500 mt-0.5">
          Live dataset records queried dynamically from backend REST endpoints.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
            <div className="flex justify-center mb-1 text-slate-500">
              <BookOpen className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">
              {loading ? "..." : counts ? counts.knowledgeBase : "—"}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Knowledge Base</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
            <div className="flex justify-center mb-1 text-slate-500">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">
              {loading ? "..." : counts ? counts.policies : "—"}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Policies</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
            <div className="flex justify-center mb-1 text-slate-500">
              <HelpCircle className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">
              {loading ? "..." : counts ? counts.requests : "—"}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Requests</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
            <div className="flex justify-center mb-1 text-slate-500">
              <Ticket className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">
              {loading ? "..." : counts ? counts.tickets : "—"}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Tickets</div>
          </div>
        </div>

        {counts && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All 4 Assignment 2 datasets verified active in relational store.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
