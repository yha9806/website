/**
 * Unified Loading Overlay Component
 * Provides consistent loading states across all pages
 */

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  fullScreen = false,
  size = 'md',
}) => {
  const sizeConfig = {
    sm: { spinner: 'w-8 h-8', text: 'text-sm', padding: 'p-4' },
    md: { spinner: 'w-12 h-12', text: 'text-base', padding: 'p-8' },
    lg: { spinner: 'w-16 h-16', text: 'text-lg', padding: 'p-12' },
  };

  const config = sizeConfig[size];

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex flex-col items-center justify-center ${config.padding}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ios-glass rounded-2xl p-6 sm:p-8 flex flex-col items-center">
        {/* iOS-style spinner */}
        <div
          className={`${config.spinner} border-4 border-gray-200 dark:border-gray-700 border-t-ios-blue rounded-full animate-spin`}
          aria-hidden="true"
        />
        <p className={`mt-4 text-gray-500 dark:text-gray-400 ${config.text}`}>
          {message}
        </p>
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12 sm:py-20">
      {content}
    </div>
  );
};

/**
 * Inline loading spinner for smaller contexts
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'sm',
}) => {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`${sizeClass[size]} border-gray-200 dark:border-gray-700 border-t-ios-blue rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Skeleton loader for content placeholders
 */
export const SkeletonLoader: React.FC<{
  className?: string;
  animate?: boolean;
}> = ({ className = 'h-4 w-full', animate = true }) => {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className} ${
        animate ? 'animate-pulse' : ''
      }`}
    />
  );
};

export default LoadingOverlay;
