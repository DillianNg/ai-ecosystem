"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Company, CompanySort, CompanySortOrder, Layer } from "@/types/ecosystem";
import { sortCompanies } from "@/lib/utils";
import { LAYER_ACCENTS } from "@/lib/constants";
import { FundingIndicator } from "@/components/ui/FundingIndicator";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { CompanyCard } from "@/components/layers/CompanyCard";
import { CompanyModal } from "@/components/ui/CompanyModal";
import { formatDate } from "@/lib/utils";

interface LayerDetailClientProps {
  layer: Layer;
}

export function LayerDetailClient({ layer }: LayerDetailClientProps) {
  const accent = LAYER_ACCENTS[layer.id] ?? LAYER_ACCENTS.infrastructure;
  const searchParams = useSearchParams();
  const [selectedOverride, setSelectedOverride] = useState<Company | null | undefined>(
    undefined
  );

  const companyFromUrl = useMemo(() => {
    const id = searchParams.get("company");
    if (!id) return null;
    return layer.companies.find((c) => c.id === id) ?? null;
  }, [searchParams, layer.companies]);

  const activeCompany =
    selectedOverride !== undefined ? selectedOverride : companyFromUrl;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<CompanySort>("funding");
  const [sortOrder, setSortOrder] = useState<CompanySortOrder>("desc");

  const categories = useMemo(
    () => ["all", ...new Set(layer.companies.map((c) => c.category))],
    [layer.companies]
  );

  const filtered = useMemo(() => {
    let list = layer.companies;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    if (category !== "all") {
      list = list.filter((c) => c.category === category);
    }
    return sortCompanies(list, sortBy, sortOrder);
  }, [layer.companies, query, category, sortBy, sortOrder]);

  const featured = useMemo(
    () => sortCompanies(layer.companies, "funding", "desc").slice(0, 10),
    [layer.companies]
  );

  const openCompany = useCallback((company: Company) => {
    setSelectedOverride(company);
    const url = new URL(window.location.href);
    url.searchParams.set("company", company.id);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const closeModal = useCallback(() => {
    setSelectedOverride(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("company");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  return (
    <div className="space-y-16">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}>
              Layer
            </p>
            <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {layer.name}
            </h1>
            <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-300">
              {layer.fullDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyLinkButton path={`/layers/${layer.id}/`} />
            </div>
          </div>
          <FundingIndicator
            percent={layer.fundingPercent}
            status={layer.fundingStatus}
            size="lg"
          />
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Featured companies
            </h2>
            <p className="text-sm text-zinc-500">Top 10 by valuation — click for details</p>
          </div>
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={openCompany}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          All companies
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          {filtered.length} of {layer.companies.length} companies
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={openCompany}
              compact
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700">
            No companies match your filters.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">News</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layer.news.map((item) => (
            <article
              key={item.title}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <time className="text-xs text-zinc-500">{formatDate(item.date)}</time>
              <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                {item.summary}
              </p>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
              >
                Read original
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </article>
          ))}
        </div>
      </section>

      <CompanyModal
        company={activeCompany}
        layerId={layer.id}
        onClose={closeModal}
      />
    </div>
  );
}

function FilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
  sortBy: CompanySort;
  onSortByChange: (v: CompanySort) => void;
  sortOrder: CompanySortOrder;
  onSortOrderChange: (v: CompanySortOrder) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
      <input
        type="search"
        placeholder="Search companies..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All categories" : c}
          </option>
        ))}
      </select>
      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => {
          const [s, o] = e.target.value.split("-") as [CompanySort, CompanySortOrder];
          onSortByChange(s);
          onSortOrderChange(o);
        }}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="funding-desc">Funding ↓</option>
        <option value="funding-asc">Funding ↑</option>
        <option value="alphabet-asc">A → Z</option>
        <option value="alphabet-desc">Z → A</option>
        <option value="category-asc">Category A → Z</option>
      </select>
    </div>
  );
}
