"use client";

import type { Company } from "@/types/ecosystem";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

interface CompanyCardProps {
  company: Company;
  onSelect: (company: Company) => void;
  compact?: boolean;
}

export function CompanyCard({ company, onSelect, compact }: CompanyCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(company)}
      className={`group w-full rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-600 ${
        compact ? "p-3" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo name={company.name} logo={company.logo} size={compact ? 40 : 48} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-zinc-900 group-hover:text-violet-600 dark:text-zinc-50 dark:group-hover:text-violet-400">
            {company.name}
          </h3>
          <p className="text-xs text-zinc-500">{company.category}</p>
          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {company.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {company.valuation}
            </span>
            <span className="text-zinc-500">Est. {company.founded}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
