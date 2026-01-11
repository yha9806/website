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

// ============= 统一的 Stagger 延迟配置 =============

export const iosStaggerDelays = {
  // 列表项延迟
  list: {
    fast: 0.03,    // 快速列表 (如下拉菜单)
    normal: 0.05,  // 标准列表
    slow: 0.08,    // 慢速列表 (如大型卡片)
  },
  // 网格项延迟
  grid: {
    fast: 0.08,    // 快速网格
    normal: 0.1,   // 标准网格
    slow: 0.15,    // 慢速网格
  },
  // 页面级延迟
  page: {
    hero: 0.2,     // 首屏大元素
    section: 0.15, // 区块
    element: 0.1,  // 小元素
  },
};

/**
 * 获取 stagger 延迟时间
 * @param index 元素索引
 * @param type 类型: list | grid | page
 * @param speed 速度: fast | normal | slow (list/grid) 或 hero | section | element (page)
 */
export const getStaggerDelay = (
  index: number,
  type: 'list' | 'grid' | 'page' = 'list',
  speed: string = 'normal'
): number => {
  const delays = iosStaggerDelays[type];
  // Get delay with proper fallbacks for each type
  const defaultDelay = type === 'page' ? 0.1 : 0.05;
  const delay = (delays as Record<string, number>)[speed] ?? defaultDelay;
  return index * delay;
};

/**
 * 生成 stagger children 动画配置
 * @param type 类型
 * @param speed 速度
 */
export const getStaggerContainer = (
  type: 'list' | 'grid' | 'page' = 'list',
  speed: string = 'normal'
) => {
  const delays = iosStaggerDelays[type];
  // Get delay with proper fallbacks for each type
  const defaultDelay = type === 'page' ? 0.1 : 0.05;
  const delay = (delays as Record<string, number>)[speed] ?? defaultDelay;

  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  };
};

/**
 * stagger 子元素动画配置
 */
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
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