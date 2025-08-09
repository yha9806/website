import { useEffect, useRef } from 'react';
import { getGuestSession } from '../utils/guestSession';

interface GuestTrackingOptions {
  onTrigger: (trigger: string) => void;
}

export const useGuestTracking = ({ onTrigger }: GuestTrackingOptions) => {
  const sessionStartRef = useRef<number>(Date.now());
  const evaluationCountRef = useRef<number>(0);
  const hasTriggeredExtendedUse = useRef<boolean>(false);
  const hasTriggeredSaveProgress = useRef<boolean>(false);

  useEffect(() => {
    // Check if user is authenticated
    if (localStorage.getItem('access_token')) {
      return;
    }

    // Track session duration
    const checkSessionDuration = setInterval(() => {
      const sessionDuration = (Date.now() - sessionStartRef.current) / 1000 / 60; // in minutes
      
      // Trigger after 10 minutes of use
      if (sessionDuration >= 10 && !hasTriggeredExtendedUse.current) {
        hasTriggeredExtendedUse.current = true;
        onTrigger('extended_use');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSessionDuration);
  }, [onTrigger]);

  const trackEvaluation = () => {
    if (localStorage.getItem('access_token')) {
      return;
    }

    evaluationCountRef.current += 1;
    const session = getGuestSession();
    
    // Update session evaluation count
    if (session.evaluations) {
      session.evaluations.push(crypto.randomUUID());
      localStorage.setItem('guestSession', JSON.stringify(session));
    }

    // Check if daily limit reached
    if (session.dailyUsage >= 3) {
      onTrigger('limit_reached');
      return;
    }

    // Suggest saving progress after 2 evaluations
    if (evaluationCountRef.current >= 2 && !hasTriggeredSaveProgress.current) {
      hasTriggeredSaveProgress.current = true;
      setTimeout(() => {
        onTrigger('save_progress');
      }, 2000); // Delay slightly to not interrupt user flow
    }
  };

  const trackQualityInteraction = () => {
    if (localStorage.getItem('access_token')) {
      return;
    }

    // Trigger quality feedback prompt when user views detailed results
    setTimeout(() => {
      onTrigger('quality_feedback');
    }, 5000); // Show after 5 seconds of viewing
  };

  return {
    trackEvaluation,
    trackQualityInteraction
  };
};