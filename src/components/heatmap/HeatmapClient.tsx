"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Layer } from "@/types/ecosystem";
import { LAYER_ACCENTS } from "@/lib/constants";
interface HeatmapClientProps {
  layers: Layer[];
}

type Metric = "funding" | "companies" | "growth";

export function HeatmapClient({ layers }: HeatmapClientProps) {
  const [metric, setMetric] = useState<Metric>("funding");

  const values = useMemo(() => {
    return layers.map((l) => {
      if (metric === "funding") return l.fundingPercent;
      if (metric === "companies") return l.companyCount;
      return l.growthTrend;
    });
  }, [layers, metric]);

  const max = Math.max(...values, 1);

  const labels: Record<Metric, string> = {
    funding: "Funding flow intensity (%)",
    companies: "Company count",
    growth: "Growth trend (% YoY)",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {(["funding", "companies", "growth"] as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              metric === m
                ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">{labels[metric]} — click a cell to explore</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {layers.map((layer, i) => {
          const value = values[i];
          const intensity = value / max;
          const accent = LAYER_ACCENTS[layer.id] ?? LAYER_ACCENTS.infrastructure;

          return (
            <Link
              key={layer.id}
              href={`/layers/${layer.id}/`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 p-6 transition hover:shadow-xl dark:border-zinc-800"
              style={{
                background: `linear-gradient(135deg, rgba(56,189,248,${0.08 + intensity * 0.35}) 0%, rgba(168,85,247,${0.08 + intensity * 0.35}) 100%)`,
              }}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.from} ${accent.to}`}
                style={{ opacity: 0.4 + intensity * 0.6 }}
              />
              <h3 className={`text-lg font-bold ${accent.text}`}>{layer.name}</h3>

              <div className="mt-4 flex items-end justify-between">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {metric === "funding"
                    ? `${layer.fundingPercent}%`
                    : metric === "companies"
                      ? layer.companyCount
                      : `+${layer.growthTrend}%`}
                </span>
                <div className="h-24 w-8 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={`w-full rounded-full bg-gradient-to-t ${accent.from} ${accent.to} transition-all duration-500`}
                    style={{ height: `${intensity * 100}%`, marginTop: `${(1 - intensity) * 100}%` }}
                  />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-500">Funding</dt>
                  <dd className="font-medium">{layer.fundingStatus}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Companies</dt>
                  <dd className="font-medium">{layer.companyCount}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Growth</dt>
                  <dd className="font-medium text-emerald-600">+{layer.growthTrend}%</dd>
                </div>
              </dl>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-600 opacity-0 transition group-hover:opacity-100 dark:text-violet-400">
                Drill down
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Stack overview</h3>
        <div className="mt-4 flex h-8 overflow-hidden rounded-lg">
          {layers.map((layer) => {
            const share = layer.fundingPercent / layers.reduce((s, l) => s + l.fundingPercent, 0);
            const accent = LAYER_ACCENTS[layer.id];
            return (
              <div
                key={layer.id}
                className={`bg-gradient-to-r ${accent.from} ${accent.to} transition hover:opacity-90`}
                style={{ width: `${share * 100}%` }}
                title={`${layer.name}: ${layer.fundingStatus}`}
              />
            );
          })}
        </div>
        <ul className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          {layers.map((layer) => {
            const accent = LAYER_ACCENTS[layer.id];
            return (
              <li key={layer.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${accent.from} ${accent.to}`} />
                {layer.name}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
