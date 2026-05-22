import type { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { HeatmapClient } from "@/components/heatmap/HeatmapClient";

export const metadata: Metadata = {
  title: "Heatmap",
  description: "Funding distribution, company counts, and growth trends across AI ecosystem layers.",
};

export default function HeatmapPage() {
  const { layers } = getBundledData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Ecosystem heatmap
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Compare funding distribution, company density, and growth trends across all six
          layers. Select a metric and click any cell to drill into layer details.
        </p>
      </section>
      <HeatmapClient layers={layers} />
    </div>
  );
}
