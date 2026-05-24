"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Layer } from "@/types/ecosystem";
import { buildGraphData } from "@/lib/ecosystem-utils";
import { EcosystemGraph } from "@/components/graph/EcosystemGraph";

interface EcosystemGraphSectionProps {
  layers: Layer[];
}

const APPROACHES = [
  { id: "all", label: "All Companies" },
  { id: "value-chain", label: "Value Chain" },
  { id: "infrastructure-data", label: "Infra vs Data" },
  { id: "human-in-loop", label: "Human-in-Loop" },
];

export function EcosystemGraphSection({ layers }: EcosystemGraphSectionProps) {
  const [selectedApproach, setSelectedApproach] = useState("all");

  const { nodes, edges } = useMemo(
    () => buildGraphData(layers, selectedApproach),
    [layers, selectedApproach],
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
            Ecosystem knowledge map
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Companies as nodes, layers as hubs. Filter by architecture approach to reconfigure the graph.
          </p>
        </div>
        {/* Approach pills */}
        <div className="flex flex-wrap gap-1.5">
          {APPROACHES.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedApproach(a.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selectedApproach === a.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                  : "border border-zinc-200/70 bg-white/60 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedApproach}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EcosystemGraph
            nodes={nodes}
            edges={edges}
            selectedApproach={selectedApproach}
          />
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-zinc-400">
        {nodes.filter((n) => n.type === "company").length} companies across {nodes.filter((n) => n.type === "layer").length} layers
      </p>
    </section>
  );
}
