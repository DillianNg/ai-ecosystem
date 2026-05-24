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
    <div className="min-h-screen bg-black pt-24 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/25 mb-3">
          Metrics
        </p>
        <h1 className="text-4xl font-thin text-white sm:text-6xl">
          Heatmap
        </h1>
        <p className="mt-4 max-w-lg text-sm text-white/35">
          Compare funding distribution, company density, and growth trends across all six
          layers. Select a metric and click any cell to drill into layer details.
        </p>
      </div>
      <HeatmapClient layers={layers} />
    </div>
  );
}
