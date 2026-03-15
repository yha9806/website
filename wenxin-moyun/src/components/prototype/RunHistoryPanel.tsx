/**
 * RunHistoryPanel — displays recent pipeline runs in the Canvas sidebar.
 *
 * - Fetches from GET /api/v1/prototype/gallery?limit=10&sort_by=newest
 * - Each item shows tradition color block, subject, score, relative time
 * - Click expands inline details (no IOSSheet overlay)
 * - "Apply" button sets subject + tradition into the parent form
 */

import { useState, useCallback } from 'react';
import { useRunHistory } from '../../hooks/useRunHistory';
import type { RunHistoryItem } from '../../hooks/useRunHistory';
import { IOSCard, IOSCardContent, IOSButton } from '../ios';
import { API_BASE_URL } from '@/config/api';
import { formatTradition } from '@/utils/formatTradition';

/** Map tradition slugs to Art Professional palette colors. */
const TRADITION_COLORS: Record<string, string> = {
  chinese_xieyi: '#C87F4A',       // warm-copper
  chinese_gongbi: '#B8923D',      // amber-gold
  western_academic: '#334155',    // ink-gray
  western_classical: '#334155',
  japanese_wabi_sabi: '#5F8A50',  // sage-green
  japanese_traditional: '#5F8A50',
  japanese_ukiyoe: '#6B8E7A',
  japanese_nihonga: '#6B8E7A',
  persian_miniature: '#C65D4D',   // coral-red
  islamic_geometric: '#C65D4D',
  african_ubuntu: '#B8923D',      // amber-gold
  african_traditional: '#B8923D',
  indian_miniature: '#C87F4A',
  south_asian: '#C87F4A',
  korean_minhwa: '#6B8E7A',       // teal
  aboriginal_dreamtime: '#8B6E4E',
  western_modern: '#334155',
  default: '#9CA3AF',
};

function getTraditionColor(tradition: string): string {
  return TRADITION_COLORS[tradition] ?? TRADITION_COLORS.default;
}

/** Human-friendly relative time (e.g. "3m ago", "2h ago"). */
function relativeTime(epochSec: number): string {
  if (!epochSec) return '';
  const diffSec = Math.max(0, Math.floor(Date.now() / 1000 - epochSec));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

/** Truncate text to maxLen characters with ellipsis. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

/** L1-L5 dimension labels for the detail view. */
const L1_L5_LABELS: Record<string, string> = {
  visual_perception: 'L1 Visual',
  technical_analysis: 'L2 Technical',
  cultural_context: 'L3 Cultural',
  critical_interpretation: 'L4 Critical',
  philosophical_aesthetic: 'L5 Philosophical',
};

/** Resolve image URL — prepend API_BASE_URL for server-relative paths. */
function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${normalized}`;
}

/** Image fallback handler — replace broken image with placeholder. */
function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    parent.innerHTML = '<span class="text-3xl block text-center py-4">🎨</span>';
  }
}

interface RunHistoryPanelProps {
  onFork: (params: { subject: string; tradition: string }) => void;
}

export default function RunHistoryPanel({ onFork }: RunHistoryPanelProps) {
  const { items, loading, error, refresh } = useRunHistory(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleApply = useCallback((item: RunHistoryItem) => {
    onFork({ subject: item.subject, tradition: item.tradition });
    setExpandedId(null);
  }, [onFork]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <IOSCard variant="elevated" padding="md" animate={false}>
      <IOSCardContent>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Run History
          </h3>
          <button
            onClick={refresh}
            className="text-[10px] text-gray-400 hover:text-[#C87F4A] transition-colors"
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && items.length === 0 && (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="w-3 h-8 rounded bg-stone-200 dark:bg-stone-700 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 rounded bg-stone-200 dark:bg-stone-700" />
                  <div className="h-2 w-1/2 rounded bg-stone-200 dark:bg-stone-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <p className="text-xs text-[#C65D4D]">{error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">
            No past runs yet
          </p>
        )}

        {/* List with inline expand */}
        {items.length > 0 && (
          <ul className="space-y-1">
            {items.map(item => {
              const isExpanded = expandedId === item.id;
              const imgUrl = item.best_image_url ? resolveImageUrl(item.best_image_url) : '';

              return (
                <li key={item.id}>
                  {/* Summary row */}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={[
                      'w-full flex items-center gap-2 px-1.5 py-1.5 rounded-lg transition-colors text-left',
                      isExpanded
                        ? 'bg-stone-100 dark:bg-stone-800'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800',
                    ].join(' ')}
                  >
                    {/* Tradition color block */}
                    <div
                      className="w-2.5 h-8 rounded-sm shrink-0"
                      style={{ backgroundColor: getTraditionColor(item.tradition) }}
                    />
                    {/* Subject + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {truncate(item.subject, 36)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                        <span className="font-mono">
                          {item.overall != null ? item.overall.toFixed(2) : 'N/A'}
                        </span>
                        <span>{relativeTime(item.created_at)}</span>
                      </div>
                    </div>
                    {/* Expand indicator */}
                    <span className={[
                      'text-[10px] text-gray-400 transition-transform',
                      isExpanded ? 'rotate-180' : '',
                    ].join(' ')}>
                      ▾
                    </span>
                  </button>

                  {/* Inline expanded details */}
                  {isExpanded && (
                    <div className="mt-1 ml-4 mr-1 space-y-2 pb-2 border-l-2 border-stone-200 dark:border-stone-700 pl-3">
                      {/* Tradition + time + rounds */}
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-[#C87F4A] dark:text-[#DDA574]">
                          {formatTradition(item.tradition)}
                        </span>
                        {item.total_rounds > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{item.total_rounds} round{item.total_rounds !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>

                      {/* Image preview with fallback */}
                      {imgUrl && (
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img
                            src={imgUrl}
                            alt={item.subject}
                            className="w-full max-h-32 object-contain bg-stone-50 dark:bg-stone-900"
                            onError={handleImageError}
                          />
                        </div>
                      )}

                      {/* Overall score bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 w-10">Score</span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#C87F4A]"
                            style={{ width: `${Math.min((item.overall || 0) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-medium text-[#C87F4A] dark:text-[#DDA574] w-8 text-right">
                          {item.overall != null ? item.overall.toFixed(2) : 'N/A'}
                        </span>
                      </div>

                      {/* L1-L5 mini scores */}
                      {item.scores && Object.keys(item.scores).length > 0 && (
                        <div className="space-y-0.5">
                          {Object.entries(item.scores).map(([dim, score]) => (
                            <div key={dim} className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-400 dark:text-gray-500 w-14 truncate">
                                {L1_L5_LABELS[dim] ?? dim.replace(/_/g, ' ')}
                              </span>
                              <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gray-400 dark:bg-gray-500"
                                  style={{ width: `${Math.min(Number(score) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-gray-400 w-6 text-right">
                                {score != null ? Number(score).toFixed(2) : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Apply button */}
                      <IOSButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApply(item)}
                        className="w-full"
                      >
                        Apply — reuse this creative intent
                      </IOSButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </IOSCardContent>
    </IOSCard>
  );
}
