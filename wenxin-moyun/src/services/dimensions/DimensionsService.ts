/**
 * DimensionsService - Single Source of Truth for VULCA Dimensions
 *
 * Loads and provides access to all dimension definitions from dimensions.json.
 * Implements singleton pattern for efficient caching.
 *
 * @module services/dimensions
 * @version 1.0.0
 */

// ============= Type Definitions =============

export interface Dimension6D {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  legacyMappings: {
    ModelMetrics: string | string[] | null;
    VULCAScore6D: string;
  };
  range: [number, number];
  weight: number;
  childDimensions: number[];
}

export interface Dimension47D {
  index: number;
  id: string;
  name: string;
  name_zh: string;
  category: string;
  description: string;
  weight: number;
}

export interface DimensionCategory {
  id: string;
  name: string;
  name_zh: string;
  range: [number, number];
  color: string;
  description: string;
}

export interface CulturalPerspective {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  coreValues: string[];
  representativePersonas: string[];
}

export interface L1L5Level {
  level: number;
  name: string;
  name_zh: string;
  description: string;
  avgVLMScore: number;
  exampleTasks: string[];
}

export interface Persona {
  id: string;
  name: string;
  name_zh: string;
  culture: string;
  focus: string;
  era: string;
}

export interface DimensionsData {
  $schema: string;
  version: string;
  lastUpdated: string;
  framework: {
    name: string;
    fullName: string;
    paper: string;
    doi: string;
    github: string;
  };
  dimensions6D: Record<string, Dimension6D>;
  dimensions47D: Dimension47D[];
  categories: Record<string, DimensionCategory>;
  culturalPerspectives: CulturalPerspective[];
  l1l5Framework: Record<string, L1L5Level>;
  personas: Persona[];
}

export interface ExportMetadata {
  frameworkVersion: string;
  frameworkName: string;
  paper: string;
  doi: string;
  exportedAt: string;
  schemaUrl: string;
}

// ============= Service Implementation =============

