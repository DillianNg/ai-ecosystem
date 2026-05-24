"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Layer } from "@/types/ecosystem";
import { buildGraphData } from "@/lib/ecosystem-utils";
import { EcosystemGraph } from "@/components/graph/EcosystemGraph";

const APPROACHES = [
  { id: "all",                label: "All" },
  { id: "value-chain",        label: "Value Chain" },
  { id: "infrastructure-data",label: "Infra vs Data" },
  { id: "human-in-loop",      label: "Human-in-Loop" },
];

export function EcosystemGraphSection({ layers }: { layers: Layer[] }) {
  const [selectedApproach, setSelectedApproach] = useState("all");

  const { nodes, edges } = useMemo(
    () => buildGraphData(layers, selectedApproach),
    [layers, selectedApproach],
  );

  return (
    <section className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header row */}
      <div className="mb-6 flex items-end justify-between px-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/25">
            Ecosystem Knowledge Map
          </p>
          <p className="mt-1 text-xs text-white/35">
            {nodes.filter(n => n.type === "company").length} companies across {nodes.filter(n => n.type === "layer").length} layers
          </p>
        </div>

        {/* Approach pills */}
        <div className="flex gap-3">
          {APPROACHES.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedApproach(a.id)}
              className={`text-xs tracking-wide transition ${
                selectedApproach === a.id
                  ? "text-white"
                  : "text-white/25 hover:text-white/60"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph canvas — fullscreen */}
      <div className="flex-1 overflow-hidden rounded-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedApproach}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full"
          >
            <EcosystemGraph nodes={nodes} edges={edges} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
