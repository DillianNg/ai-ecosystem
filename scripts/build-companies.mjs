#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { AUDIT_PATH, CSV_PATH, OUTPUT_PATH } from "./lib/paths.mjs";
import { parseCsv } from "./lib/csv-parser.mjs";
import { resolveAuditConfig } from "./lib/audit-config.mjs";
import { validateRow } from "./lib/validate.mjs";
import { dedupeById } from "./lib/dedupe.mjs";
import { transformRow, buildFrontendOutput } from "./lib/transform.mjs";
import { normalizeSlug } from "./lib/normalize.mjs";

function loadAudit() {
  try {
    const raw = readFileSync(AUDIT_PATH, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`Failed to parse ${AUDIT_PATH}: ${error.message}`);
  }
}

function loadCsv() {
  try {
    return readFileSync(CSV_PATH, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Missing CSV file: ${CSV_PATH}`);
    }
    throw error;
  }
}

function normalizeHeaderKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const k = key.trim().toLowerCase().replace(/\s+/g, "_");
    normalized[k] = value;
    if (k === "layer") normalized.layer_id = value;
    if (k === "logo_url") normalized.logo = value;
    if (k === "categories" && !normalized.category) normalized.category = value;
  }
  if (normalized.id) {
    normalized.id = normalizeSlug(normalized.id);
  }
  return normalized;
}

function main() {
  const auditRaw = loadAudit();
  const config = resolveAuditConfig(auditRaw);

  const csvText = loadCsv();
  const { headers, rows: rawRows } = parseCsv(csvText);

  if (headers.length === 0 || rawRows.length === 0) {
    console.warn(`[build-companies] ${CSV_PATH} is empty — writing empty companies.json`);
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        buildFrontendOutput([], {
          generatedAt: new Date().toISOString(),
          source: "data/companies.csv",
          deduplicatedCount: 0,
        }),
        null,
        2
      ),
      "utf8"
    );
    return;
  }

  const rows = rawRows.map(normalizeHeaderKeys);
  const { rows: dedupedRows, duplicates } = dedupeById(rows);

  const knownIds = new Set(
    dedupedRows.map((row) => normalizeSlug(row.id ?? "")).filter(Boolean)
  );

  const allErrors = [];
  const allWarnings = [];

  dedupedRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const { errors, warnings } = validateRow(row, rowNumber, config, knownIds);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });

  if (allErrors.length > 0) {
    console.error("[build-companies] Validation failed:");
    for (const err of allErrors) {
      console.error(`  row ${err.row} · ${err.field}: ${err.message}`);
    }
    process.exit(1);
  }

  if (allWarnings.length > 0) {
    console.warn(`[build-companies] ${allWarnings.length} warning(s):`);
    for (const warn of allWarnings.slice(0, 20)) {
      console.warn(`  row ${warn.row} · ${warn.field}: ${warn.message}`);
    }
    if (allWarnings.length > 20) {
      console.warn(`  … and ${allWarnings.length - 20} more`);
    }
  }

  const companies = dedupedRows
    .map((row) => transformRow(row, config, knownIds))
    .filter((company) => company.id && company.name);

  const output = buildFrontendOutput(companies, {
    generatedAt: new Date().toISOString(),
    source: "data/companies.csv",
    deduplicatedCount: duplicates.length,
    validation: {
      warnings: allWarnings.length,
      auditIssuesRecorded: auditRaw?.summary?.total_issues ?? null,
    },
  });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8");

  console.log(
    `[build-companies] Wrote ${companies.length} companies → ${OUTPUT_PATH}` +
      (duplicates.length ? ` (removed ${duplicates.length} duplicate id(s))` : "")
  );
}

main();
