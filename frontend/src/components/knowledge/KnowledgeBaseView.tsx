"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  RefreshCw,
  FileText,
  X,
  ExternalLink,
  Tag,
} from "lucide-react";
import { fetchKnowledgeBase, KnowledgeBaseItem } from "@/lib/api";

export function KnowledgeBaseView() {
  const [articles, setArticles] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseItem | null>(null);

  const loadKB = async () => {
    setLoading(true);
    try {
      const res = await fetchKnowledgeBase();
      setArticles(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKB();
  }, []);

  const filteredArticles = articles.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      (a.category && a.category.toLowerCase().includes(q)) ||
      a.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header & Search */}
      <div className="bg-white rounded-xl border border-[#E0E1DD] p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#415A77]" />
            Knowledge Base
          </h2>
          <p className="text-xs text-[#778DA9]">
            Official Veridian IT support articles and standard operating procedures.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="h-3.5 w-3.5 text-[#778DA9] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge articles..."
              className="w-full bg-[#E0E1DD]/30 border border-[#E0E1DD] hover:border-[#778DA9]/60 focus:border-[#415A77] focus:bg-white text-xs text-[#0D1B2A] placeholder-[#778DA9] rounded-lg pl-8 pr-3 py-1.5 outline-hidden transition-all"
            />
          </div>

          <button
            onClick={loadKB}
            disabled={loading}
            className="p-2 rounded-lg border border-[#E0E1DD] text-[#415A77] hover:bg-[#E0E1DD]/40 transition-colors"
            title="Refresh Knowledge Base"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of KB Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-12 text-center text-[#778DA9]">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#415A77]" />
          Loading knowledge articles...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E1DD] p-12 text-center text-[#778DA9]">
          No knowledge articles matched your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white rounded-xl border border-[#E0E1DD] p-4 shadow-xs hover:border-[#415A77] hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#415A77] bg-[#E0E1DD]/50 px-2 py-0.5 rounded">
                    {article.id}
                  </span>
                  {article.category && (
                    <span className="text-[10px] text-[#778DA9] flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {article.category}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-[#0D1B2A] group-hover:text-[#415A77] transition-colors line-clamp-1">
                  {article.title}
                </h3>

                <p className="text-xs text-[#778DA9] line-clamp-3 leading-relaxed">
                  {article.content}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[#E0E1DD] flex items-center justify-between text-xs font-semibold text-[#415A77]">
                <span>Read Full Article</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Article Reader Drawer */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedArticle(null)}
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E1DD]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#415A77]">
                  {selectedArticle.id}
                </span>
                {selectedArticle.category && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1B263B] text-white">
                    {selectedArticle.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-md text-[#778DA9] hover:bg-[#E0E1DD]/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h2 className="text-base font-bold text-[#0D1B2A] leading-snug">
                  {selectedArticle.title}
                </h2>
                {selectedArticle.source_file && (
                  <span className="text-[11px] font-mono text-[#778DA9] block mt-1">
                    Source: {selectedArticle.source_file}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#E0E1DD]/20 border border-[#E0E1DD] text-[#0D1B2A] leading-relaxed whitespace-pre-line text-xs">
                {selectedArticle.content}
              </div>

              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-[11px] text-[#0D1B2A]">
                <strong>Official Authority:</strong> Knowledge Base articles represent active verified enterprise documentation. Grounded responses in the Veridian agent prioritize active KB over historical tickets.
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E1DD] mt-auto">
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full py-2 rounded-lg bg-[#415A77] hover:bg-[#1B263B] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
