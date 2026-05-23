"use client";

import type { ArchitectureApproach } from "@/types/dashboard";

export interface ApproachDescriptionProps {
  approach: ArchitectureApproach;
}

export function ApproachDescription({ approach }: ApproachDescriptionProps) {
  return (
    <div className="max-w-3xl space-y-2">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
        {approach.label}
      </h2>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
        {approach.description}
      </p>
    </div>
  );
}
