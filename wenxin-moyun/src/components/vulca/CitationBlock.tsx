/**
 * CitationBlock - Multi-format Citation Component
 *
 * Displays citation information with tabbed format selection:
 * - BibTeX, RIS, APA, MLA, Chicago, Harvard
 * - Copy and download functionality
 * - External links to paper/github/arxiv
 *
 * @module components/vulca/CitationBlock
 */

import { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, BookOpen, Github, Download } from 'lucide-react';
import { IOSButton } from '../ios/core/IOSButton';
import {
  generateBibTeX,
  generateRIS,
  generateAPA,
  generateMLA,
  generateChicago,
  generateHarvard,
  downloadCitation,
  type Citation,
  type CitationFormat,
} from '../../utils/trustedExport';
import { VULCA_VERSION } from '../../config/version';

type TabFormat = 'bibtex' | 'ris' | 'apa' | 'mla' | 'chicago' | 'harvard';

interface CitationBlockProps {
  /** BibTeX string (legacy support) or Citation object */
  bibtex?: string;
  /** Citation object for multi-format support */
  citation?: Citation;
  /** Paper title */
  title?: string;
  /** Conference/venue name */
  conference?: string;
  /** Publication year */
  year?: string;
  /** External links */
  links?: {
    paper?: string;
    github?: string;
    arxiv?: string;
  };
  /** Show format tabs (default: true) */
  showTabs?: boolean;
  /** Compact mode without tabs */
  compact?: boolean;
}

const formatLabels: Record<TabFormat, string> = {
  bibtex: 'BibTeX',
  ris: 'RIS',
  apa: 'APA',
  mla: 'MLA',
  chicago: 'Chicago',
  harvard: 'Harvard',
};

export function CitationBlock({
  bibtex,
  citation,
  title = 'VULCA: Vision-Understanding and Language-based Cultural Adaptability',
  conference = 'EMNLP 2025 Findings',
  year = VULCA_VERSION.dataset.split('.')[0],
  links = {},
  showTabs = true,
  compact = false,
}: CitationBlockProps) {
  const [activeTab, setActiveTab] = useState<TabFormat>('bibtex');
  const [copied, setCopied] = useState(false);

  // Create citation object from props if not provided
  const citationObj: Citation = useMemo(() => {
    if (citation) return citation;
    return {
      key: 'yang2025vulca',
      title,
      authors: ['Haonan Yang', 'Yu Cheng', 'Wenxin Team'],
      booktitle: conference,
      year: parseInt(year) || 2025,
      doi: '10.18653/v1/2025.findings-emnlp.103',
    };
  }, [citation, title, conference, year]);

  // Generate formatted citations
  const formattedCitations = useMemo(() => {
    return {
      bibtex: bibtex || generateBibTeX(citationObj),
      ris: generateRIS(citationObj),
      apa: generateAPA(citationObj),
      mla: generateMLA(citationObj),
      chicago: generateChicago(citationObj),
      harvard: generateHarvard(citationObj),
    };
  }, [bibtex, citationObj]);

  const currentContent = formattedCitations[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    downloadCitation(citationObj, activeTab as CitationFormat);
  };

  // Compact mode for inline usage
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <BookOpen className="w-4 h-4 text-blue-500" />
        <span className="text-gray-600 dark:text-gray-400">
          {citationObj.authors[0]} et al. ({citationObj.year})
        </span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cite This Work
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
          {citation?.booktitle || conference}
        </span>
      </div>

      {/* Paper Title */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
        {citation?.title || title}
      </p>

      {/* Format Tabs */}
      {showTabs && (
        <div className="flex flex-wrap gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(Object.keys(formatLabels) as TabFormat[]).map(format => (
            <button
              key={format}
              onClick={() => setActiveTab(format)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === format
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {formatLabels[format]}
            </button>
          ))}
        </div>
      )}

      {/* Citation Content */}
      <div className="relative">
        <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto font-mono whitespace-pre-wrap">
          {currentContent}
        </pre>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow"
            aria-label={copied ? 'Copied!' : 'Copy citation'}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow"
            aria-label="Download citation"
            title="Download citation file"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* DOI */}
      {citationObj.doi && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          DOI:{' '}
          <a
            href={`https://doi.org/${citationObj.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {citationObj.doi}
          </a>
        </div>
      )}

      {/* Links */}
      {(links.paper || links.github || links.arxiv) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {links.paper && (
            <a href={links.paper} target="_blank" rel="noopener noreferrer">
              <IOSButton variant="secondary" size="sm" className="gap-1.5">
                <ExternalLink className="w-4 h-4" />
                Paper
              </IOSButton>
            </a>
          )}
          {links.github && (
            <a href={links.github} target="_blank" rel="noopener noreferrer">
              <IOSButton variant="secondary" size="sm" className="gap-1.5">
                <Github className="w-4 h-4" />
                Code
              </IOSButton>
            </a>
          )}
          {links.arxiv && (
            <a href={links.arxiv} target="_blank" rel="noopener noreferrer">
              <IOSButton variant="secondary" size="sm" className="gap-1.5">
                <ExternalLink className="w-4 h-4" />
                arXiv
              </IOSButton>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default CitationBlock;
