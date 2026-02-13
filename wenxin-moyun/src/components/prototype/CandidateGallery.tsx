/**
 * Draft candidate image gallery with selectable candidates.
 */

import type { DraftCandidate } from '../../hooks/usePrototypePipeline';
import { API_BASE_URL } from '../../config/api';

interface Props {
  candidates: DraftCandidate[];
  bestCandidateId: string | null;
  selectedCandidateId?: string | null;
  onSelect?: (candidateId: string) => void;
}

function toBackendStaticUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/** Resolve image source from candidate metadata. */
function imageUrl(candidate: DraftCandidate): string | null {
  const path = candidate.image_url || candidate.image_path;
  if (!path) return null;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/static/') || path.startsWith('static/')) {
    return toBackendStaticUrl(path);
  }
  return null;
}

export default function CandidateGallery({ candidates, bestCandidateId, selectedCandidateId, onSelect }: Props) {
  if (candidates.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 dark:text-gray-500">
        No candidates generated yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {candidates.map((c) => {
        const isBest = c.candidate_id === bestCandidateId;
        const isSelected = c.candidate_id === selectedCandidateId;
        const shortId = c.candidate_id.split('-').pop() || c.candidate_id;
        const imgSrc = imageUrl(c);

        return (
          <div
            key={c.candidate_id}
            onClick={() => onSelect?.(c.candidate_id)}
            className={`
              relative rounded-xl overflow-hidden border-2 transition-all
              ${onSelect ? 'cursor-pointer hover:shadow-md' : ''}
              ${isSelected
                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                : isBest
                  ? 'border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
            `}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                ✓
              </div>
            )}

            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={`Candidate ${shortId}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl">🎨</span>';
                  }}
                />
              ) : (c.image_url || c.image_path) ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-4xl">
                  🎨
                </div>
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>

            <div className="p-2 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">#{shortId}</span>
                <div className="flex items-center gap-1">
                  {isBest && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                      Best
                    </span>
                  )}
                  {isSelected && !isBest && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                seed: {c.seed} | {c.model_ref}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
