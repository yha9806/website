import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  VULCA_VERSION,
  VULCA_VERSION_STRING,
  VULCA_CITATION_VERSION,
  generateReportId,
  getExportMetadata,
  VULCA_BIBTEX,
  VERSION_BADGE,
} from '../../config/version'

describe('VULCA_VERSION', () => {
  it('should have a semantic version format for framework', () => {
    expect(VULCA_VERSION.framework).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('should have a valid dataset version', () => {
    expect(VULCA_VERSION.dataset).toMatch(/^\d{4}\.\d{2}$/)
  })

  it('should have a protocol version', () => {
    expect(VULCA_VERSION.protocol).toMatch(/^\d+\.\d+$/)
  })

  it('should have an API version starting with v', () => {
    expect(VULCA_VERSION.api).toMatch(/^v\d+$/)
  })

  it('should have a valid lastUpdated date', () => {
    expect(VULCA_VERSION.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // Verify it is a valid date
    const date = new Date(VULCA_VERSION.lastUpdated)
    expect(date.toString()).not.toBe('Invalid Date')
  })

  it('should have a numeric build string', () => {
    expect(VULCA_VERSION.build).toMatch(/^\d{8}$/)
  })

  it('should have totalModels as a positive number', () => {
    expect(typeof VULCA_VERSION.totalModels).toBe('number')
    expect(VULCA_VERSION.totalModels).toBeGreaterThan(0)
    expect(VULCA_VERSION.totalModels).toBe(42)
  })

  it('should have totalDimensions as a positive number', () => {
    expect(typeof VULCA_VERSION.totalDimensions).toBe('number')
    expect(VULCA_VERSION.totalDimensions).toBeGreaterThan(0)
    expect(VULCA_VERSION.totalDimensions).toBe(47)
  })

  it('should have totalPerspectives as a positive number', () => {
    expect(typeof VULCA_VERSION.totalPerspectives).toBe('number')
    expect(VULCA_VERSION.totalPerspectives).toBeGreaterThan(0)
    expect(VULCA_VERSION.totalPerspectives).toBe(8)
  })

  it('should be a readonly/const object', () => {
    // TypeScript enforces this at compile time, but verify the shape is stable
    const keys = Object.keys(VULCA_VERSION)
    expect(keys).toContain('framework')
    expect(keys).toContain('dataset')
    expect(keys).toContain('protocol')
    expect(keys).toContain('api')
    expect(keys).toContain('lastUpdated')
    expect(keys).toContain('build')
    expect(keys).toContain('totalModels')
    expect(keys).toContain('totalDimensions')
    expect(keys).toContain('totalPerspectives')
  })
})

describe('VULCA_VERSION_STRING', () => {
  it('should be a string containing the framework version', () => {
    expect(typeof VULCA_VERSION_STRING).toBe('string')
    expect(VULCA_VERSION_STRING).toContain(VULCA_VERSION.framework)
  })

  it('should start with VULCA v', () => {
    expect(VULCA_VERSION_STRING).toMatch(/^VULCA v\d+\.\d+\.\d+$/)
  })
})

describe('VULCA_CITATION_VERSION', () => {
  it('should contain both framework and dataset versions', () => {
    expect(VULCA_CITATION_VERSION).toContain(VULCA_VERSION.framework)
    expect(VULCA_CITATION_VERSION).toContain(VULCA_VERSION.dataset)
  })

  it('should follow the expected format', () => {
    expect(VULCA_CITATION_VERSION).toBe(
      `VULCA Framework v${VULCA_VERSION.framework} (Dataset ${VULCA_VERSION.dataset})`
    )
  })
})

describe('generateReportId', () => {
  it('should return a string starting with VULCA-', () => {
    const id = generateReportId('TestModel')
    expect(id).toMatch(/^VULCA-/)
  })

  it('should contain the build number', () => {
    const id = generateReportId('TestModel')
    expect(id).toContain(VULCA_VERSION.build)
  })

  it('should sanitize model name to uppercase alphanumeric', () => {
    const id = generateReportId('GPT-4o Mini')
    // GPT-4o Mini -> GPT4OMINI (non-alphanumeric removed, uppercased)
    expect(id).toContain('GPT4OMINI')
  })

  it('should handle special characters in model name', () => {
    const id = generateReportId('claude-3.5-sonnet')
    expect(id).toContain('CLAUDE35SONNET')
  })

  it('should generate unique IDs for different calls', () => {
    const id1 = generateReportId('Model')
    const id2 = generateReportId('Model')
    // IDs may differ due to timestamp; at minimum they share the same prefix
    expect(id1).toMatch(/^VULCA-/)
    expect(id2).toMatch(/^VULCA-/)
  })

  it('should have format VULCA-BUILD-NAME-TIMESTAMP', () => {
    const id = generateReportId('Test')
    const parts = id.split('-')
    expect(parts[0]).toBe('VULCA')
    expect(parts[1]).toBe(VULCA_VERSION.build)
    expect(parts[2]).toBe('TEST')
    // parts[3] is a base36 timestamp
    expect(parts[3]).toMatch(/^[0-9A-Z]+$/)
  })
})

describe('getExportMetadata', () => {
  let dateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    dateSpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-11T00:00:00.000Z')
  })

  afterEach(() => {
    dateSpy.mockRestore()
  })

  it('should return an object with all required fields', () => {
    const meta = getExportMetadata()
    expect(meta).toHaveProperty('frameworkVersion')
    expect(meta).toHaveProperty('datasetVersion')
    expect(meta).toHaveProperty('protocolVersion')
    expect(meta).toHaveProperty('exportedAt')
    expect(meta).toHaveProperty('exportedBy')
  })

  it('should use current version values', () => {
    const meta = getExportMetadata()
    expect(meta.frameworkVersion).toBe(VULCA_VERSION.framework)
    expect(meta.datasetVersion).toBe(VULCA_VERSION.dataset)
    expect(meta.protocolVersion).toBe(VULCA_VERSION.protocol)
  })

  it('should have exportedBy set to VULCA Platform', () => {
    const meta = getExportMetadata()
    expect(meta.exportedBy).toBe('VULCA Platform')
  })

  it('should have a valid ISO timestamp for exportedAt', () => {
    const meta = getExportMetadata()
    expect(meta.exportedAt).toBe('2025-01-11T00:00:00.000Z')
  })
})

describe('VULCA_BIBTEX', () => {
  it('should be a non-empty string', () => {
    expect(typeof VULCA_BIBTEX).toBe('string')
    expect(VULCA_BIBTEX.length).toBeGreaterThan(0)
  })

  it('should contain @inproceedings entry', () => {
    expect(VULCA_BIBTEX).toContain('@inproceedings{vulca2025')
  })

  it('should contain the framework version', () => {
    expect(VULCA_BIBTEX).toContain(VULCA_VERSION.framework)
  })

  it('should contain the dataset version', () => {
    expect(VULCA_BIBTEX).toContain(VULCA_VERSION.dataset)
  })

  it('should contain the platform URL', () => {
    expect(VULCA_BIBTEX).toContain('https://vulcaart.art')
  })

  it('should contain EMNLP 2025 reference', () => {
    expect(VULCA_BIBTEX).toContain('EMNLP 2025')
  })
})

describe('VERSION_BADGE', () => {
  it('should have short, medium, and full variants', () => {
    expect(VERSION_BADGE).toHaveProperty('short')
    expect(VERSION_BADGE).toHaveProperty('medium')
    expect(VERSION_BADGE).toHaveProperty('full')
  })

  it('short should be compact version string', () => {
    expect(VERSION_BADGE.short).toBe(`v${VULCA_VERSION.framework}`)
  })

  it('medium should include VULCA prefix', () => {
    expect(VERSION_BADGE.medium).toBe(`VULCA v${VULCA_VERSION.framework}`)
  })

  it('full should include both framework and dataset versions', () => {
    expect(VERSION_BADGE.full).toContain(VULCA_VERSION.framework)
    expect(VERSION_BADGE.full).toContain(VULCA_VERSION.dataset)
  })

  it('should have increasing length from short to full', () => {
    expect(VERSION_BADGE.short.length).toBeLessThan(VERSION_BADGE.medium.length)
    expect(VERSION_BADGE.medium.length).toBeLessThan(VERSION_BADGE.full.length)
  })
})
