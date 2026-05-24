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
      <label htmlFor="architecture-approach" className="sr-only">Architecture view</label>
      <select
        id="architecture-approach"
        value={value}
        onChange={(e) => onChange(e.target.value as ArchitectureApproachId)}
        className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white backdrop-blur-md transition focus:border-white/25 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/30" aria-hidden>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}
