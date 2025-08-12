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
            {/* Strengths */}
            {detail.analysis.strengths?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-green-700 mb-1">✅ Strengths</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {detail.analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {detail.analysis.weaknesses?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-red-700 mb-1">⚠️ Weaknesses</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {detail.analysis.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {detail.analysis.suggestions?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-blue-700 mb-1">💡 Suggestions</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {detail.analysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
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