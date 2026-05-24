"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company, Layer } from "@/types/ecosystem";
import { LAYER_ACCENTS } from "@/lib/constants";

interface ExplorerClientProps {
  companies: Company[];
  layers: Layer[];
}

function CompanyCard({ company }: { company: Company }) {
  const primaryLayerId = company.layers?.[0] ?? "infrastructure";
  const accent = LAYER_ACCENTS[primaryLayerId] ?? LAYER_ACCENTS.infrastructure;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-lg dark:border-zinc-700/80 dark:bg-zinc-900/60 ${accent.ring} hover:ring-2`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.from} ${accent.to}`} />

      <div className="flex items-start gap-4">
        {/* Logo */}
        <img
          src={company.logo}
          alt={company.name}
          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          loading="lazy"
        />

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`truncate text-sm font-bold ${accent.text}`}>
              {company.name}
            </h3>
            {company.valuation && company.valuation !== "N/A" && (
              <span className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {company.valuation}
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {company.description}
          </p>

          {/* Layer badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {company.layers?.map((lid) => {
              const la = LAYER_ACCENTS[lid] ?? LAYER_ACCENTS.infrastructure;
              return (
                <span
                  key={lid}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${la.text} bg-zinc-100 dark:bg-zinc-800`}
                >
                  {lid}
                </span>
              );
            })}
            {company.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-400">est. {company.founded}</span>
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
        >
          Visit site →
        </a>
      </div>
    </motion.article>
  );
}

const SORT_OPTIONS = [
  { value: "alphabet", label: "A to Z" },
  { value: "founded", label: "Founded" },
  { value: "category", label: "Category" },
];

export function ExplorerClient({ companies, layers }: ExplorerClientProps) {
  const [query, setQuery] = useState("");
  const [selectedLayer, setSelectedLayer] = useState("all");
  const [selectedApproach, setSelectedApproach] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("alphabet");

  const approaches = [
    { id: "all", label: "All approaches" },
    { id: "value-chain", label: "Value Chain" },
    { id: "infrastructure-data", label: "Infra vs Data" },
    { id: "human-in-loop", label: "Human-in-Loop" },
  ];

  const categories = useMemo(() => {
    const cats = new Set(companies.map((c) => c.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [companies]);

  const filtered = useMemo(() => {
    let result = [...companies];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (selectedLayer !== "all") {
      result = result.filter((c) => c.layers?.includes(selectedLayer));
    }

    if (selectedApproach !== "all") {
      result = result.filter((c) =>
        c.approaches?.includes(selectedApproach),
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((c) => c.category === selectedCategory);
    }

    if (sortBy === "alphabet") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "founded") {
      result.sort((a, b) => (a.founded ?? 0) - (b.founded ?? 0));
    } else if (sortBy === "category") {
      result.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
    }

    return result;
  }, [companies, query, selectedLayer, selectedApproach, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search + Sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Layer filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedLayer("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedLayer === "all"
                ? "bg-violet-500 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            All layers
          </button>
          {layers.map((layer) => {
            // layer accent available via LAYER_ACCENTS[layer.id]
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selectedLayer === layer.id
                    ? `bg-violet-500 text-white`
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {layer.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Approach + Category row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          {approaches.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedApproach(a.id)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                selectedApproach === a.id
                  ? "bg-fuchsia-500 text-white font-semibold"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing <strong className="text-zinc-700 dark:text-zinc-200">{filtered.length}</strong> of {companies.length} companies
      </p>

      {/* Grid */}
      <motion.div
        layout
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-zinc-500 dark:text-zinc-400">
          <svg className="mx-auto mb-4 h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No companies match your filters.</p>
          <button
            onClick={() => { setQuery(""); setSelectedLayer("all"); setSelectedApproach("all"); setSelectedCategory("all"); }}
            className="mt-3 text-xs text-violet-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