class DimensionsService {
  private static instance: DimensionsService;
  private data: DimensionsData | null = null;
  private loadingPromise: Promise<DimensionsData> | null = null;
  private loadError: Error | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): DimensionsService {
    if (!DimensionsService.instance) {
      DimensionsService.instance = new DimensionsService();
    }
    return DimensionsService.instance;
  }

  /**
   * Load dimensions data from JSON file
   * Returns cached data if already loaded
   */
  async load(): Promise<DimensionsData> {
    // Return cached data if available
    if (this.data) {
      return this.data;
    }

    // Return existing promise if loading is in progress
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start new load
    this.loadingPromise = this.fetchData();
    return this.loadingPromise;
  }

  private async fetchData(): Promise<DimensionsData> {
    try {
      const response = await fetch('/data/dimensions.json');
      if (!response.ok) {
        throw new Error(`Failed to load dimensions: ${response.status} ${response.statusText}`);
      }
      this.data = await response.json();
      this.loadError = null;
      return this.data!;
    } catch (error) {
      this.loadError = error instanceof Error ? error : new Error(String(error));
      // Re-throw to let caller handle
      throw this.loadError;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.data !== null;
  }

  /**
   * Get the last load error, if any
   */
  getLoadError(): Error | null {
    return this.loadError;
  }

  /**
   * Force reload data from server
   */
  async reload(): Promise<DimensionsData> {
    this.data = null;
    this.loadingPromise = null;
    this.loadError = null;
    return this.load();
  }

  // ============= Version & Metadata =============

  /**
   * Get framework version
   */
  getVersion(): string {
    return this.data?.version || '0.0.0';
  }

  /**
   * Get framework information
   */
  getFramework() {
    return this.data?.framework || null;
  }

  /**
   * Get export metadata for trusted exports
   */
  getExportMetadata(): ExportMetadata {
    return {
      frameworkVersion: this.data?.version || '0.0.0',
      frameworkName: this.data?.framework?.name || 'VULCA',
      paper: this.data?.framework?.paper || '',
      doi: this.data?.framework?.doi || '',
      exportedAt: new Date().toISOString(),
      schemaUrl: `https://vulcaart.art/schemas/dimensions-v${this.data?.version || '1.0.0'}.json`,
    };
  }

  // ============= 6D Dimensions =============

  /**
   * Get a 6D dimension by ID
   */
  getDimension6D(id: string): Dimension6D | undefined {
    return this.data?.dimensions6D[id];
  }

  /**
   * Get all 6D dimensions
   */
  getAllDimensions6D(): Record<string, Dimension6D> {
    return this.data?.dimensions6D || {};
  }

  /**
   * Get 6D dimension IDs
   */
  getDimension6DKeys(): string[] {
    return Object.keys(this.data?.dimensions6D || {});
  }

  // ============= 47D Dimensions =============

  /**
   * Get a 47D dimension by index or ID
   */
  getDimension47D(indexOrId: number | string): Dimension47D | undefined {
    if (!this.data) return undefined;

    if (typeof indexOrId === 'number') {
      return this.data.dimensions47D[indexOrId];
    }

    // Handle "dim_X" format
    if (indexOrId.startsWith('dim_')) {
      const index = parseInt(indexOrId.replace('dim_', ''), 10);
      if (!isNaN(index) && index >= 0 && index < this.data.dimensions47D.length) {
        return this.data.dimensions47D[index];
      }
    }

    // Find by ID
    return this.data.dimensions47D.find(d => d.id === indexOrId);
  }

  /**
   * Get all 47D dimensions
   */
  getAllDimensions47D(): Dimension47D[] {
    return this.data?.dimensions47D || [];
  }

  /**
   * Get dimension label (name) from any key format
   */
  getDimensionLabel(key: string): string {
    const dim = this.getDimension47D(key);
    if (dim) return dim.name;

    // Fallback: format the key nicely
    return this.formatDimensionName(key);
  }

  /**
   * Format dimension name from various formats to Title Case
   */
  formatDimensionName(text: string): string {
    if (!text) return '';

    // If already has proper spacing, return as-is
    if (text.includes(' ') && !text.includes('_')) {
      return text;
    }

    // Handle snake_case
    if (text.includes('_')) {
      return text
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    // Handle camelCase/PascalCase
    return text
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1 $2')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ============= Categories =============

  /**
   * Get a category by ID
   */
  getCategory(id: string): DimensionCategory | undefined {
    return this.data?.categories[id];
  }

  /**
   * Get all categories
   */
  getAllCategories(): Record<string, DimensionCategory> {
    return this.data?.categories || {};
  }

  /**
   * Get category for a dimension
   */
  getDimensionCategory(dimensionKey: string): DimensionCategory | undefined {
    const dim = this.getDimension47D(dimensionKey);
    if (dim) {
      return this.data?.categories[dim.category];
    }
    return undefined;
  }

  // ============= Cultural Perspectives =============

  /**
   * Get a cultural perspective by ID
   */
  getCulturalPerspective(id: string): CulturalPerspective | undefined {
    return this.data?.culturalPerspectives.find(p => p.id === id);
  }

  /**
   * Get all cultural perspectives
   */
  getAllCulturalPerspectives(): CulturalPerspective[] {
    return this.data?.culturalPerspectives || [];
  }

  // ============= L1-L5 Framework =============

  /**
   * Get L1-L5 level by key (e.g., "L1", "L2")
   */
  getL1L5Level(level: string): L1L5Level | undefined {
    return this.data?.l1l5Framework[level];
  }

  /**
   * Get all L1-L5 levels
   */
  getAllL1L5Levels(): Record<string, L1L5Level> {
    return this.data?.l1l5Framework || {};
  }

  // ============= Personas =============

  /**
   * Get a persona by ID
   */
  getPersona(id: string): Persona | undefined {
    return this.data?.personas.find(p => p.id === id);
  }

  /**
   * Get all personas
   */
  getAllPersonas(): Persona[] {
    return this.data?.personas || [];
  }

  /**
   * Get personas by culture
   */
  getPersonasByCulture(culture: string): Persona[] {
    return (this.data?.personas || []).filter(p => p.culture === culture);
  }

  // ============= Legacy Mapping =============

  /**
   * Map legacy score key to unified 6D key
   * @param source - 'ModelMetrics' or 'VULCAScore6D'
   * @param key - The legacy key to map
   * @returns The unified 6D key, or null if not found
   */
  mapLegacyScore(source: 'ModelMetrics' | 'VULCAScore6D', key: string): string | null {
    if (!this.data) return null;

    for (const [dimId, dim] of Object.entries(this.data.dimensions6D)) {
      const mapping = dim.legacyMappings[source];
      if (mapping === key) {
        return dimId;
      }
      if (Array.isArray(mapping) && mapping.includes(key)) {
        return dimId;
      }
    }
    return null;
  }

  /**
   * Convert ModelMetrics to VULCA 6D scores
   */
  convertModelMetricsToVULCA(metrics: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};

    // Direct mappings
    if (metrics.creativity !== undefined) result.creativity = metrics.creativity;
    if (metrics.emotion !== undefined) result.emotion = metrics.emotion;

    // Aggregated mappings
    if (metrics.rhythm !== undefined && metrics.composition !== undefined) {
      result.technique = (metrics.rhythm + metrics.composition) / 2;
    }
    if (metrics.narrative !== undefined && metrics.cultural !== undefined) {
      result.context = (metrics.narrative + metrics.cultural) / 2;
    }

    // Default values for unmapped dimensions
    if (result.innovation === undefined) result.innovation = 50;
    if (result.impact === undefined) result.impact = 50;

    return result;
  }
}

// Export singleton instance
export const dimensionsService = DimensionsService.getInstance();

// Export class for testing
export { DimensionsService };

// Default export
export default dimensionsService;
