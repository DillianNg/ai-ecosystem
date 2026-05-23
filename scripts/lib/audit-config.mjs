/** @typedef {import('./types.mjs').AuditConfig} AuditConfig */

const DEFAULT_LAYER_IDS = [
  "infrastructure",
  "model",
  "application",
  "integration",
  "security",
  "monetization",
];

const DEFAULT_SLUG_REFERENCE_COLUMNS = [
  "parent_company",
  "subsidiaries",
  "acquisitions_made",
  "partnerships",
  "integrations",
  "competitors",
  "acquired_by",
];

const DEFAULT_LIST_COLUMNS = [
  "tags",
  "categories",
  "category",
  ...DEFAULT_SLUG_REFERENCE_COLUMNS,
];

/** @type {AuditConfig} */
export const DEFAULT_AUDIT_CONFIG = {
  requiredFields: ["id", "name", "layer_id", "description", "website"],
  optionalFields: [
    "logo",
    "logo_url",
    "valuation",
    "founded",
    "category",
    "tags",
    "twitter",
    "linkedin",
    "github",
    ...DEFAULT_SLUG_REFERENCE_COLUMNS,
  ],
  slugReferenceColumns: DEFAULT_SLUG_REFERENCE_COLUMNS,
  urlFields: ["website", "logo", "logo_url", "twitter", "linkedin", "github"],
  listColumns: DEFAULT_LIST_COLUMNS,
  layerIds: DEFAULT_LAYER_IDS,
  categoryAliases: {
    devtools: "DevTools",
    "dev-tools": "DevTools",
    "open-weights": "Open Weights",
    "open weights": "Open Weights",
    mlops: "MLOps",
    "model-security": "Model Security",
    "vector-db": "Vector DB",
    "vector db": "Vector DB",
    semiconductors: "Semiconductors",
    foundation: "Foundation",
  },
  tagAliases: {},
  stripBrokenSlugReferences: true,
  validateLogoUrls: true,
  idPattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

/**
 * @param {unknown} auditRaw
 * @returns {AuditConfig}
 */
export function resolveAuditConfig(auditRaw) {
  const fromFile =
    auditRaw &&
    typeof auditRaw === "object" &&
    "config" in auditRaw &&
    auditRaw.config &&
    typeof auditRaw.config === "object"
      ? auditRaw.config
      : {};

  return {
    ...DEFAULT_AUDIT_CONFIG,
    ...fromFile,
    categoryAliases: {
      ...DEFAULT_AUDIT_CONFIG.categoryAliases,
      ...(fromFile.categoryAliases ?? {}),
    },
    tagAliases: {
      ...DEFAULT_AUDIT_CONFIG.tagAliases,
      ...(fromFile.tagAliases ?? {}),
    },
    layerIds: fromFile.layerIds ?? DEFAULT_AUDIT_CONFIG.layerIds,
    slugReferenceColumns:
      fromFile.slugReferenceColumns ?? DEFAULT_AUDIT_CONFIG.slugReferenceColumns,
    listColumns: fromFile.listColumns ?? DEFAULT_AUDIT_CONFIG.listColumns,
    urlFields: fromFile.urlFields ?? DEFAULT_AUDIT_CONFIG.urlFields,
    requiredFields: fromFile.requiredFields ?? DEFAULT_AUDIT_CONFIG.requiredFields,
  };
}
