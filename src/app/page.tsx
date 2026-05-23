import Link from "next/link";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getBundledData } from "@/lib/data";

export default function HomePage() {
  const { meta, layers } = getBundledData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-12 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
          Sequoia-inspired AI stack
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {meta.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:mx-0">
          {meta.description} Explore six layers—from infrastructure to monetization—with
          funding flows, companies, and news.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link
            href="/heatmap/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            View heatmap
          </Link>
        </div>
      </section>

      <DashboardView layers={layers} />
    </div>
  );
}
