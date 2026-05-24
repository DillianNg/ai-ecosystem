"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company, Layer } from "@/types/ecosystem";

// Robust logo with initials fallback
function CompanyLogo({ company }: { company: Company }) {
  const [failed, setFailed] = useState(false);
  const initials = company.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!company.logo || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-[10px] font-semibold text-white/60">
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={company.logo}
      alt={company.name}
      onError={() => setFailed(true)}
      className="h-9 w-9 shrink-0 rounded-lg object-cover"
      loading="lazy"
    />
  );
}

const LAYER_LABELS: Record<string, string> = {
  infrastructure: "Infra",
  model: "Model",
  application: "App",
  integration: "Integration",
  security: "Security",
  monetization: "Monetization",
};

interface DirectoryClientProps {
  companies: Company[];
  layers: Layer[];
}

export function DirectoryClient({ companies, layers }: DirectoryClientProps) {
  const [query, setQuery]               = useState("");
  const [selectedLayer, setLayer]       = useState("all");
  const [selectedCategory, setCategory] = useState("all");
  const [sortBy, setSort]               = useState("alphabet");

  const categories = useMemo(() => {
    const cats = new Set(companies.map((c) => c.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [companies]);

  const filtered = useMemo(() => {
    let r = [...companies];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (c) => c.name.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
    }
    if (selectedLayer !== "all") r = r.filter((c) => c.layers?.includes(selectedLayer));
    if (selectedCategory !== "all") r = r.filter((c) => c.category === selectedCategory);
    if (sortBy === "alphabet") r.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "founded") r.sort((a, b) => (a.founded ?? 0) - (b.founded ?? 0));
    else if (sortBy === "category") r.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
    return r;
  }, [companies, query, selectedLayer, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pl-8 pr-3 text-sm text-white placeholder-white/20 focus:border-white/20 focus:outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-white/8 bg-black px-3 py-2.5 text-sm text-white/50"
        >
          <option value="alphabet">A to Z</option>
          <option value="founded">Founded</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Layer filter pills */}
      <div className="flex flex-wrap gap-2">
        {["all", ...layers.map((l) => l.id)].map((lid) => (
          <button
            key={lid}
            onClick={() => setLayer(lid)}
            className={`rounded-full px-3 py-1 text-xs tracking-wide transition ${
              selectedLayer === lid
                ? "bg-white text-black"
                : "text-white/30 hover:text-white/70"
            }`}
          >
            {lid === "all" ? "All layers" : LAYER_LABELS[lid] ?? lid}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 12).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1 text-[11px] tracking-wide transition ${
              selectedCategory === cat
                ? "border border-white/40 text-white"
                : "text-white/20 hover:text-white/50"
            }`}
          >
            {cat === "all" ? "All categories" : cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-white/20 tracking-widest uppercase">
        {filtered.length} companies
      </p>

      {/* Table / grid */}
      <div className="divide-y divide-white/5">
        <AnimatePresence mode="popLayout">
          {filtered.map((company, i) => (
            <motion.div
              key={company.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.15) }}
              className="group flex items-center gap-4 py-4 transition hover:bg-white/2"
            >
              <CompanyLogo company={company} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium text-white group-hover:text-white">
                    {company.name}
                  </span>
                  <span className="text-[10px] text-white/25">{company.category}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/30">{company.description}</p>
              </div>

              {/* Layer badges */}
              <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                {company.layers?.slice(0, 2).map((lid) => (
                  <span key={lid} className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/30">
                    {LAYER_LABELS[lid] ?? lid}
                  </span>
                ))}
              </div>

              {/* Founded */}
              <span className="hidden shrink-0 text-xs text-white/20 sm:block w-10 text-right">
                {company.founded}
              </span>

              {/* Link */}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-xs text-white/20 transition hover:text-white/60"
                >
                  ↗
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-xs text-white/20">No companies match your filters.</p>
      )}
    </div>
  );
}
