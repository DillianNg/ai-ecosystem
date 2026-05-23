/** @typedef {import('./types.mjs').AuditConfig} AuditConfig */

import { normalizeSlug } from "./normalize.mjs";

/**
 * @param {string} url
 */
export function isValidHttpUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, string>} row
 * @param {number} rowNumber
 * @param {AuditConfig} config
 * @param {Set<string>} knownIds
 */
export function validateRow(row, rowNumber, config, knownIds) {
  const errors = [];
  const warnings = [];

  for (const field of config.requiredFields) {
    const value = row[field] ?? row[field.replace(/_id$/, "")] ?? "";
    if (!String(value).trim()) {
      errors.push({ row: rowNumber, field, message: `Missing required field "${field}"` });
    }
  }

  const id = (row.id ?? "").trim();
  if (id && !config.idPattern.test(id)) {
    errors.push({
      row: rowNumber,
      field: "id",
      message: `Invalid id slug "${id}" (use lowercase letters, numbers, hyphens)`,
    });
  }

  const layerId = (row.layer_id ?? row.layer ?? "").trim();
  if (layerId && !config.layerIds.includes(layerId)) {
    errors.push({
      row: rowNumber,
      field: "layer_id",
      message: `Unknown layer_id "${layerId}"`,
    });
  }

  const founded = (row.founded ?? "").trim();
  if (founded && founded.toLowerCase() !== "n/a") {
    const year = Number.parseInt(founded, 10);
    if (Number.isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
      warnings.push({
        row: rowNumber,
        field: "founded",
        message: `Suspicious founded year "${founded}"`,
      });
    }
  }

  if (config.validateLogoUrls) {
    const logo = (row.logo ?? row.logo_url ?? "").trim();
    if (logo && !isValidHttpUrl(logo)) {
      errors.push({
        row: rowNumber,
        field: "logo",
        message: `Invalid logo URL "${logo}"`,
      });
    }
  }

  for (const field of config.urlFields) {
    const value = (row[field] ?? "").trim();
    if (value && !isValidHttpUrl(value) && !["n/a", "na", "-"].includes(value.toLowerCase())) {
      const normalized = value.startsWith("http") ? value : `https://${value}`;
      if (!isValidHttpUrl(normalized)) {
        warnings.push({
          row: rowNumber,
          field,
          message: `Could not parse URL in "${field}"`,
        });
      }
    }
  }

  for (const column of config.slugReferenceColumns) {
    const raw = row[column];
    if (!raw) continue;
    const slugs = raw.split(/[|;]/).map((s) => s.trim()).filter(Boolean);
    for (const slug of slugs) {
      const normalized = normalizeSlug(slug);
      if (!knownIds.has(normalized) && !knownIds.has(slug.toLowerCase())) {
        warnings.push({
          row: rowNumber,
          field: column,
          message: `Broken slug reference "${slug}" (not in dataset)`,
          badSlug: slug,
        });
      }
    }
  }

  return { errors, warnings };
}
