"use client";

import type { ArchitectureApproach, ArchitectureApproachId } from "@/types/dashboard";

export interface FilterControlProps {
  value: ArchitectureApproachId;
  options: ArchitectureApproach[];
  onChange: (value: ArchitectureApproachId) => void;
}

export function FilterControl({ value, options, onChange }: FilterControlProps) {
  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="architecture-approach" className="sr-only">
        Architecture view
      </label>
      <select
        id="architecture-approach"
        value={value}
        onChange={(e) => onChange(e.target.value as ArchitectureApproachId)}
        className="w-full appearance-none rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 pr-10 text-sm font-medium text-zinc-800 shadow-sm backdrop-blur-md transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-100"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500 dark:text-zinc-400"
        aria-hidden
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}
