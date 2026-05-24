import { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "View",
  description: "Architecture lenses: Value Chain, Infrastructure vs Data, Human-in-the-Loop.",
};

export default function ViewPage() {
  const { layers } = getBundledData();
  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/25 mb-3">
          Architecture Lenses
        </p>
        <h1 className="text-4xl font-thin text-white sm:text-6xl">View</h1>
        <p className="mt-4 text-sm text-white/35 max-w-lg">
          Explore the AI stack through different architecture approaches. Switch lenses to reconfigure the ecosystem perspective.
        </p>
      </div>
      <DashboardView layers={layers} />
    </div>
  );
}
