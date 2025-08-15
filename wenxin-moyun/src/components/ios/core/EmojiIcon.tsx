import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  coreEmojis, 
  lazyEmojis, 
  getEmoji, 
  loadEmojiSvg,
  type CoreEmojiCategory,
  type LazyEmojiCategory,
  type EmojiKey
} from '../utils/emojiMap';
import { iosAnimations, hapticFeedback } from '../utils/animations';

interface EmojiIconProps<T extends CoreEmojiCategory | LazyEmojiCategory> {
  category: T;
  name: EmojiKey<T>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  animationType?: 'pulse' | 'bounce' | 'rotate' | 'shake' | 'none';
  interactive?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
  '2xl': 'w-12 h-12',
};

const animationMap = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  bounce: {
    y: [0, -8, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  rotate: {
    rotate: [0, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
  shake: {
    x: [0, -2, 2, -2, 2, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
  none: {},
};

export function EmojiIcon<T extends CoreEmojiCategory | LazyEmojiCategory>({
  category,
  name,
  size = 'md',
  animated = false,
  animationType = 'pulse',
  interactive = false,
  showTooltip = false,
  className = '',
  onClick,
}: EmojiIconProps<T>) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);
  
  // Get the emoji character (Unicode fallback)
  const emojiChar = getEmoji(category, name as string);
  
  // Load SVG content if available
  useEffect(() => {
    // For core emojis, we'll use Unicode directly for now
    // In production, these would be imported as modules
    if (category in coreEmojis) {
      setSvgContent(null); // Use Unicode
    } else {
      // For lazy emojis, attempt to load SVG
      setIsLoading(true);
      loadEmojiSvg(emojiChar)
        .then(svg => {
          setSvgContent(svg);
          setIsLoading(false);
        })
        .catch(() => {
          setSvgContent(null); // Fallback to Unicode
          setIsLoading(false);
        });
    }
  }, [category, name, emojiChar]);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const emojiContent = svgContent ? (
    <div 
      className={`${sizeMap[size]} ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  ) : (
    <span 
      className={`${sizeMap[size]} ${className} flex items-center justify-center`}
      style={{ fontSize: size === 'xs' ? '14px' : size === 'sm' ? '16px' : size === 'md' ? '20px' : size === 'lg' ? '28px' : size === 'xl' ? '36px' : '48px' }}
    >
      {emojiChar}
    </span>
  );
  
  const motionProps = {
    ...(animated && animationType !== 'none' ? animationMap[animationType] : {}),
    ...(interactive ? {
      whileHover: { scale: 1.1 },
      whileTap: hapticFeedback.light,
    } : {}),
  };
  
  return (
    <div className="relative inline-flex">
      <motion.div
        className={`inline-flex items-center justify-center ${interactive ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => showTooltip && setShowTooltipState(false)}
        {...motionProps}
      >
        {isLoading ? (
          <div className={`${sizeMap[size]} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
        ) : (
          emojiContent
        )}
      </motion.div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && showTooltipState && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-50"
          >
            {name as string}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Convenience components for common emoji types
export const StatusEmoji: React.FC<{
  status: keyof typeof coreEmojis.status;
  size?: EmojiIconProps<'status'>['size'];
  animated?: boolean;
}> = ({ status, size = 'md', animated = true }) => {
  const animationType = status === 'processing' ? 'rotate' : 
                        status === 'completed' ? 'bounce' : 
                        status === 'failed' ? 'shake' : 'pulse';
  
  return (
    <EmojiIcon
      category="status"
      name={status}
      size={size}
      animated={animated}
      animationType={animationType}
    />
  );
};

export const RankEmoji: React.FC<{
  rank: number;
  size?: EmojiIconProps<'rank'>['size'];
  animated?: boolean;
}> = ({ rank, size = 'md', animated = false }) => {
  const rankKey = rank <= 3 ? rank.toString() : rank <= 10 ? 'top10' : 'rising';
  
  return (
    <EmojiIcon
      category="rank"
      name={rankKey as keyof typeof coreEmojis.rank}
      size={size}
      animated={animated}
      animationType="pulse"
    />
  );
};

export const TypeEmoji: React.FC<{
  type: keyof typeof coreEmojis.evaluationType;
  size?: EmojiIconProps<'evaluationType'>['size'];
}> = ({ type, size = 'md' }) => {
  return (
    <EmojiIcon
      category="evaluationType"
      name={type}
      size={size}
      animated={false}
    />
  );
};