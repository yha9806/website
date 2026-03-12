/**
 * GalleryCardActions — Like + Fork actions for each artwork card.
 *
 * Like: heart icon with count, POST to backend, localStorage dedup.
 * Fork: navigate to /canvas with subject + tradition pre-filled.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, GitFork } from 'lucide-react';
import { motion } from 'framer-motion';
import { IOSButton } from '../ios';
import { API_PREFIX } from '../../config/api';

interface GalleryCardActionsProps {
  sessionId: string;
  subject: string;
  tradition: string;
  initialLikes?: number;
}

const LIKED_KEY_PREFIX = 'vulca_liked_';

function getLikedKey(sessionId: string): string {
  return `${LIKED_KEY_PREFIX}${sessionId}`;
}

function isAlreadyLiked(sessionId: string): boolean {
  try {
    return localStorage.getItem(getLikedKey(sessionId)) === '1';
  } catch {
    return false;
  }
}

function markAsLiked(sessionId: string): void {
  try {
    localStorage.setItem(getLikedKey(sessionId), '1');
  } catch {
    // localStorage may be unavailable
  }
}

export default function GalleryCardActions({
  sessionId,
  subject,
  tradition,
  initialLikes = 0,
}: GalleryCardActionsProps) {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(() => isAlreadyLiked(sessionId));
  const [animating, setAnimating] = useState(false);

  // Sync initial likes from parent when they change
  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const handleLike = useCallback(async () => {
    if (liked) return;

    setLiked(true);
    setLikes(prev => prev + 1);
    setAnimating(true);
    markAsLiked(sessionId);

    try {
      const res = await fetch(
        `${API_PREFIX}/prototype/gallery/${encodeURIComponent(sessionId)}/like`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: '' }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes ?? likes + 1);
      }
    } catch {
      // Optimistic update already applied — keep local state
    }

    setTimeout(() => setAnimating(false), 400);
  }, [liked, sessionId, likes]);

  const handleFork = useCallback(() => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (tradition) params.set('tradition', tradition);
    navigate(`/canvas?${params.toString()}`);
  }, [navigate, subject, tradition]);

  return (
    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={liked}
        className={[
          'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
          liked
            ? 'text-[#C65D4D] dark:text-[#E07A6A] cursor-default'
            : 'text-gray-400 dark:text-gray-500 hover:text-[#C65D4D] dark:hover:text-[#E07A6A] hover:bg-[#C65D4D]/5 dark:hover:bg-[#C65D4D]/10',
        ].join(' ')}
        aria-label={liked ? 'Already liked' : 'Like this artwork'}
      >
        <motion.span
          animate={animating ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="inline-flex"
        >
          <Heart
            className="w-4 h-4"
            fill={liked ? 'currentColor' : 'none'}
            strokeWidth={liked ? 0 : 2}
          />
        </motion.span>
        {likes > 0 && (
          <span className="font-mono tabular-nums">{likes}</span>
        )}
      </button>

      {/* Fork button */}
      <IOSButton
        variant="text"
        size="sm"
        onClick={handleFork}
        className="!text-xs !text-gray-400 dark:!text-gray-500 hover:!text-[#C87F4A] dark:hover:!text-[#DDA574] !gap-1.5"
      >
        <GitFork className="w-3.5 h-3.5" />
        Fork
      </IOSButton>
    </div>
  );
}
