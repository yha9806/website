import { useState, useCallback, useEffect } from 'react';
import { hasReachedDailyLimit, getRemainingUsage, isGuestMode } from '../utils/guestSession';
import { getItem, setItem } from '../utils/storageUtils';

export type LoginPromptTrigger = 'limit_reached' | 'save_progress' | 'share_result' | 'advanced_features';

interface LoginPromptState {
  isOpen: boolean;
  trigger: LoginPromptTrigger;
  lastShown: Record<LoginPromptTrigger, number>;
}

const PROMPT_COOLDOWN = {
  limit_reached: 0, // Show immediately when limit reached
  save_progress: 5 * 60 * 1000, // 5 minutes
  share_result: 10 * 60 * 1000, // 10 minutes  
  advanced_features: 15 * 60 * 1000 // 15 minutes
};

const STORAGE_KEY = 'wenxin_login_prompt_state';

export function useLoginPrompt() {
  const [state, setState] = useState<LoginPromptState>(() => {
    const stored = getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Invalid stored state
      }
    }
    
    return {
      isOpen: false,
      trigger: 'save_progress' as LoginPromptTrigger,
      lastShown: {
        limit_reached: 0,
        save_progress: 0,
        share_result: 0,
        advanced_features: 0
      }
    };
  });

  // Save state to localStorage
  const saveState = useCallback((newState: LoginPromptState) => {
    setItem(STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
  }, []);

  // Check if we can show a prompt (respects cooldown)
  const canShowPrompt = useCallback((trigger: LoginPromptTrigger): boolean => {
    // Don't show prompts if user is already logged in
    if (!isGuestMode()) {
      return false;
    }

    const now = Date.now();
    const lastShown = state.lastShown[trigger] || 0;
    const cooldown = PROMPT_COOLDOWN[trigger];

    return now - lastShown >= cooldown;
  }, [state.lastShown]);

  // Show login prompt
  const showPrompt = useCallback((trigger: LoginPromptTrigger) => {
    if (!canShowPrompt(trigger)) {
      return false;
    }

    const newState = {
      ...state,
      isOpen: true,
      trigger,
      lastShown: {
        ...state.lastShown,
        [trigger]: Date.now()
      }
    };

    saveState(newState);
    return true;
  }, [state, canShowPrompt, saveState]);

  // Hide login prompt
  const hidePrompt = useCallback(() => {
    const newState = {
      ...state,
      isOpen: false
    };
    saveState(newState);
  }, [state, saveState]);

  // Auto-check for limit reached prompt
  useEffect(() => {
    if (isGuestMode() && hasReachedDailyLimit()) {
      showPrompt('limit_reached');
    }
  }, [showPrompt]);

  // Smart trigger functions for different scenarios
  const triggers = {
    // Show when user has reached daily limit
    checkLimitReached: useCallback(() => {
      if (hasReachedDailyLimit()) {
        return showPrompt('limit_reached');
      }
      return false;
    }, [showPrompt]),

    // Show when user might want to save progress
    checkSaveProgress: useCallback((evaluationCount: number = 1) => {
      // Show after user has created multiple evaluations
      if (evaluationCount >= 2) {
        return showPrompt('save_progress');
      }
      return false;
    }, [showPrompt]),

    // Show when user tries to share results
    checkShareResult: useCallback(() => {
      return showPrompt('share_result');
    }, [showPrompt]),

    // Show when user accesses advanced features
    checkAdvancedFeatures: useCallback(() => {
      return showPrompt('advanced_features');
    }, [showPrompt]),

    // Smart prompt based on usage pattern
    checkSmartPrompt: useCallback(() => {
      const remaining = getRemainingUsage();
      
      // High urgency: only 1 usage left
      if (remaining === 1) {
        return showPrompt('save_progress');
      }
      
      // Medium urgency: show advanced features
      if (remaining === 2) {
        return showPrompt('advanced_features');
      }
      
      return false;
    }, [showPrompt])
  };

  return {
    // State
    isPromptOpen: state.isOpen,
    promptTrigger: state.trigger,
    remainingUsage: getRemainingUsage(),
    isGuestMode: isGuestMode(),
    
    // Actions
    showPrompt,
    hidePrompt,
    canShowPrompt,
    
    // Smart triggers
    ...triggers
  };
}