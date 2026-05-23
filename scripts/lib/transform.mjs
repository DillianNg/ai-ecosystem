/** @typedef {import('./types.mjs').AuditConfig} AuditConfig */

import {
  normalizeCategoriesField,
  normalizeSlug,
  normalizeTagsField,
  normalizeUrl,
  splitList,
} from "./normalize.mjs";

/**
 * @param {string} raw
 * @param {Set<string>} knownIds
 * @param {AuditConfig} config
 */
function normalizeSlugReferences(raw, knownIds, config) {
  const items = splitList(raw);
  const result = [];

  for (const item of items) {
    const asSlug = normalizeSlug(item);
    const candidates = [item, asSlug, item.toLowerCase()];
    const match = candidates.find((c) => knownIds.has(c));
    if (match) {
      result.push(match);
    } else if (!config.stripBrokenSlugReferences) {
      result.push(asSlug || item);
    }
  }

  return [...new Set(result)];
}

/**
 * @param {Record<string, string>} row
 * @param {AuditConfig} config
 * @param {Set<string>} knownIds
 */
export function transformRow(row, config, knownIds) {
  const id = normalizeSlug(row.id ?? "");
  const layerId = (row.layer_id ?? row.layer ?? "").trim();
  const logoRaw = (row.logo ?? row.logo_url ?? "").trim();
  const logo = logoRaw ? normalizeUrl(logoRaw, config) || logoRaw : "";

  const categoryRaw = row.category ?? row.categories ?? "";
  const categories = normalizeCategoriesField(categoryRaw, config);
  const primaryCategory = categories[0] ?? "";

  const tags = normalizeTagsField(row.tags ?? "", config);

  const relations = {};
  for (const column of config.slugReferenceColumns) {
    if (!row[column]) continue;
    const parent = column === "parent_company" || column === "acquired_by";
    const value = normalizeSlugReferences(row[column], knownIds, config);
    if (value.length === 0) continue;
    relations[column] = parent ? value[0] : value;
  }

  const social = {};
  const twitter = normalizeUrl(row.twitter ?? "", config);
  const linkedin = normalizeUrl(row.linkedin ?? "", config);
  const github = normalizeUrl(row.github ?? "", config);
  if (twitter) social.twitter = twitter;
  if (linkedin) social.linkedin = linkedin;
  if (github) social.github = github;

  const foundedRaw = (row.founded ?? "").trim();
  const founded =
    foundedRaw && foundedRaw.toLowerCase() !== "n/a"
      ? Number.parseInt(foundedRaw, 10)
      : null;

  const company = {
    id,
    name: (row.name ?? "").trim(),
    layerId,
    description: (row.description ?? "").trim(),
    logo,
    website: normalizeUrl(row.website ?? "", config),
    valuation: (row.valuation ?? "N/A").trim() || "N/A",
    founded: Number.isFinite(founded) ? founded : null,
    category: primaryCategory,
    categories,
    tags,
  };

  if (Object.keys(relations).length > 0) {
    company.relations = relations;
  }
  if (Object.keys(social).length > 0) {
    company.social = social;
  }

  return company;
}

/**
 * @param {import('./types.mjs').CompanyRecord[]} companies
 */
export function buildFrontendOutput(companies, meta = {}) {
  /** @type {Record<string, import('./types.mjs').CompanyRecord[]>} */
  const byLayer = {};

  for (const company of companies) {
    const layer = company.layerId || "uncategorized";
    if (!byLayer[layer]) byLayer[layer] = [];
    byLayer[layer].push(company);
  }

  for (const layer of Object.keys(byLayer)) {
    byLayer[layer].sort((a, b) => a.name.localeCompare(b.name));
  }

  const indexById = Object.fromEntries(companies.map((c, i) => [c.id, i]));

  return {
    meta: {
      ...meta,
      totalCompanies: companies.length,
      layers: Object.keys(byLayer).sort(),
    },
    companies,
    byLayer,
    indexById,
  };
}
