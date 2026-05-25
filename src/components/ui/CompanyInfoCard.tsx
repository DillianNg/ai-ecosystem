"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company } from "@/types/ecosystem";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export interface CompanyInfoCardProps {
  company: Company | null;
  layerId: string;
  onClose: () => void;
}

export function CompanyInfoCard({ company, layerId, onClose }: CompanyInfoCardProps) {
  useEffect(() => {
    if (!company) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [company, onClose]);

  return (
    <AnimatePresence>
      {company && (
        <motion.div
          key={company.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute bottom-6 right-6 z-50 w-[260px] animate-fade-in-up"
          style={{ animationDuration: "0.3s" }}
        >
          <div className="rounded-xl border border-white/8 bg-black/90 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <CompanyLogo name={company.name} logo={company.logo} size={32} />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-white/25">
                    {company.category}
                  </p>
                  <h4 className="mt-0.5 text-sm font-medium text-white truncate">
                    {company.name}
                  </h4>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 text-white/15 hover:text-white/50 transition"
                aria-label="Close"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-white/35 line-clamp-3">
              {company.description}
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              {company.valuation && company.valuation !== "N/A" && company.valuation !== "$NaNB" && (
                <div>
                  <dt className="text-white/20">Funding</dt>
                  <dd className="text-white/55">{company.valuation}</dd>
                </div>
              )}
              {company.founded && (
                <div>
                  <dt className="text-white/20">Founded</dt>
                  <dd className="text-white/55">{company.founded}</dd>
                </div>
              )}
              {company.headquarters && (
                <div className="col-span-2">
                  <dt className="text-white/20">HQ</dt>
                  <dd className="text-white/55">{company.headquarters}</dd>
                </div>
              )}
            </dl>

            <div className="mt-2 flex flex-wrap gap-1">
              {company.layers?.map((lid) => (
                <span
                  key={lid}
                  className="rounded-full border border-white/8 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/25"
                >
                  {lid}
                </span>
              ))}
            </div>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-[11px] text-white/25 hover:text-white/60 transition"
              >
                Visit site →
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
