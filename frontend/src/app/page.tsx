import { Header } from "@/components/Header";
import { StatusCard } from "@/components/StatusCard";
import { DatasetMetricsCard } from "@/components/DatasetMetricsCard";
import { Layers, ShieldCheck, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Internal Enterprise Services
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Veridian IT Support Agent
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Internal corporate service agent foundation. Baseline establishes the
            decoupled Next.js frontend and FastAPI backend with relational assignment data.
          </p>
        </div>

        {/* Live Status Card & Dataset Verification */}
        <div className="mb-10 space-y-2">
          <StatusCard />
          <DatasetMetricsCard />
        </div>

        {/* Phase Architecture Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto w-full">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1.5">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Frontend Layer</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Next.js 16 App Router, TypeScript, and Tailwind CSS. Built with modular UI components.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1.5">
              <Cpu className="h-4 w-4 text-emerald-600" />
              <span>Backend & Database</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              FastAPI with SQLite/SQLAlchemy relational models, Pydantic schemas, and seeded Assignment 2 datasets.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Data & Health API</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              RESTful endpoints for <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/health</code>, <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/api/knowledge-base</code>, <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/api/policies</code>, <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/api/requests</code>, and <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/api/tickets</code>.
            </p>
          </div>
        </div>

        {/* Phase Scope Notice */}
        <div className="mt-8 text-center text-xs text-slate-400 max-w-lg mx-auto">
          Phase 1 establishes the relational data layer. Knowledge base retrieval,
          agent reasoning, and ticket processing will be implemented in subsequent phases.
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          &copy; {new Date().getFullYear()} Veridian Corp — IT Operations & Support Platform
        </div>
      </footer>
    </div>
  );
}
