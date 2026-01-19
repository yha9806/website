/**
 * VULCA Version Configuration
 *
 * Central configuration for version information used across the platform.
 * This ensures all exports, citations, and displays use consistent versioning.
 */

export const VULCA_VERSION = {
  // Framework version (semantic versioning)
  framework: '1.2.0',

  // Dataset version
  dataset: '2025.01',

  // Evaluation protocol version
  protocol: '1.0',

  // API version
  api: 'v1',

  // Last updated date
  lastUpdated: '2025-01-11',

  // Build/release identifier
  build: '20250111',

  // Total number of benchmark models
  totalModels: 42,

  // Total evaluation dimensions
  totalDimensions: 47,

  // Total cultural perspectives
  totalPerspectives: 8,
} as const;

/**
 * Full version string for display
 */
export const VULCA_VERSION_STRING = `VULCA v${VULCA_VERSION.framework}`;

/**
 * Citation version string (includes dataset version)
 */
export const VULCA_CITATION_VERSION = `VULCA Framework v${VULCA_VERSION.framework} (Dataset ${VULCA_VERSION.dataset})`;

/**
 * Generate a unique report ID with version
 */
export function generateReportId(modelName: string): string {
  const sanitizedName = modelName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `VULCA-${VULCA_VERSION.build}-${sanitizedName}-${timestamp}`;
}

/**
 * Generate export metadata
 */
export function getExportMetadata() {
  return {
    frameworkVersion: VULCA_VERSION.framework,
    datasetVersion: VULCA_VERSION.dataset,
    protocolVersion: VULCA_VERSION.protocol,
    exportedAt: new Date().toISOString(),
    exportedBy: 'VULCA Platform',
  };
}

/**
 * BibTeX citation template
 */
export const VULCA_BIBTEX = `@inproceedings{vulca2025,
  title     = {VULCA: A 47-Dimension Framework for Evaluating Cultural and Artistic Understanding in AI},
  author    = {VULCA Team},
  booktitle = {Proceedings of EMNLP 2025},
  year      = {2025},
  version   = {${VULCA_VERSION.framework}},
  dataset   = {${VULCA_VERSION.dataset}},
  url       = {https://vulcaart.art}
}`;

/**
 * Version badge text for UI display
 */
export const VERSION_BADGE = {
  short: `v${VULCA_VERSION.framework}`,
  medium: `VULCA v${VULCA_VERSION.framework}`,
  full: `VULCA Framework v${VULCA_VERSION.framework} | Dataset ${VULCA_VERSION.dataset}`,
};
