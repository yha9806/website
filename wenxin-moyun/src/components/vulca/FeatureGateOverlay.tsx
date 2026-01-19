/**
 * FeatureGateOverlay - Shows upgrade prompts for premium features
 * Displays when users access limited features in demo mode
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IOSButton } from '../ios/core/IOSButton';

interface FeatureGateOverlayProps {
  isVisible: boolean;
  onClose?: () => void;
  featureName: string;
  featureDescription?: string;
  variant?: 'overlay' | 'inline' | 'banner';
  showClose?: boolean;
}

export const FeatureGateOverlay: React.FC<FeatureGateOverlayProps> = ({
  isVisible,
  onClose,
  featureName,
  featureDescription,
  variant = 'inline',
  showClose = true,
}) => {
  if (!isVisible) return null;

  // Full overlay variant - covers entire section
  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg"
        >
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {featureName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {featureDescription || 'Upgrade to access full evaluation capabilities and detailed diagnostics.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/pricing">
                <IOSButton variant="primary" size="md">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Now
                </IOSButton>
              </Link>
              {showClose && onClose && (
                <IOSButton variant="secondary" size="md" onClick={onClose}>
                  Continue with Demo
                </IOSButton>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Banner variant - horizontal bar at top/bottom
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {featureName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {featureDescription || 'Upgrade to unlock all features'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/pricing">
              <IOSButton variant="primary" size="sm">
                Upgrade
                <ArrowRight className="w-4 h-4 ml-1" />
              </IOSButton>
            </Link>
            {showClose && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Inline variant (default) - compact message within content
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lock className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white text-sm">
            {featureName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {featureDescription || 'This feature requires an upgraded plan.'}
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-2 transition-colors"
          >
            Learn more
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Pre-configured feature gates for common use cases
export const Feature47DGate: React.FC<{
  isVisible: boolean;
  onClose?: () => void;
  variant?: 'overlay' | 'inline' | 'banner';
}> = ({ isVisible, onClose, variant = 'banner' }) => (
  <FeatureGateOverlay
    isVisible={isVisible}
    onClose={onClose}
    featureName="Full 47D Analysis"
    featureDescription="Demo shows 6D overview. Upgrade to see all 47 evaluation dimensions with detailed cultural insights."
    variant={variant}
    showClose={true}
  />
);

export const FeatureExportGate: React.FC<{
  isVisible: boolean;
  onClose?: () => void;
}> = ({ isVisible, onClose }) => (
  <FeatureGateOverlay
    isVisible={isVisible}
    onClose={onClose}
    featureName="Export Reports"
    featureDescription="Generate comprehensive PDF reports with full evaluation data and cultural analysis."
    variant="inline"
    showClose={true}
  />
);

export const FeatureCompareGate: React.FC<{
  isVisible: boolean;
  onClose?: () => void;
}> = ({ isVisible, onClose }) => (
  <FeatureGateOverlay
    isVisible={isVisible}
    onClose={onClose}
    featureName="Advanced Comparison"
    featureDescription="Compare up to 10 models with detailed cross-cultural metrics and statistical analysis."
    variant="inline"
    showClose={true}
  />
);

export default FeatureGateOverlay;
