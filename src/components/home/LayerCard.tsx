"use client";

import Link from "next/link";
import type { Layer } from "@/types/ecosystem";
import { LAYER_ACCENTS } from "@/lib/constants";
import { FundingIndicator } from "@/components/ui/FundingIndicator";
interface LayerCardProps {
  layer: Layer;
}

export function LayerCard({ layer }: LayerCardProps) {
  const accent = LAYER_ACCENTS[layer.id] ?? LAYER_ACCENTS.infrastructure;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 ${accent.ring} hover:ring-2`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.from} ${accent.to}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${accent.text}`}>{layer.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {layer.description}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <FundingIndicator
          percent={layer.fundingPercent}
          status={layer.fundingStatus}
          size="sm"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>{layer.companyCount} companies tracked</span>
        <span className="text-emerald-600 dark:text-emerald-400">
          +{layer.growthTrend}% YoY
        </span>
      </div>

      <Link
        href={`/layers/${layer.id}/`}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${accent.from} ${accent.to} px-4 py-2.5 text-sm font-semibold text-white opacity-90 transition group-hover:opacity-100`}
      >
        Explore
        <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </article>
  );
}
