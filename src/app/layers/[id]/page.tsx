import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getAllLayerIds, getLayerById } from "@/lib/data";
import { LayerDetailClient } from "@/components/layers/LayerDetailClient";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllLayerIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const layer = getLayerById(id);
  if (!layer) return { title: "Layer not found" };
  return {
    title: layer.name,
    description: layer.description,
  };
}

export default async function LayerPage({ params }: PageProps) {
  const { id } = await params;
  const layer = getLayerById(id);
  if (!layer) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← Back to ecosystem
      </Link>
      <Suspense fallback={<LoadingSpinner />}>
        <LayerDetailClient layer={layer} />
      </Suspense>
    </div>
  );
}
