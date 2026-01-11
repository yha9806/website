/**
 * FloatingCTA Component
 *
 * Fixed position CTA button that appears after scrolling.
 * Scale.com style "Book a Demo" floating action.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, MessageSquare, ArrowRight } from 'lucide-react';
import { IOSButton } from '../ios/core/IOSButton';

interface FloatingCTAProps {
  /** Scroll threshold in pixels before showing */
  scrollThreshold?: number;
  /** Whether to show on mobile */
  showOnMobile?: boolean;
  /** Custom className */
  className?: string;
}

export function FloatingCTA({
  scrollThreshold = 400,
  showOnMobile = true,
  className = ''
}: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check session storage for dismissal
  useEffect(() => {
    const dismissed = sessionStorage.getItem('floatingCTA_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > scrollThreshold;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsExpanded(false);
    sessionStorage.setItem('floatingCTA_dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`
            fixed bottom-6 right-6 z-50
            ${showOnMobile ? '' : 'hidden md:block'}
            ${className}
          `}
        >
          {/* Expanded Panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-20 right-0 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Get Started</h4>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">
                    Choose how you'd like to connect
                  </p>
                </div>

                {/* Options */}
                <div className="p-3 space-y-2">
                  <Link to="/demo" onClick={() => setIsExpanded(false)}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          Book a Demo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          30-min personalized walkthrough
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>

                  <Link to="/pricing" onClick={() => setIsExpanded(false)}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          View Pricing
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Free, Pilot, Enterprise
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </Link>
                </div>

                {/* Dismiss */}
                <div className="px-3 pb-3">
                  <button
                    onClick={handleDismiss}
                    className="w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-2"
                  >
                    Don't show again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                flex items-center gap-2 px-5 py-3.5 rounded-full
                bg-gradient-to-r from-blue-600 to-purple-600
                text-white font-medium shadow-lg shadow-blue-500/30
                hover:shadow-xl hover:shadow-blue-500/40
                transition-all duration-300
                ${isExpanded ? 'ring-4 ring-blue-500/30' : ''}
              `}
            >
              <Calendar className="w-5 h-5" />
              <span>Book a Demo</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingCTA;
