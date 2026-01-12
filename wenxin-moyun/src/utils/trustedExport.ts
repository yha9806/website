/**
 * Trusted Export Utility
 *
 * All export data is wrapped with version metadata for reproducibility.
 * Supports multiple citation formats: BibTeX, RIS, CSL JSON, APA, MLA
 *
 * @module utils/trustedExport
 * @version 1.0.0
 */

import { dimensionsService, type ExportMetadata } from '../services/dimensions';
import { VULCA_VERSION, getExportMetadata as getVersionMetadata } from '../config/version';

// ============= Export Envelope Types =============

export interface ExportEnvelope<T> {
  $schema: string;
  metadata: {
    version: string;
    framework: string;
    exportedAt: string;
    source: string;
    checksum?: string;
  };
  data: T;
}

export interface Citation {
  key: string;
  title: string;
  authors: string[];
  booktitle: string;
  year: number;
  doi?: string;
  arxiv?: string;
  url?: string;
  pages?: string;
  volume?: string;
  publisher?: string;
}

export type CitationFormat = 'bibtex' | 'ris' | 'csl-json' | 'apa' | 'mla' | 'chicago' | 'harvard';

// ============= Export Envelope Functions =============

/**
 * Create a trusted export envelope with metadata
 * @param data - The data to export
 * @param source - Source identifier (e.g., 'vulca-demo', 'leaderboard')
 * @returns Export envelope with metadata
 */
export async function createTrustedExport<T>(
  data: T,
  source: string
): Promise<ExportEnvelope<T>> {
  // Ensure dimensions are loaded for metadata
  let metadata: ExportMetadata;
  try {
    await dimensionsService.load();
    metadata = dimensionsService.getExportMetadata();
  } catch {
    // Use central version config as fallback
    const versionMeta = getVersionMetadata();
    metadata = {
      frameworkVersion: versionMeta.frameworkVersion,
      frameworkName: 'VULCA',
      paper: '',
      doi: '',
      exportedAt: versionMeta.exportedAt,
      schemaUrl: `https://vulcaart.art/schemas/dimensions-v${VULCA_VERSION.framework}.json`,
    };
  }

  const envelope: ExportEnvelope<T> = {
    $schema: metadata.schemaUrl,
    metadata: {
      version: metadata.frameworkVersion,
      framework: metadata.frameworkName,
      exportedAt: metadata.exportedAt,
      source,
    },
    data,
  };

  // Add checksum for object data
  if (typeof data === 'object' && data !== null) {
    try {
      envelope.metadata.checksum = await generateChecksum(JSON.stringify(data));
    } catch {
      // Checksum generation failed, continue without
    }
  }

  return envelope;
}

/**
 * Generate SHA-256 checksum (first 16 chars)
 */
async function generateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/**
 * Download trusted JSON export
 */
export function downloadTrustedJSON<T>(
  envelope: ExportEnvelope<T>,
  filename: string
): void {
  const content = JSON.stringify(envelope, null, 2);
  downloadFile(content, filename, 'application/json;charset=utf-8');
}

/**
 * Generic file download utility
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// ============= Citation Format Generators =============

/**
 * Generate BibTeX citation
 */
