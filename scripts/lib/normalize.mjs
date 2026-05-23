/** @typedef {import('./types.mjs').AuditConfig} AuditConfig */

/**
 * @param {string} value
 */
export function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {string} raw
 * @param {AuditConfig} config
 */
export function normalizeUrl(raw, config) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (lower === "n/a" || lower === "na" || lower === "-") return "";

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/\//, "")}`;
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (config.urlFields.includes("website")) {
      parsed.hash = "";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

/**
 * @param {string} raw
 * @param {Record<string, string>} aliases
 */
export function normalizeCategory(raw, aliases) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const key = trimmed.toLowerCase();
  if (aliases[key]) return aliases[key];

  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * @param {string} raw
 * @param {Record<string, string>} aliases
 */
export function normalizeTag(raw, aliases) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const key = trimmed.toLowerCase();
  return aliases[key] ?? key.replace(/\s+/g, "-");
}

/**
 * @param {string} raw
 */
export function splitList(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * @param {string} raw
 * @param {AuditConfig} config
 */
export function normalizeCategoriesField(raw, config) {
  const parts = splitList(raw);
  const unique = new Set();
  for (const part of parts.length ? parts : [raw]) {
    const normalized = normalizeCategory(part, config.categoryAliases);
    if (normalized) unique.add(normalized);
  }
  return [...unique];
}

/**
 * @param {string} raw
 * @param {AuditConfig} config
 */
export function normalizeTagsField(raw, config) {
  const parts = splitList(raw);
  const unique = new Set();
  for (const part of parts) {
    const normalized = normalizeTag(part, config.tagAliases);
    if (normalized) unique.add(normalized);
  }
  return [...unique];
}
