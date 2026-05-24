"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/directory/", label: "Directory" },
  { href: "/view/",      label: "View" },
  { href: "/heatmap/",   label: "Heatmap" },
  { href: "/blog/",      label: "Blog" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-8">
      <Link
        href="/"
        className="text-sm font-medium tracking-widest text-white/70 transition hover:text-white uppercase"
      >
        AI Ecosystem
      </Link>

      <nav className="flex items-center gap-8">
        {NAV_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition ${
                active
                  ? "text-white"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
