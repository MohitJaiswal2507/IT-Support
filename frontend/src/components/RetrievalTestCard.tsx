"use client";

import React, { useState } from "react";
import { searchRetrieval, SearchResultItem } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, BookOpen, Shield, Ticket, AlertCircle, Loader2 } from "lucide-react";

const SAMPLE_QUERIES = [
  "I entered my password too many times and I'm locked out",
  "I need to install software that isn't approved",
  "My visitor needs Wi-Fi",
  "My VPN credentials expired",
  "I need a new laptop because it is old",
];

export function RetrievalTestCard() {
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState<string>("all");
  const [topK, setTopK] = useState<number>(3);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchRetrieval(searchQuery.trim(), topK, sourceType);
      setResults(res.results);
      setHasSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "knowledge_base":
        return <BookOpen className="h-3.5 w-3.5 text-blue-600" />;
      case "policy":
        return <Shield className="h-3.5 w-3.5 text-amber-600" />;
      case "ticket":
        return <Ticket className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case "knowledge_base":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "policy":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ticket":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card className="max-w-xl mx-auto border-slate-200 shadow-sm bg-white mt-6">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-semibold text-slate-900">
              Phase 2 — Semantic Retrieval Engine
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono text-slate-600 bg-slate-50">
            FAISS / MiniLM-L6-v2
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500 mt-0.5">
          Cosine similarity search across Knowledge Base, Policies, and Historical Tickets.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Search controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="retrieval-query-input"
                placeholder="Enter query (e.g. locked out password)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 text-xs"
              />
            </div>
            <Button
              id="retrieval-search-button"
              size="sm"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Filters & Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">Source:</span>
              <select
                id="retrieval-source-filter"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Sources</option>
                <option value="knowledge_base">Knowledge Base</option>
                <option value="policy">Policy</option>
                <option value="ticket">Ticket</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">Top K:</span>
              <select
                id="retrieval-topk-select"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>

          {/* Sample query chips */}
          <div className="space-y-1 pt-1">
            <div className="text-[11px] font-medium text-slate-400">Quick Test Scenarios:</div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(sample);
                    handleSearch(sample);
                  }}
                  className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2 py-0.5 rounded transition text-left"
                >
                  &ldquo;{sample}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Retrieval Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Results display */}
        {hasSearched && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Ranked Results</span>
              <span>{results.length} matches found</span>
            </div>

            {results.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No matching documents found for this query and filter.
              </div>
            )}

            {results.map((item, idx) => (
              <div
                key={item.chunk_id || idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 inline-flex items-center gap-1 font-semibold ${getSourceColor(
                        item.source_type
                      )}`}
                    >
                      {getSourceIcon(item.source_type)}
                      {item.source_id}
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({item.chunk_id})
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    Score: {item.score.toFixed(4)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                  {item.text}
                </p>
                {typeof item.metadata?.title === "string" && (
                  <div className="text-[10px] text-slate-400 font-medium truncate">
                    Title: {item.metadata.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
