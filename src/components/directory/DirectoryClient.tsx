"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company, Layer } from "@/types/ecosystem";

function CompanyLogo({ company }: { company: Company }) {
  const [failed, setFailed] = useState(false);
  const initials = company.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  if (!company.logo || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-[10px] font-semibold text-white/40">
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={company.logo} alt={company.name} onError={() => setFailed(true)}
      className="h-9 w-9 shrink-0 rounded-lg bg-white/5 object-cover" loading="lazy" />
  );
}

const LAYER_SHORT: Record<string, string> = {
  infrastructure: "Infra", model: "Model", application: "App",
  integration: "Integration", security: "Security", monetization: "Data",
};

export function DirectoryClient({ companies, layers }: { companies: Company[]; layers: Layer[] }) {
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("alphabet");

  const categories = useMemo(() => {
    const s = new Set(companies.map(c => c.category).filter(Boolean));
    return ["all", ...Array.from(s).sort()];
  }, [companies]);

  const filtered = useMemo(() => {
    let r = [...companies];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.products?.some(p => p.toLowerCase().includes(q))
      );
    }
    if (layer !== "all") r = r.filter(c => c.layers?.includes(layer));
    if (category !== "all") r = r.filter(c => c.category === category);
    if (sort === "alphabet") r.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "founded") r.sort((a, b) => (a.founded ?? 0) - (b.founded ?? 0));
    else if (sort === "category") r.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
    return r;
  }, [companies, query, layer, category, sort]);

  return (
    <div className="space-y-8">
      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" placeholder="Search companies, products..." value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-white/6 bg-white/3 py-2.5 pl-8 pr-3 text-sm text-white placeholder-white/15 focus:border-white/15 focus:outline-none" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="rounded-lg border border-white/6 bg-black px-3 py-2.5 text-sm text-white/40">
          <option value="alphabet">A to Z</option>
          <option value="founded">Founded</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Layer pills */}
      <div className="flex flex-wrap gap-2">
        {["all", ...layers.map(l => l.id)].map(lid => (
          <button key={lid} onClick={() => setLayer(lid)}
            className={`rounded-full px-3 py-1 text-xs tracking-wide transition ${
              layer === lid ? "bg-white text-black" : "text-white/20 hover:text-white/50"
            }`}>{lid === "all" ? "All" : LAYER_SHORT[lid] ?? lid}</button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 15).map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1 text-[10px] tracking-wide transition ${
              category === cat ? "border border-white/30 text-white" : "text-white/15 hover:text-white/40"
            }`}>{cat === "all" ? "All categories" : cat}</button>
        ))}
      </div>

      <p className="text-[10px] text-white/15 tracking-[0.3em] uppercase">{filtered.length} companies</p>

      {/* List */}
      <div className="divide-y divide-white/4">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => (
            <motion.div key={c.id} layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: Math.min(i * 0.008, 0.1) }}
              className="group flex items-center gap-4 py-4 transition hover:bg-white/[0.015]"
            >
              <CompanyLogo company={c} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium text-white/90">{c.name}</span>
                  <span className="text-[10px] text-white/20">{c.category}</span>
                  {c.headquarters && (
                    <span className="hidden text-[9px] text-white/10 sm:inline">{c.headquarters}</span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/25">{c.description}</p>
                {c.products && c.products.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.products.slice(0, 3).map(p => (
                      <span key={p} className="text-[8px] text-white/15">{p}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden shrink-0 gap-1 sm:flex">
                {c.layers?.slice(0, 2).map(lid => (
                  <span key={lid} className="rounded-full border border-white/6 px-2 py-0.5 text-[8px] uppercase text-white/20">
                    {LAYER_SHORT[lid] ?? lid}
                  </span>
                ))}
              </div>
              <span className="hidden w-12 shrink-0 text-right text-[10px] text-white/15 sm:block">
                {c.founded ?? ""}
              </span>
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-[10px] text-white/12 hover:text-white/40 transition">↗</a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-xs text-white/15">No companies match.</p>
      )}
    </div>
  );
}
