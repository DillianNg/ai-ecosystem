import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 mb-4">404</p>
        <h1 className="text-3xl font-thin text-white mb-6">Page not found</h1>
        <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition tracking-widest uppercase">
          ← Back to ecosystem
        </Link>
      </div>
    </div>
  );
}
