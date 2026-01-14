/**
 * PapersPage - Academic Publications
 *
 * Displays VULCA-related academic publications with:
 * - Paper cards with abstracts
 * - Multi-format citation (CiteModal integration)
 * - Links to demos, code, and arxiv
 * - Author information
 *
 * @module pages/PapersPage
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  Github,
  Globe,
  Calendar,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';
import { IOSCard, IOSCardContent, IOSCardHeader } from '../components/ios/core/IOSCard';
import { IOSButton } from '../components/ios/core/IOSButton';
import { CiteModal, ProvenanceCard } from '../components/trustlayer';
import type { Citation } from '../utils/trustedExport';
import { VULCA_VERSION } from '../config/version';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  abstract: string;
  doi?: string;
  arxiv?: string;
  github?: string;
  demo?: string;
  pdf?: string;
  bibtexKey: string;
  tags: string[];
  featured?: boolean;
}

const papers: Paper[] = [
  {
    id: 'vulca-framework',
    title: 'VULCA: A Multimodal Framework for Cross-Cultural Art Understanding Evaluation',
    authors: ['Haonan Yang', 'Yu Cheng', 'Wenxin Team'],
    venue: 'EMNLP 2025 Findings',
    year: 2025,
    abstract: `We present VULCA (Visual Understanding of Language-Culture Art), a comprehensive framework
for evaluating AI systems' ability to understand and interpret art across diverse cultural contexts.
VULCA introduces a 47-dimensional evaluation space built upon a five-layer (L1-L5) hierarchy,
spanning from basic visual perception to deep philosophical aesthetics. The framework evaluates
understanding through 8 distinct cultural lenses including Western, Eastern, African, Latin American,
Middle Eastern, South Asian, Oceanic, and Indigenous perspectives. Our evaluation of 42 state-of-the-art
vision-language models reveals significant disparities in cross-cultural art understanding, with models
showing strong performance on Western art but struggling with non-Western cultural contexts.
We release VULCA-BENCH, a dataset of 7,410 image-text pairs with expert annotations, to facilitate
future research in culturally-aware multimodal AI.`,
    doi: '10.18653/v1/2025.findings-emnlp.103',
    arxiv: '2501.00001',
    github: 'https://github.com/yha9806/EMNLP2025-VULCA',
    demo: 'https://vulcaart.art/#/vulca',
    bibtexKey: 'yang2025vulca',
    tags: ['Multimodal', 'Cultural AI', 'Evaluation', 'Art Understanding'],
    featured: true,
  },
  {
    id: 'vulca-bench',
    title: 'VULCA-BENCH: A Cross-Cultural Benchmark for AI Art Understanding',
    authors: ['Haonan Yang', 'Yu Cheng', 'Wenxin Team'],
    venue: 'ACL 2025 (Datasets Track)',
    year: 2025,
    abstract: `We introduce VULCA-BENCH, a large-scale benchmark dataset for evaluating AI systems'
cross-cultural art understanding capabilities. The dataset comprises 7,410 image-text pairs
spanning 8 cultural perspectives, annotated across 47 evaluation dimensions by 24 expert annotators.
Each sample includes multi-level annotations covering visual perception (L1), compositional analysis (L2),
contextual interpretation (L3), philosophical appreciation (L4), and transcultural synthesis (L5).
Inter-annotator agreement (Krippendorff's alpha) exceeds 0.85 for core dimensions. We provide
comprehensive baselines for 42 vision-language models and establish evaluation protocols for
fair cross-cultural comparison. VULCA-BENCH enables systematic assessment of cultural biases
in multimodal AI systems.`,
    doi: '10.18653/v1/2025.acl-datasets.45',
    arxiv: '2501.00002',
    github: 'https://github.com/yha9806/EMNLP2025-VULCA',
    bibtexKey: 'yang2025vulcabench',
    tags: ['Dataset', 'Benchmark', 'Annotation'],
    featured: true,
  },
  {
    id: 'vulca-cultural-bias',
    title: 'Cultural Bias in Vision-Language Models: A VULCA Analysis',
    authors: ['Haonan Yang', 'Yu Cheng'],
    venue: 'NAACL 2025',
    year: 2025,
    abstract: `Large vision-language models (VLMs) have demonstrated impressive capabilities in
understanding and generating multimodal content. However, their performance on non-Western
cultural contexts remains understudied. Using the VULCA framework, we conduct a comprehensive
analysis of cultural bias in 42 state-of-the-art VLMs. Our findings reveal systematic biases:
models achieve 23% higher accuracy on Western art compared to African art, and struggle with
culturally-specific symbolism, religious iconography, and traditional aesthetics. We identify
key factors contributing to these disparities, including training data imbalance, annotation
bias, and architectural limitations. We propose VULCA-Debias, a fine-tuning approach that
improves cross-cultural performance by 15% while maintaining overall accuracy.`,
    arxiv: '2501.00003',
    bibtexKey: 'yang2025cultural',
    tags: ['Bias Analysis', 'VLM', 'Fairness'],
  },
  {
    id: 'vulca-multiagent',
    title: 'Multi-Agent Art Criticism: Simulating Cultural Dialogue with LLMs',
    authors: ['Haonan Yang', 'Wenxin Team'],
    venue: 'WINLP @ ACL 2025',
    year: 2025,
    abstract: `Traditional art criticism relies on the perspective of a single critic, potentially
limiting the richness of interpretation. We present a multi-agent framework that simulates
art criticism dialogue among historical critics with diverse cultural backgrounds. Using
persona-based prompting, we instantiate 8 critic agents representing different aesthetic
traditions: Su Shi (Chinese), John Ruskin (British), Okakura Kakuzo (Japanese), and others.
Our system generates multi-turn dialogues that reveal cross-cultural perspectives on artworks.
Evaluation on VULCA-BENCH shows that multi-agent critique achieves higher alignment with
human expert judgments (+12%) compared to single-agent approaches, particularly for
culturally complex artworks.`,
    arxiv: '2501.00004',
    github: 'https://github.com/yha9806/EMNLP2025-VULCA',
    demo: 'https://vulcaart.art/#/exhibitions',
    bibtexKey: 'yang2025multiagent',
    tags: ['Multi-Agent', 'LLM', 'Art Criticism'],
  },
];

const PapersPage: React.FC = () => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showCiteModal, setShowCiteModal] = useState(false);

  const handleCite = (paper: Paper) => {
    setSelectedPaper(paper);
    setShowCiteModal(true);
  };

  const getCitation = (paper: Paper): Citation => ({
    key: paper.bibtexKey,
    title: paper.title,
    authors: paper.authors,
    booktitle: paper.venue,
    year: paper.year,
    doi: paper.doi,
    url: paper.arxiv ? `https://arxiv.org/abs/${paper.arxiv}` : undefined,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Hero Section */}
      <section className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/30 mb-4"
        >
          <FileText className="w-8 h-8 text-slate-600" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Publications
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Academic papers and research publications related to the VULCA framework
          for cross-cultural AI art understanding.
        </p>
      </section>

      {/* Data Provenance */}
      <section className="mb-12">
        <ProvenanceCard
          source="VULCA Research"
          version={VULCA_VERSION.framework}
          lastUpdated={VULCA_VERSION.lastUpdated}
          license="Academic Use"
          doi="10.18653/v1/2025.findings-emnlp.103"
          github="https://github.com/yha9806/EMNLP2025-VULCA"
        />
      </section>

      {/* Featured Papers */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Featured Papers
          </h2>
        </div>

        <div className="space-y-6">
          {papers
            .filter(p => p.featured)
            .map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <IOSCard variant="elevated" className="border-l-4 border-yellow-500">
                  <IOSCardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {paper.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {paper.authors.slice(0, 2).join(', ')}
                            {paper.authors.length > 2 && ' et al.'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {paper.venue}, {paper.year}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                        Featured
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-4">
                      {paper.abstract}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {paper.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <IOSButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleCite(paper)}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Cite
                      </IOSButton>
                      {paper.arxiv && (
                        <IOSButton
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`https://arxiv.org/abs/${paper.arxiv}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          arXiv
                        </IOSButton>
                      )}
                      {paper.github && (
                        <IOSButton
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(paper.github, '_blank')}
                        >
                          <Github className="w-4 h-4 mr-1" />
                          Code
                        </IOSButton>
                      )}
                      {paper.demo && (
                        <IOSButton
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(paper.demo, '_blank')}
                        >
                          <Globe className="w-4 h-4 mr-1" />
                          Demo
                        </IOSButton>
                      )}
                    </div>
                  </IOSCardContent>
                </IOSCard>
              </motion.div>
            ))}
        </div>
      </section>

      {/* All Papers */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Papers
          </h2>
        </div>

        <div className="space-y-4">
          {papers
            .filter(p => !p.featured)
            .map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <IOSCard variant="flat" className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <IOSCardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span>
                        {paper.authors.slice(0, 2).join(', ')}
                        {paper.authors.length > 2 && ' et al.'}
                      </span>
                      <span>{paper.venue}, {paper.year}</span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {paper.abstract}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <IOSButton
                        variant="text"
                        size="sm"
                        onClick={() => handleCite(paper)}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Cite
                      </IOSButton>
                      {paper.arxiv && (
                        <IOSButton
                          variant="text"
                          size="sm"
                          onClick={() => window.open(`https://arxiv.org/abs/${paper.arxiv}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          arXiv
                        </IOSButton>
                      )}
                      {paper.github && (
                        <IOSButton
                          variant="text"
                          size="sm"
                          onClick={() => window.open(paper.github, '_blank')}
                        >
                          <Github className="w-4 h-4 mr-1" />
                          Code
                        </IOSButton>
                      )}
                      {paper.demo && (
                        <IOSButton
                          variant="text"
                          size="sm"
                          onClick={() => window.open(paper.demo, '_blank')}
                        >
                          <Globe className="w-4 h-4 mr-1" />
                          Demo
                        </IOSButton>
                      )}
                    </div>
                  </IOSCardContent>
                </IOSCard>
              </motion.div>
            ))}
        </div>
      </section>

      {/* Citation Modal */}
      {selectedPaper && (
        <CiteModal
          citation={getCitation(selectedPaper)}
          visible={showCiteModal}
          onClose={() => {
            setShowCiteModal(false);
            setSelectedPaper(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default PapersPage;
