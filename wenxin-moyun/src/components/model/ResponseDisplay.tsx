import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, MessageSquare, Lightbulb, Target } from 'lucide-react';
import { IOSCard, IOSCardHeader, IOSCardContent, IOSButton, EmojiIcon } from '../ios';

interface AnalysisData {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  highlights: string[];
}

interface ResponseDetail {
  dimension: string;
  test_id: string;
  prompt: string;
  response: string;
  score: number;
  analysis: AnalysisData;
  response_time: number;
  tokens_used: number;
}

interface ResponseDisplayProps {
  responses: ResponseDetail[];
  dimension: string;
}

const dimensionConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  rhythm: { color: 'text-purple-600', icon: MessageSquare, label: 'Rhythm & Meter' },
  composition: { color: 'text-blue-600', icon: Target, label: 'Composition' },
  narrative: { color: 'text-green-600', icon: MessageSquare, label: 'Narrative' },
  emotion: { color: 'text-red-600', icon: Star, label: 'Emotion' },
  creativity: { color: 'text-yellow-600', icon: Lightbulb, label: 'Creativity' },
  cultural: { color: 'text-indigo-600', icon: Star, label: 'Cultural' },
};

const ScoreAnnotation: React.FC<{ score: number; text: string }> = ({ score, text }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <span className="relative group inline-block">
      <span className={`underline decoration-dotted decoration-2 ${getScoreColor(score).split(' ')[1]} cursor-help`}>
        {text}
      </span>
      <span className={`absolute -top-8 left-0 px-2 py-1 text-xs rounded border ${getScoreColor(score)} opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10`}>
        得分: {score}
      </span>
    </span>
  );
};

const ResponseCard: React.FC<{ detail: ResponseDetail }> = ({ detail }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = dimensionConfig[detail.dimension] || dimensionConfig.rhythm;
  const Icon = config.icon;

  // Parse and highlight response
  const renderHighlightedResponse = () => {
    if (!detail.response) {
      return <p className="text-gray-500 italic">No response content</p>;
    }

    // Split response into segments and highlight based on analysis
    const highlights = detail.analysis?.highlights || [];
    let highlightedText = detail.response;

    // Highlight each segment mentioned in highlights
    highlights.forEach((highlight, index) => {
      if (highlight && highlightedText.includes(highlight)) {
        highlightedText = highlightedText.replace(
          highlight,
          `<mark class="bg-yellow-200 px-1 rounded" data-score="${85 + index * 2}">${highlight}</mark>`
        );
      }
    });

    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <IOSCard variant="flat" className="hover:shadow-lg transition-shadow">
      <IOSCardHeader
        title={detail.test_id}
        subtitle={detail.prompt}
        emoji={<Icon className={`w-5 h-5 ${config.color}`} />}
        action={
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBadgeColor(detail.score)}`}>
              {detail.score.toFixed(1)} pts
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        }
      />

      <IOSCardContent>
        {/* Response with highlights */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Model Response:</h5>
          {renderHighlightedResponse()}
        </div>

        {/* Performance metrics */}
        <div className="flex gap-4 text-xs text-gray-600 mb-3">
          <span>⏱️ {detail.response_time.toFixed(2)}s</span>
          <span>🔤 {detail.tokens_used} tokens</span>
        </div>

        {/* Expanded analysis */}
        {isExpanded && detail.analysis && (
          <div className="space-y-3 pt-3 border-t">
            {/* Highlights with iOS glass effect */}
            {(detail.analysis.highlights?.length > 0 || detail.analysis.strengths?.length > 0) && (
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                <div className="relative">
                  <h5 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center">
                    <EmojiIcon category="rating" name="star" size="xs" className="mr-1.5" />
                    Highlights & Strengths
                  </h5>
                  <ul className="space-y-1.5">
                    {(detail.analysis.highlights || detail.analysis.strengths || []).map((item, idx) => (
                      <li key={idx} className="text-xs text-green-600 dark:text-green-300 flex items-start">
                        <span className="mr-2 mt-0.5 text-green-500">✦</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Weaknesses with iOS glass effect */}
            {detail.analysis.weaknesses?.length > 0 && (
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                <div className="relative">
                  <h5 className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center">
                    <span className="mr-1.5">⚠️</span>
                    Areas for Improvement
                  </h5>
                  <ul className="space-y-1.5">
                    {detail.analysis.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-xs text-orange-600 dark:text-orange-300 flex items-start">
                        <span className="mr-2 mt-0.5 text-orange-500">◈</span>
                        <span className="leading-relaxed">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Suggestions with iOS glass effect */}
            {detail.analysis.suggestions?.length > 0 && (
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                <div className="relative">
                  <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center">
                    <span className="mr-1.5">💡</span>
                    Suggestions
                  </h5>
                  <ul className="space-y-1.5">
                    {detail.analysis.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-xs text-blue-600 dark:text-blue-300 flex items-start">
                        <span className="mr-2 mt-0.5 text-blue-500">◆</span>
                        <span className="leading-relaxed">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </IOSCardContent>
    </IOSCard>
  );
};

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ responses, dimension }) => {
  const config = dimensionConfig[dimension] || dimensionConfig.rhythm;
  const dimensionResponses = responses.filter(r => r.dimension === dimension);

  if (dimensionResponses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No test results for {config.label} dimension</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className={`text-lg font-semibold ${config.color}`}>
          {config.label} Test Results
        </h3>
        <span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
          {dimensionResponses.length} tests
        </span>
      </div>

      <div className="grid gap-4">
        {dimensionResponses.map((detail, index) => (
          <ResponseCard key={`${detail.test_id}-${index}`} detail={detail} />
        ))}
      </div>

      {/* Dimension summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Dimension Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-600">Average:</span>
            <span className="ml-1 font-semibold">
              {(dimensionResponses.reduce((acc, r) => acc + r.score, 0) / dimensionResponses.length).toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Highest:</span>
            <span className="ml-1 font-semibold">
              {Math.max(...dimensionResponses.map(r => r.score)).toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Lowest:</span>
            <span className="ml-1 font-semibold">
              {Math.min(...dimensionResponses.map(r => r.score)).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDisplay;