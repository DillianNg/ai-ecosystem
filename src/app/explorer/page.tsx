import { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { getAllCompanies } from "@/lib/ecosystem-utils";
import { ExplorerClient } from "@/components/explorer/ExplorerClient";

export const metadata: Metadata = {
  title: "Company Explorer",
  description: "Browse and search all AI ecosystem companies across every layer and approach.",
};

export default function ExplorerPage() {
  const { layers } = getBundledData();
  const companies = getAllCompanies();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
          Full database
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Company Explorer
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Search, filter, and sort every company in the AI ecosystem across all six layers and architecture approaches.
        </p>
      </section>

      <ExplorerClient companies={companies} layers={layers} />
    </div>
  );
}
