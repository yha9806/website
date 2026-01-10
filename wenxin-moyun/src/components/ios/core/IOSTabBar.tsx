import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { liquidGlass, iosColors, iosShadows } from '../utils/iosTheme';
import { iosAnimations } from '../utils/animations';
import { EmojiIcon } from './EmojiIcon';
import { cn } from '../../../utils/cn';

export interface TabBarItem {
  id: string;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  disabled?: boolean;
}

export interface IOSTabBarProps {
  items: TabBarItem[];
  selectedIndex: number;
  onTabPress: (index: number, item: TabBarItem) => void;
  variant?: 'regular' | 'compact' | 'prominent';
  showLabels?: boolean;
  className?: string;
}

export const IOSTabBar: React.FC<IOSTabBarProps> = ({
  items,
  selectedIndex,
  onTabPress,
  variant = 'regular',
  showLabels = true,
  className = '',
}) => {
  const heights = {
    compact: 'h-16',
    regular: 'h-20', 
    prominent: 'h-24'
  };

  const iconSizes = {
    compact: 'sm' as const,
    regular: 'md' as const,
    prominent: 'lg' as const
  };

  return (
    <motion.div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        ${heights[variant]}
        ${liquidGlass.containers.navigation}
        ${className}
      `}
      style={{ 
        boxShadow: liquidGlass.shadows.medium,
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        // Based on Figma iOS 26 data: Tab Bar has 5px corner radius
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px'
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={iosAnimations.spring}
    >
      {/* Safe area padding */}
      <div className="flex items-center justify-around h-full px-2 pb-safe">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const isDisabled = item.disabled;
          
          return (
            <motion.button
              key={item.id}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-center justify-center
                flex-1 h-full max-w-20
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0
                rounded-lg
              `}
              onTap={() => !isDisabled && onTabPress(index, item)}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
              transition={iosAnimations.spring}
            >
              {/* Badge */}
              <AnimatePresence>
                {item.badgeCount && item.badgeCount > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 right-3 z-10"
                  >
                    <div className="flex items-center justify-center min-w-5 h-5 px-1 bg-red-500 rounded-full">
                      <span className="text-white text-xs font-semibold leading-none">
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon/Emoji */}
              <motion.div
                className={`
                  flex items-center justify-center mb-1
                  transition-colors duration-200
                  ${isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}
                `}
                animate={isSelected ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                transition={iosAnimations.spring}
              >
                {item.emoji ? (
                  <EmojiIcon 
                    category="navigation" 
                    name={item.emoji as any} 
                    size={iconSizes[variant]} 
                  />
                ) : (
                  item.icon
                )}
              </motion.div>

              {/* Label */}
              {showLabels && (
                <motion.span
                  className={`
                    text-xs font-medium leading-tight
                    transition-colors duration-200
                    ${isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}
                  `}
                  animate={isSelected ? { opacity: 1, y: -1 } : { opacity: 0.8, y: 0 }}
                  transition={iosAnimations.spring}
                >
                  {item.label}
                </motion.span>
              )}

              {/* Selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"
                    transition={iosAnimations.spring}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default IOSTabBar;