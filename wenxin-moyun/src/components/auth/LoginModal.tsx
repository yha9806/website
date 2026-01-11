import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Gift, Save, Clock, Star } from 'lucide-react';
import authService from '../../services/auth.service';
import { retryPendingRequests } from '../../services/api';
import { getItem } from '../../utils/storageUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'limit_reached' | 'save_progress' | 'extended_use' | 'quality_feedback' | 'auth_required';
}

const triggerConfigs = {
  limit_reached: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    title: 'Daily Free Evaluation Limit Reached',
    subtitle: 'Sign in for unlimited access to all features',
    urgency: 'high',
    benefits: [
      'Unlock unlimited evaluations',
      'Save evaluation history',
      'Get AI professional scoring advice',
      'Participate in model voting battles'
    ]
  },
  save_progress: {
    icon: Save,
    iconColor: 'text-blue-500',
    title: 'Save Your Evaluation Progress',
    subtitle: 'Create an account to permanently save your creations',
    urgency: 'medium',
    benefits: [
      'Cloud sync evaluation records',
      'Cross-device access history',
      'Build personal portfolio',
      'Get personalized recommendations'
    ]
  },
  extended_use: {
    icon: Clock,
    iconColor: 'text-green-500',
    title: "You've Experienced 10 Minutes",
    subtitle: 'Register to unlock full feature experience',
    urgency: 'low',
    benefits: [
      'Exclusive user dashboard',
      'Advanced filtering and search',
      'Batch evaluation function',
      'Export evaluation reports'
    ]
  },
  quality_feedback: {
    icon: Star,
    iconColor: 'text-yellow-500',
    title: 'Want More Professional Evaluation Feedback?',
    subtitle: 'Sign in for AI deep analysis reports',
    urgency: 'low',
    benefits: [
      'AI scoring detailed analysis',
      'Work improvement suggestions',
      'Similar works comparison',
      'Trend analysis charts'
    ]
  },
  auth_required: {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    title: 'This Feature Requires Login',
    subtitle: 'Sign in to use all features',
    urgency: 'high',
    benefits: [
      'Access all features',
      'Personalized experience',
      'Permanent data storage',
      'Exclusive user benefits'
    ]
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, trigger }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const config = triggerConfigs[trigger];
  const Icon = config.icon;

  // Focus trap: keep focus within the modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && config.urgency !== 'high') {
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [onClose, config.urgency]);

  // Manage focus when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first input after animation
      const timer = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input');
        firstInput?.focus();
      }, 100);

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus when closing
      previousActiveElement.current?.focus();
    }
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.login({ username: formData.username, password: formData.password });
      // Retry pending requests after successful login
      retryPendingRequests();
      onClose();
      // Refresh current page to update UI
      window.location.reload();
    } catch {
      setError('Login failed, please check username and password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authService.login({ username: 'demo', password: 'demo123' });
      retryPendingRequests();
      onClose();
      window.location.reload();
    } catch {
      setError('Demo account login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={config.urgency === 'low' ? onClose : undefined}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            ref={modalRef}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-neutral-50 dark:bg-[#161B22] rounded-2xl shadow-2xl z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-neutral-50/20 transition-colors"
                disabled={config.urgency === 'high' && !getItem('access_token')}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-neutral-50/20`}>
                  <Icon className={`w-8 h-8 ${config.iconColor}`} />
                </div>
                <div>
                  <h2 id="login-modal-title" className="text-2xl font-bold">{config.title}</h2>
                  <p className="text-white/90 mt-1">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">After login you will get:</h3>
              <div className="grid grid-cols-2 gap-2">
                {config.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div id="modal-login-error" role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter username"
                    required
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'modal-login-error' : undefined}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter password"
                    required
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'modal-login-error' : undefined}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In Now'}
                </button>

                <button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={isLoading}
                  className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  <Gift className="w-4 h-4 inline mr-2" />
                  Use Demo Account
                </button>
              </div>

              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?
                  <a href="/register" className="text-primary hover:underline ml-1">
                    Sign Up Now
                  </a>
                </span>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};