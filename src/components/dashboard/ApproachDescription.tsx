"use client";

import type { ArchitectureApproach } from "@/types/dashboard";

export function ApproachDescription({ approach }: { approach: ArchitectureApproach }) {
  return (
    <div className="max-w-3xl space-y-2">
      <h2 className="text-lg font-light text-white sm:text-xl">{approach.label}</h2>
      <p className="text-sm leading-relaxed text-white/40">{approach.description}</p>
    </div>
  );
}
