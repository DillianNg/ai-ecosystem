import type { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { EcosystemGraph } from "@/components/graph/EcosystemGraph";

export const metadata: Metadata = {
  title: "Ecosystem Graph",
  description: "Interactive force-directed graph of the AI ecosystem — companies, layers, and relationships.",
};

export default function GraphPage() {
  const { layers } = getBundledData();
  return (
    // Full viewport minus the 64px header — no padding, no footer bleed
    <div style={{ height: "calc(100vh - 64px)" }}>
      <EcosystemGraph layers={layers} />
    </div>
  );
}
