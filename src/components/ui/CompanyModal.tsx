"use client";

import { useEffect } from "react";
import type { Company } from "@/types/ecosystem";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";

interface CompanyModalProps {
  company: Company | null;
  layerId: string;
  onClose: () => void;
}

export function CompanyModal({ company, layerId, onClose }: CompanyModalProps) {
  useEffect(() => {
    if (!company) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [company, onClose]);

  if (!company) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative z-10 w-full max-w-lg animate-in rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex gap-4">
          <CompanyLogo name={company.name} logo={company.logo} size={64} />
          <div className="min-w-0 flex-1 pr-6">
            <h2 id="company-modal-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {company.name}
            </h2>
            <p className="text-sm text-violet-500 dark:text-violet-400">{company.category}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {company.description}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500">Valuation</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{company.valuation}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Founded</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{company.founded}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Visit website
            <ExternalIcon />
          </a>
          {company.social?.twitter && (
            <a
              href={company.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Twitter
            </a>
          )}
          {company.social?.linkedin && (
            <a
              href={company.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              LinkedIn
            </a>
          )}
          <CopyLinkButton
            path={`/layers/${layerId}/?company=${company.id}`}
            label="Share"
          />
        </div>
      </div>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
