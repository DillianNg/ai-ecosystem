/**
 * @typedef {Object} AuditConfig
 * @property {string[]} requiredFields
 * @property {string[]} optionalFields
 * @property {string[]} slugReferenceColumns
 * @property {string[]} urlFields
 * @property {string[]} listColumns
 * @property {string[]} layerIds
 * @property {Record<string, string>} categoryAliases
 * @property {Record<string, string>} tagAliases
 * @property {boolean} stripBrokenSlugReferences
 * @property {boolean} validateLogoUrls
 * @property {RegExp} idPattern
 */

/**
 * @typedef {Object} CompanyRecord
 * @property {string} id
 * @property {string} name
 * @property {string} layerId
 * @property {string} description
 * @property {string} logo
 * @property {string} website
 * @property {string} valuation
 * @property {number | null} founded
 * @property {string} category
 * @property {string[]} categories
 * @property {string[]} tags
 * @property {Record<string, string | string[]>} [relations]
 * @property {Record<string, string>} [social]
 */

export {};
