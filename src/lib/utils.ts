import type { Company, CompanySort, CompanySortOrder } from "@/types/ecosystem";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function parseValuation(value: string): number {
  const normalized = value.replace(/[$,]/g, "").trim().toUpperCase();
  const match = normalized.match(/^([\d.]+)([KMBT]?)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    "": 1,
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
  };
  return num * (multipliers[unit] ?? 1);
}

export function sortCompanies(
  companies: Company[],
  sortBy: CompanySort,
  order: CompanySortOrder
): Company[] {
  const sorted = [...companies].sort((a, b) => {
    if (sortBy === "alphabet") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "category") {
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    }
    return parseValuation(b.valuation) - parseValuation(a.valuation);
  });
  return order === "asc" ? sorted.reverse() : sorted;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function withBasePath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
