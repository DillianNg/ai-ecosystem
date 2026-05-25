import type { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { EcosystemGraphSection } from "@/components/graph/EcosystemGraphSection";

export const metadata: Metadata = {
  title: "Ecosystem Graph",
  description: "Interactive force-directed graph of the AI ecosystem — companies, layers, and relationships.",
};

export default function GraphPage() {
  const { layers } = getBundledData();
  return (
    <div className="bg-black" style={{ height: "calc(100vh - 56px)" }}>
      <div className="h-full px-8 py-8">
        <EcosystemGraphSection layers={layers} />
      </div>
    </div>
  );
}
