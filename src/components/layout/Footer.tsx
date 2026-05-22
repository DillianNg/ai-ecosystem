import { getBundledData } from "@/lib/data";

export function Footer() {
  const { meta } = getBundledData();

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
        <p>
          AI Ecosystem Map — inspired by Sequoia Capital AI layers research. Data
          illustrative; edit <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">public/data.json</code> on GitHub.
        </p>
        <p className="mt-2">Last updated: {meta.lastUpdated}</p>
      </div>
    </footer>
  );
}
