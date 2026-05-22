import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">Page not found.</p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-6 py-3 font-medium text-white"
      >
        Back home
      </Link>
    </div>
  );
}
