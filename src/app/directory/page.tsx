import { Metadata } from "next";
import { getAllCompanies } from "@/lib/ecosystem-utils";
import { getBundledData } from "@/lib/data";
import { DirectoryClient } from "@/components/directory/DirectoryClient";

export const metadata: Metadata = {
  title: "Directory",
  description: "Full directory of all AI ecosystem companies.",
};

export default function DirectoryPage() {
  const { layers } = getBundledData();
  const companies = getAllCompanies();
  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/25 mb-3">
          Full database
        </p>
        <h1 className="text-4xl font-thin text-white sm:text-6xl">Directory</h1>
        <p className="mt-4 text-sm text-white/35 max-w-lg">
          Every company in the AI ecosystem, searchable and filterable by layer, category, or approach.
        </p>
      </div>
      <DirectoryClient companies={companies} layers={layers} />
    </div>
  );
}
