import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  coreEmojis,
  getEmoji,
  type CoreEmojiCategory,
} from '../utils/emojiMap';
import { hapticFeedback } from '../utils/animations';

interface EmojiIconProps {
  category: CoreEmojiCategory;
  name: string;
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

export function EmojiIcon({
  category,
  name,
  size = 'md',
  animated = false,
  animationType = 'pulse',
  interactive = false,
  showTooltip = false,
  className = '',
  onClick,
}: EmojiIconProps) {
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Get the emoji character (Unicode)
  const emojiChar = getEmoji(category, name);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  // 直接使用Unicode emoji
  const emojiContent = (
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
        {emojiContent}
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

// Size type for convenience components
type EmojiSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Convenience components for common emoji types
export const StatusEmoji: React.FC<{
  status: keyof typeof coreEmojis.status;
  size?: EmojiSize;
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
  size?: EmojiSize;
  animated?: boolean;
}> = ({ rank, size = 'md', animated = false }) => {
  const rankKey = rank <= 3 ? rank.toString() : rank <= 10 ? 'top10' : 'rising';

  return (
    <EmojiIcon
      category="rank"
      name={rankKey}
      size={size}
      animated={animated}
      animationType="pulse"
    />
  );
};

export const TypeEmoji: React.FC<{
  type: keyof typeof coreEmojis.evaluationType;
  size?: EmojiSize;
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