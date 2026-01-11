import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PageErrorBoundary from './PageErrorBoundary';
import CacheStats from './CacheStats';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { 
  detectDevicePerformance, 
  getPerformanceConfig, 
  getOptimizedAnimation,
  gpuAccelerationStyles,
  type PerformanceLevel 
} from '../../utils/performanceOptimizer';

export default function Layout() {
  const { theme } = useTheme();
  const location = useLocation();
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>('medium');
  
  // Get page name from route for error boundary
  const getPageName = (pathname: string) => {
    const routes: Record<string, string> = {
      '/': 'Home',
      '/leaderboard': 'Leaderboard',
      '/battle': 'Battle',
      '/compare': 'Compare',
      '/dashboard': 'Dashboard',
      '/evaluations': 'Evaluations',
      '/gallery': 'Gallery',
      '/about': 'About',
    };
    
    // Handle dynamic routes
    if (pathname.startsWith('/model/')) return 'Model Detail';
    if (pathname.startsWith('/evaluations/')) return 'Evaluation Detail';
    if (pathname.startsWith('/leaderboard/')) return 'Leaderboard';
    
    return routes[pathname] || 'Page';
  };
  
  // Detect device performance on mount
  useEffect(() => {
    const level = detectDevicePerformance();
    setPerformanceLevel(level);
    console.log('Device performance level:', level);
  }, []);
  
  // Get performance configuration
  const perfConfig = useMemo(() => 
    getPerformanceConfig(performanceLevel),
    [performanceLevel]
  );
  
  // Liquid Glass Background System - iOS 26 Specification
  const liquidGlassBackground = theme === 'dark' 
    ? {
        // Dark mode: Liquid Glass with depth
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(28, 28, 30, 0.98) 50%, rgba(44, 44, 46, 0.95) 100%)',
      }
    : {
        // Light mode: Liquid Glass with subtle gradient
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(242, 242, 247, 0.95) 50%, rgba(229, 229, 234, 0.92) 100%)',
      };
  
  // Performance-based blur intensity
  const getBlurIntensity = () => {
    switch (performanceLevel) {
      case 'high':
        return 'blur(30px) saturate(200%)';
      case 'medium':
        return 'blur(20px) saturate(180%)';
      case 'low':
        return 'blur(10px) saturate(150%)';
      default:
        return 'blur(20px) saturate(180%)';
    }
  };
  
  // Optimized floating emojis configuration based on performance
  const floatingEmojis = useMemo(() => [
    { 
      emoji: '🎨', 
      size: perfConfig.emojiSizes[0],
      position: 'top-[-200px] left-[-200px]',
      animation: getOptimizedAnimation(perfConfig.animationComplexity, 0),
      duration: perfConfig.durations[0]
    },
    { 
      emoji: '✨', 
      size: perfConfig.emojiSizes[1],
      position: 'bottom-[-150px] right-[-150px]',
      animation: getOptimizedAnimation(perfConfig.animationComplexity, 1),
      duration: perfConfig.durations[1]
    },
    { 
      emoji: '🚀', 
      size: perfConfig.emojiSizes[2],
      position: 'top-[30%] left-[40%]',
      animation: getOptimizedAnimation(perfConfig.animationComplexity, 2),
      duration: perfConfig.durations[2]
    }
  ], [perfConfig]);
  
  // Dynamic opacity based on theme and performance
  const emojiOpacity = theme === 'dark' ? perfConfig.darkOpacity : perfConfig.opacity;
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Liquid Glass Background System - iOS 26 */}
      
      {/* Layer 1: Base gradient with transparency */}
      <div 
        className="fixed inset-0 transition-all duration-500" 
        style={liquidGlassBackground}
      />
      
      {/* Layer 2: Primary Liquid Glass effect */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at top left, rgba(88, 166, 255, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(175, 82, 222, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at top left, rgba(0, 122, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(175, 82, 222, 0.06) 0%, transparent 50%)',
          backdropFilter: getBlurIntensity(),
          WebkitBackdropFilter: getBlurIntensity(),
        }}
      />
      
      {/* Layer 3: Dynamic glass reflections */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: theme === 'dark' ? [
            'linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0) 100%)',
            'linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0) 100%)',
            'linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0) 100%)',
          ] : [
            'linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%)',
            'linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 100%)',
            'linear-gradient(45deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%)',
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Layer 4: Floating Emojis with Glass interaction */}
      <div className="fixed inset-0 pointer-events-none" style={{ contain: 'layout style paint' }}>
        {floatingEmojis.map((item, index) => (
          <motion.div
            key={index}
            className={`absolute ${item.position} ${item.size} select-none`}
            animate={item.animation}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              type: "tween"
            }}
            style={{
              ...gpuAccelerationStyles,
              opacity: emojiOpacity,
              filter: perfConfig.enableBlur 
                ? (theme === 'dark' ? 'blur(1px) saturate(1)' : 'blur(0.5px) saturate(1.5)')
                : 'none',
              mixBlendMode: theme === 'dark' ? 'soft-light' : 'normal',
              transformStyle: 'preserve-3d',
            }}
          >
            <span className="block" style={{ transform: 'translateZ(0)' }}>{item.emoji}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-md">
          Performance: {performanceLevel}
        </div>
      )}
      
      {/* Cache Statistics (development only) */}
      {process.env.NODE_ENV === 'development' && <CacheStats />}
      
      {/* Layer 5: Additional glass overlay for depth */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.2) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 30%, transparent 70%, rgba(242, 242, 247, 0.3) 100%)',
        }}
      />
      
      {/* Layer 6: Subtle noise texture for authenticity */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' seed='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
      }} />
      
      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only skip-to-main"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-grow" tabIndex={-1}>
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageErrorBoundary pageName={getPageName(location.pathname)}>
              <Outlet />
            </PageErrorBoundary>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}