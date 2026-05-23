"use client";

import { useMemo, useState } from "react";
import type { Layer } from "@/types/ecosystem";
import type { ArchitectureApproachId } from "@/types/dashboard";
import {
  getArchitectureApproaches,
  getDefaultApproach,
  getHumanLoopSteps,
} from "@/lib/dashboard-data";
import { FilterControl } from "@/components/dashboard/FilterControl";
import { ApproachDescription } from "@/components/dashboard/ApproachDescription";
import { LayerVisualization } from "@/components/dashboard/LayerVisualization";

export interface DashboardViewProps {
  layers: Layer[];
}

export function DashboardView({ layers }: DashboardViewProps) {
  const approaches = useMemo(() => getArchitectureApproaches(), []);
  const humanLoopSteps = useMemo(() => getHumanLoopSteps(), []);
  const defaultApproach = useMemo(() => getDefaultApproach(), []);

  const [selectedId, setSelectedId] = useState<ArchitectureApproachId>(defaultApproach.id);

  const selectedApproach = useMemo(
    () => approaches.find((a) => a.id === selectedId) ?? defaultApproach,
    [approaches, selectedId, defaultApproach],
  );

  return (
    <section className="space-y-8" aria-label="Architecture dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
            View switcher
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Select an architecture lens to explore the stack
          </p>
        </div>
        <FilterControl value={selectedId} options={approaches} onChange={setSelectedId} />
      </div>

      <ApproachDescription approach={selectedApproach} />

      <LayerVisualization
        approach={selectedApproach}
        layers={layers}
        humanLoopSteps={humanLoopSteps}
      />
    </section>
  );
}
