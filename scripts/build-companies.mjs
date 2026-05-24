#!/usr/bin/env node

/**
 * CSV → ecosystem.json pipeline
 * Makes data/companies.csv the SINGLE SOURCE OF TRUTH.
 * Outputs: src/data/ecosystem.json + public/data.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "data/companies.csv");
const ECOSYSTEM_OUT = join(ROOT, "src/data/ecosystem.json");
const PUBLIC_OUT = join(ROOT, "public/data.json");
const GENERATED_OUT = join(ROOT, "data/generated/companies.json");

// ── Category → Layer mapping ──
const CATEGORY_TO_LAYER = {
  hardware:        "infrastructure",
  infrastructure:  "infrastructure",
  foundation_model:"model",
  research:        "model",
  applications:    "application",
  agent_framework: "application",
  developer_tools: "integration",
  data_platform:   "monetization",
  safety:          "security",
};

// ── Layer metadata (preserved from existing) ──
const LAYER_META = {
  infrastructure: {
    name: "Infrastructure",
    description: "Hardware, cloud, and compute platforms powering AI workloads.",
    fullDescription: "GPU/TPU silicon, hyperscale clouds, networking, and storage systems that form the physical substrate of AI.",
    fundingStatus: "$124B", fundingPercent: 85, companyCount: 0, growthTrend: 42,
  },
  model: {
    name: "Model",
    description: "Foundation models, research labs, and model training.",
    fullDescription: "Organizations building and training frontier language, vision, and multimodal models.",
    fundingStatus: "$89B", fundingPercent: 72, companyCount: 0, growthTrend: 68,
  },
  application: {
    name: "Application",
    description: "AI-powered products and vertical applications.",
    fullDescription: "Companies applying AI to specific domains: code, creative, legal, healthcare, agents, and consumer products.",
    fundingStatus: "$45B", fundingPercent: 55, companyCount: 0, growthTrend: 85,
  },
  integration: {
    name: "Integration",
    description: "Developer tools, orchestration, data platforms, and MLOps.",
    fullDescription: "Frameworks, vector DBs, labeling, experiment tracking, and the connective tissue of AI systems.",
    fundingStatus: "$28B", fundingPercent: 48, companyCount: 0, growthTrend: 62,
  },
  security: {
    name: "Security",
    description: "AI safety, alignment research, and guardrails.",
    fullDescription: "Organizations focused on making AI systems safe, interpretable, and aligned with human values.",
    fundingStatus: "$5B", fundingPercent: 22, companyCount: 0, growthTrend: 120,
  },
  monetization: {
    name: "Monetization",
    description: "Data labeling, marketplace, and AI business models.",
    fullDescription: "Platforms converting AI capability into revenue through data, marketplaces, and novel business models.",
    fundingStatus: "$12B", fundingPercent: 35, companyCount: 0, growthTrend: 55,
  },
};

// ── Approach mapping by layer ──
const LAYER_APPROACHES = {
  infrastructure: ["value-chain", "infrastructure-data"],
  model:          ["value-chain", "infrastructure-data", "human-in-loop"],
  application:    ["value-chain", "human-in-loop"],
  integration:    ["value-chain", "infrastructure-data", "human-in-loop"],
  security:       ["value-chain", "infrastructure-data", "human-in-loop"],
  monetization:   ["value-chain"],
};

// ── CSV Parser ──
function parseCsv(text) {
  const content = text.replace(/^\uFEFF/, "");
  if (!content.trim()) return [];
  const rows = []; let row = []; let field = ""; let inQ = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQ) {
      if (c === '"') { if (content[i+1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') { inQ = true; }
    else if (c === ',') { row.push(field); field = ""; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && content[i+1] === '\n') i++;
      row.push(field); field = "";
      if (row.some(s => s.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); if (row.some(s => s.trim())) rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(cells => {
    const rec = {};
    headers.forEach((h, i) => { rec[h] = (cells[i] ?? "").trim(); });
    return rec;
  });
}

// ── Slug generator ──
function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Logo resolver ──
function resolveLogo(row) {
  // 1. Explicit logo_url from CSV
  if (row.logo_url && row.logo_url !== "N/A") return row.logo_url;
  // 2. Clearbit from website domain
  if (row.website) {
    try {
      const domain = new URL(row.website.startsWith("http") ? row.website : `https://${row.website}`).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {}
  }
  // 3. UI Avatars fallback
  const name = row.company_name || row.name || "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=fff&size=128`;
}

// ── Split pipe-delimited ──
function splitPipes(s) {
  return (s || "").split("|").map(x => x.trim()).filter(Boolean);
}

// ── Transform CSV row → Company ──
function transformRow(row) {
  const slug = row.slug || toSlug(row.company_name || row.name || "");
  const primaryCat = (row.primary_category || "").trim();
  const layerId = CATEGORY_TO_LAYER[primaryCat] || "application";
  const subCats = splitPipes(row.sub_categories);
  const tags = [primaryCat, ...subCats].filter(Boolean);

  // Build connections from CSV relationship columns
  const connections = [
    ...splitPipes(row.partnerships),
    ...splitPipes(row.integrations),
    ...splitPipes(row.competitors),
  ].filter(Boolean);

  const social = {};
  if (row.twitter_url) social.twitter = row.twitter_url;
  if (row.linkedin_url) social.linkedin = row.linkedin_url;
  if (row.github_url) social.github = row.github_url;

  const founded = parseInt(row.founded_year, 10);

  return {
    id: slug,
    name: row.company_name || row.name || "",
    logo: resolveLogo(row),
    description: row.description_en || row.description || "",
    valuation: row.total_funding_usd
      ? `$${(parseInt(row.total_funding_usd, 10) / 1e9).toFixed(1)}B`
      : "N/A",
    founded: isFinite(founded) ? founded : null,
    website: row.website || "",
    category: primaryCat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    layers: [layerId],
    approaches: LAYER_APPROACHES[layerId] || ["value-chain"],
    connections,
    tags,
    social: Object.keys(social).length > 0 ? social : undefined,
    // Extra rich fields
    products: splitPipes(row.products),
    fundingStage: row.funding_stage || "",
    employees: row.employees_range || "",
    headquarters: [row.headquarters_city, row.headquarters_country].filter(Boolean).join(", "),
  };
}

// ── Main ──
function main() {
  const csvText = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    console.error("[build-companies] CSV is empty or unreadable");
    process.exit(1);
  }

  console.log(`[build-companies] Parsed ${rows.length} rows from CSV`);

  // Dedupe by slug
  const seen = new Set();
  const companies = [];
  for (const row of rows) {
    const c = transformRow(row);
    if (!c.id || seen.has(c.id)) continue;
    seen.add(c.id);
    companies.push(c);
  }

  console.log(`[build-companies] ${companies.length} unique companies after dedup`);

  // Group by layer
  const layerMap = {};
  for (const c of companies) {
    const lid = c.layers[0];
    if (!layerMap[lid]) layerMap[lid] = [];
    layerMap[lid].push(c);
  }

  // Build ecosystem.json structure
  const layerOrder = ["infrastructure", "model", "application", "integration", "security", "monetization"];
  const layers = layerOrder.map(lid => {
    const meta = LAYER_META[lid] || LAYER_META.application;
    const layerCompanies = (layerMap[lid] || []).sort((a, b) => a.name.localeCompare(b.name));
    return {
      id: lid,
      name: meta.name,
      description: meta.description,
      fullDescription: meta.fullDescription,
      fundingStatus: meta.fundingStatus,
      fundingPercent: meta.fundingPercent,
      companyCount: layerCompanies.length,
      growthTrend: meta.growthTrend,
      companies: layerCompanies,
      news: [],
    };
  });

  const ecosystem = {
    meta: {
      title: "AI Ecosystem Map",
      description: "Interactive mapping of the AI technology stack.",
      lastUpdated: new Date().toISOString().split("T")[0],
    },
    layers,
  };

  // Write outputs
  writeFileSync(ECOSYSTEM_OUT, JSON.stringify(ecosystem, null, 2), "utf8");
  writeFileSync(PUBLIC_OUT, JSON.stringify(ecosystem, null, 2), "utf8");
  mkdirSync(dirname(GENERATED_OUT), { recursive: true });
  writeFileSync(GENERATED_OUT, JSON.stringify({
    meta: { generatedAt: new Date().toISOString(), source: "data/companies.csv", totalCompanies: companies.length },
    companies,
    byLayer: layerMap,
  }, null, 2), "utf8");

  // Summary
  for (const l of layers) {
    console.log(`  ${l.id}: ${l.companyCount} companies`);
  }
  console.log(`[build-companies] Done. Wrote ecosystem.json + data.json`);
}

main();
