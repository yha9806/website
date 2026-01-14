/**
 * EvidenceSample Component
 *
 * Displays concrete evidence samples backing evaluation findings.
 * Shows actual model outputs with annotations and analysis.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Image, MessageSquare, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, Bookmark
} from 'lucide-react';
import { IOSCard, IOSCardHeader, IOSCardContent } from '../ios/core/IOSCard';
import { IOSButton } from '../ios/core/IOSButton';

interface Annotation {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
  position?: { start: number; end: number };
}

interface EvidenceSampleData {
  id: string;
  type: 'text' | 'image' | 'dialogue';
  dimension: string;
  score: number;
  prompt: string;
  response: string;
  imageUrl?: string;
  annotations: Annotation[];
  expertComment?: string;
  perspective?: string;
}

interface EvidenceSampleProps {
  sample: EvidenceSampleData;
  modelName: string;
  showAnnotations?: boolean;
  className?: string;
}

export function EvidenceSample({
  sample,
  modelName,
  showAnnotations = true,
  className = ''
}: EvidenceSampleProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5 text-amber-600" />;
      case 'dialogue':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (score >= 0.6) return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  const positiveAnnotations = sample.annotations.filter(a => a.type === 'positive');
  const negativeAnnotations = sample.annotations.filter(a => a.type === 'negative');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <IOSCard variant="flat" className="border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                {getTypeIcon(sample.type)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {sample.dimension}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {modelName} • {sample.perspective || 'Universal'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(sample.score)}`}>
                {(sample.score * 100).toFixed(0)}
              </span>
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-1 rounded transition-colors ${bookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <IOSCardContent>
          {/* Prompt */}
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Prompt
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
              {sample.prompt}
            </p>
          </div>

          {/* Response */}
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Model Response
            </h5>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
              {sample.imageUrl && (
                <img
                  src={sample.imageUrl}
                  alt="Evidence sample"
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}
              <p className={expanded ? '' : 'line-clamp-4'}>
                {sample.response}
              </p>
              {sample.response.length > 300 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-500 mt-2 hover:underline"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show full response
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Annotations */}
          {showAnnotations && sample.annotations.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Analysis
              </h5>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Positive */}
                {positiveAnnotations.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        Strengths ({positiveAnnotations.length})
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {positiveAnnotations.map((a, i) => (
                        <li key={i} className="text-xs text-green-700 dark:text-green-300 flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {a.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Negative */}
                {negativeAnnotations.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">
                        Issues ({negativeAnnotations.length})
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {negativeAnnotations.map((a, i) => (
                        <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {a.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expert Comment */}
          {sample.expertComment && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20 border border-blue-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
                  Expert Analysis
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-400 italic">
                "{sample.expertComment}"
              </p>
            </div>
          )}
        </IOSCardContent>
      </IOSCard>
    </motion.div>
  );
}

// Evidence Collection Component
interface EvidenceCollectionProps {
  samples: EvidenceSampleData[];
  modelName: string;
  title?: string;
  className?: string;
}

export function EvidenceCollection({
  samples,
  modelName,
  title = 'Evidence Samples',
  className = ''
}: EvidenceCollectionProps) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [visibleCount, setVisibleCount] = useState(3);

  const filteredSamples = samples.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'positive') return s.score >= 0.7;
    return s.score < 0.5;
  });

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="flex gap-2">
          {(['all', 'positive', 'negative'] as const).map((f) => (
            <IOSButton
              key={f}
              variant={filter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </IOSButton>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredSamples.slice(0, visibleCount).map((sample) => (
          <EvidenceSample
            key={sample.id}
            sample={sample}
            modelName={modelName}
          />
        ))}
      </div>

      {filteredSamples.length > visibleCount && (
        <div className="mt-4 text-center">
          <IOSButton
            variant="secondary"
            onClick={() => setVisibleCount(v => v + 3)}
          >
            Load More ({filteredSamples.length - visibleCount} remaining)
          </IOSButton>
        </div>
      )}
    </div>
  );
}

export default EvidenceSample;
