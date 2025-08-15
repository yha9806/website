/**
 * iOS Animation Presets for Framer Motion
 */

export const iosAnimations = {
  // Button animations
  buttonTap: {
    scale: 0.96,
    transition: {
      duration: 0.1,
      ease: 'easeOut',
    },
  },
  
  buttonHover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  
  // Spring animations
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  
  springBounce: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  
  springSmooth: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 40,
  },
  
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  
  // Slide animations
  slideInFromRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  
  slideInFromBottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  
  // iOS-specific animations
  iosModalPresent: {
    initial: { y: '100%', opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 300,
      }
    },
    exit: { 
      y: '100%', 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn' as const,
      }
    },
  },
  
  iosSheetPresent: {
    initial: { y: '100%' },
    animate: { 
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 400,
      }
    },
    exit: { 
      y: '100%',
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 1, 1] as const,
      }
    },
  },
  
  // Pulse animation for notifications
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
  
  // Skeleton loading animation
  shimmer: {
    x: [-100, 100],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear' as const,
    },
  },
};

// Haptic feedback simulation (visual feedback)
export const hapticFeedback = {
  light: {
    scale: [1, 0.98, 1],
    transition: { duration: 0.15 },
  },
  
  medium: {
    scale: [1, 0.96, 1],
    transition: { duration: 0.2 },
  },
  
  heavy: {
    scale: [1, 0.94, 1],
    transition: { duration: 0.25 },
  },
  
  success: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  },
  
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};