export function generateBibTeX(citation: Citation): string {
  const lines = [
    `@inproceedings{${citation.key},`,
    `  title = {${escapeLatex(citation.title)}},`,
    `  author = {${citation.authors.map(escapeLatex).join(' and ')}},`,
    `  booktitle = {${escapeLatex(citation.booktitle)}},`,
    `  year = {${citation.year}},`,
  ];

  if (citation.pages) {
    lines.push(`  pages = {${citation.pages}},`);
  }
  if (citation.volume) {
    lines.push(`  volume = {${citation.volume}},`);
  }
  if (citation.doi) {
    lines.push(`  doi = {${citation.doi}},`);
  }
  if (citation.url) {
    lines.push(`  url = {${citation.url}},`);
  }
  if (citation.publisher) {
    lines.push(`  publisher = {${escapeLatex(citation.publisher)}},`);
  }

  // Remove trailing comma from last line
  const lastLine = lines[lines.length - 1];
  lines[lines.length - 1] = lastLine.slice(0, -1);
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate RIS citation
 */
export function generateRIS(citation: Citation): string {
  const lines = ['TY  - CONF'];

  citation.authors.forEach(author => {
    lines.push(`AU  - ${author}`);
  });

  lines.push(`TI  - ${citation.title}`);
  lines.push(`BT  - ${citation.booktitle}`);
  lines.push(`PY  - ${citation.year}`);

  if (citation.pages) {
    lines.push(`SP  - ${citation.pages}`);
  }
  if (citation.volume) {
    lines.push(`VL  - ${citation.volume}`);
  }
  if (citation.doi) {
    lines.push(`DO  - ${citation.doi}`);
  }
  if (citation.url) {
    lines.push(`UR  - ${citation.url}`);
  }
  if (citation.publisher) {
    lines.push(`PB  - ${citation.publisher}`);
  }

  lines.push('ER  - ');

  return lines.join('\n');
}

/**
 * Generate CSL JSON citation
 */
export function generateCSLJSON(citation: Citation): object {
  const csl: Record<string, unknown> = {
    id: citation.key,
    type: 'paper-conference',
    title: citation.title,
    author: citation.authors.map(name => {
      const parts = name.trim().split(' ');
      const family = parts.pop() || '';
      const given = parts.join(' ');
      return { family, given };
    }),
    'container-title': citation.booktitle,
    issued: {
      'date-parts': [[citation.year]],
    },
  };

  if (citation.doi) {
    csl.DOI = citation.doi;
  }
  if (citation.url) {
    csl.URL = citation.url;
  }
  if (citation.pages) {
    csl.page = citation.pages;
  }
  if (citation.volume) {
    csl.volume = citation.volume;
  }
  if (citation.publisher) {
    csl.publisher = citation.publisher;
  }

  return csl;
}

/**
 * Generate APA 7th edition citation
 */
export function generateAPA(citation: Citation): string {
  // Format authors: Last, F. M., Last, F. M., & Last, F. M.
  const formatAuthor = (name: string): string => {
    const parts = name.trim().split(' ');
    const lastName = parts.pop() || '';
    const initials = parts.map(p => `${p.charAt(0)}.`).join(' ');
    return `${lastName}, ${initials}`;
  };

  let authors = '';
  if (citation.authors.length === 1) {
    authors = formatAuthor(citation.authors[0]);
  } else if (citation.authors.length === 2) {
    authors = `${formatAuthor(citation.authors[0])} & ${formatAuthor(citation.authors[1])}`;
  } else {
    const allButLast = citation.authors.slice(0, -1).map(formatAuthor);
    const last = formatAuthor(citation.authors[citation.authors.length - 1]);
    authors = `${allButLast.join(', ')}, & ${last}`;
  }

  let result = `${authors} (${citation.year}). ${citation.title}. In ${citation.booktitle}`;

  if (citation.pages) {
    result += ` (pp. ${citation.pages})`;
  }

  result += '.';

  if (citation.publisher) {
    result += ` ${citation.publisher}.`;
  }

  if (citation.doi) {
    result += ` https://doi.org/${citation.doi}`;
  }

  return result;
}

/**
 * Generate MLA 9th edition citation
 */
export function generateMLA(citation: Citation): string {
  // Format: Last, First, et al. "Title." Container, Publisher, Year, Pages.
  const formatAuthor = (name: string, first: boolean): string => {
    const parts = name.trim().split(' ');
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ');
    return first ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
  };

  let authors = '';
  if (citation.authors.length === 1) {
    authors = formatAuthor(citation.authors[0], true);
  } else if (citation.authors.length === 2) {
    authors = `${formatAuthor(citation.authors[0], true)}, and ${formatAuthor(citation.authors[1], false)}`;
  } else {
    authors = `${formatAuthor(citation.authors[0], true)}, et al`;
  }

  let result = `${authors}. "${citation.title}." ${citation.booktitle}`;

  if (citation.publisher) {
    result += `, ${citation.publisher}`;
  }

  result += `, ${citation.year}`;

  if (citation.pages) {
    result += `, pp. ${citation.pages}`;
  }

  result += '.';

  return result;
}

/**
 * Generate Chicago 17th edition citation (Author-Date)
 */
export function generateChicago(citation: Citation): string {
  // Similar to APA but with some differences
  const formatAuthor = (name: string, first: boolean): string => {
    const parts = name.trim().split(' ');
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ');
    return first ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
  };

  let authors = '';
  if (citation.authors.length === 1) {
    authors = formatAuthor(citation.authors[0], true);
  } else if (citation.authors.length === 2) {
    authors = `${formatAuthor(citation.authors[0], true)} and ${formatAuthor(citation.authors[1], false)}`;
  } else if (citation.authors.length <= 10) {
    const allButLast = citation.authors.slice(0, -1).map((a, i) => formatAuthor(a, i === 0));
    const last = formatAuthor(citation.authors[citation.authors.length - 1], false);
    authors = `${allButLast.join(', ')}, and ${last}`;
  } else {
    authors = `${formatAuthor(citation.authors[0], true)} et al.`;
  }

  let result = `${authors}. ${citation.year}. "${citation.title}." In ${citation.booktitle}`;

  if (citation.pages) {
    result += `, ${citation.pages}`;
  }

  result += '.';

  if (citation.publisher) {
    result += ` ${citation.publisher}.`;
  }

  if (citation.doi) {
    result += ` https://doi.org/${citation.doi}.`;
  }

  return result;
}

/**
 * Generate Harvard citation
 */
export function generateHarvard(citation: Citation): string {
  // Format: Author(s) (Year) 'Title', in Conference Name. Publisher.
  const formatAuthor = (name: string): string => {
    const parts = name.trim().split(' ');
    const lastName = parts.pop() || '';
    const initials = parts.map(p => `${p.charAt(0)}.`).join('');
    return `${lastName}, ${initials}`;
  };

  let authors = '';
  if (citation.authors.length === 1) {
    authors = formatAuthor(citation.authors[0]);
  } else if (citation.authors.length === 2) {
    authors = `${formatAuthor(citation.authors[0])} and ${formatAuthor(citation.authors[1])}`;
  } else if (citation.authors.length <= 3) {
    const allButLast = citation.authors.slice(0, -1).map(formatAuthor);
    authors = `${allButLast.join(', ')} and ${formatAuthor(citation.authors[citation.authors.length - 1])}`;
  } else {
    authors = `${formatAuthor(citation.authors[0])} et al.`;
  }

  let result = `${authors} (${citation.year}) '${citation.title}', in ${citation.booktitle}`;

  if (citation.pages) {
    result += `, pp. ${citation.pages}`;
  }

  result += '.';

  if (citation.publisher) {
    result += ` ${citation.publisher}.`;
  }

  if (citation.doi) {
    result += ` Available at: https://doi.org/${citation.doi}`;
  }

  return result;
}

/**
 * Generate citation in specified format
 */
export function generateCitation(citation: Citation, format: CitationFormat): string {
  switch (format) {
    case 'bibtex':
      return generateBibTeX(citation);
    case 'ris':
      return generateRIS(citation);
    case 'csl-json':
      return JSON.stringify(generateCSLJSON(citation), null, 2);
    case 'apa':
      return generateAPA(citation);
    case 'mla':
      return generateMLA(citation);
    case 'chicago':
      return generateChicago(citation);
    case 'harvard':
      return generateHarvard(citation);
    default:
      return generateBibTeX(citation);
  }
}

/**
 * Get file extension for citation format
 */
export function getCitationFileExtension(format: CitationFormat): string {
  const extensions: Record<CitationFormat, string> = {
    bibtex: '.bib',
    ris: '.ris',
    'csl-json': '.json',
    apa: '.txt',
    mla: '.txt',
    chicago: '.txt',
    harvard: '.txt',
  };
  return extensions[format] || '.txt';
}

/**
 * Download citation in specified format
 */
export function downloadCitation(citation: Citation, format: CitationFormat): void {
  const content = generateCitation(citation, format);
  const extension = getCitationFileExtension(format);
  const filename = `${citation.key}${extension}`;
  const mimeType = format === 'csl-json' ? 'application/json' : 'text/plain';
  downloadFile(content, filename, mimeType);
}

// ============= Utility Functions =============

/**
 * Escape special LaTeX characters
 */
function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// ============= Predefined Citations =============

export const VULCA_CITATIONS: Record<string, Citation> = {
  vulca_emnlp2025: {
    key: 'yu2025vulca',
    title: 'VULCA: Evaluating Vision-Language Models in Culturally Situated Art Critiques',
    authors: ['Haorui Yu', 'Yang Zhao', 'Yijia Chu', 'Qiufeng Yi'],
    booktitle: 'Findings of the Association for Computational Linguistics: EMNLP 2025',
    year: 2025,
    doi: '10.18653/v1/2025.findings-emnlp.103',
    publisher: 'Association for Computational Linguistics',
  },
  vulca_bench: {
    key: 'yu2025vulcabench',
    title: 'VULCA-BENCH: A Benchmark for Evaluating Vision-Language Models in Cross-Cultural Art Understanding',
    authors: ['Haorui Yu', 'Yang Zhao', 'Yijia Chu', 'Qiufeng Yi'],
    booktitle: 'Proceedings of the 2025 Conference on Empirical Methods in Natural Language Processing',
    year: 2025,
    doi: '10.18653/v1/2025.emnlp-main.xxx',
    publisher: 'Association for Computational Linguistics',
  },
  symbolic_shortcuts: {
    key: 'yu2025symbols',
    title: 'Seeing Symbols, Missing Cultures: Symbolic Shortcuts in Vision-Language Models for Cultural Understanding',
    authors: ['Haorui Yu', 'Qiufeng Yi'],
    booktitle: 'Proceedings of the 6th Workshop on Gender Bias in Natural Language Processing (GeBNLP)',
    year: 2025,
    publisher: 'Association for Computational Linguistics',
  },
};
