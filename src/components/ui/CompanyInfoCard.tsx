"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company } from "@/types/ecosystem";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { LAYER_ACCENTS } from "@/lib/constants";

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

  const accent = LAYER_ACCENTS[layerId] ?? LAYER_ACCENTS.infrastructure;

  return (
    <AnimatePresence>
      {company && (
        <motion.div
          key={company.id}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed bottom-6 right-6 z-50 w-80"
        >
          <div className="relative rounded-2xl border border-white/10 bg-black/90 p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            {/* Subtle layer color top accent */}
            <div className={`absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r ${accent.from} ${accent.to} opacity-60`} />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-3 pr-6">
              <CompanyLogo name={company.name} logo={company.logo} size={44} />
              <div className="min-w-0">
                <h3 className="truncate font-bold text-zinc-50">{company.name}</h3>
                <p className={`text-xs font-medium ${accent.text}`}>{company.category}</p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-400">{company.description}</p>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-zinc-600">Valuation</dt>
                <dd className="font-semibold text-zinc-200">{company.valuation}</dd>
              </div>
              <div>
                <dt className="text-zinc-600">Founded</dt>
                <dd className="font-semibold text-zinc-200">{company.founded}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 rounded-lg bg-gradient-to-r ${accent.from} ${accent.to} px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90`}
              >
                Visit site ↗
              </a>
              {company.social?.twitter && (
                <a
                  href={company.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                >
                  X
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
