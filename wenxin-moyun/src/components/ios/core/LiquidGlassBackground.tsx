import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';

export interface LiquidGlassBackgroundProps {
  children?: React.ReactNode;
  intensity?: 'light' | 'medium' | 'heavy' | 'ultra';
  animated?: boolean;
  className?: string;
}

/**
 * Liquid Glass Background Component
 * Based on iOS 26 Figma specifications with enhanced glass morphism
 */
export const LiquidGlassBackground: React.FC<LiquidGlassBackgroundProps> = ({
  children,
  intensity = 'medium',
  animated = true,
  className = '',
}) => {
  const { theme } = useTheme();
  
  // Intensity configurations
  const intensityConfig = {
    light: {
      blur: 'blur(15px)',
      saturation: 'saturate(150%)',
      opacity: 0.6,
    },
    medium: {
      blur: 'blur(25px)',
      saturation: 'saturate(180%)',
      opacity: 0.75,
    },
    heavy: {
      blur: 'blur(35px)',
      saturation: 'saturate(200%)',
      opacity: 0.85,
    },
    ultra: {
      blur: 'blur(50px)',
      saturation: 'saturate(250%)',
      opacity: 0.95,
    },
  };
  
  const config = intensityConfig[intensity];
  
  return (
    <div className={`relative ${className}`}>
      {/* Base glass layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: theme === 'dark'
            ? `linear-gradient(135deg, rgba(0, 0, 0, ${config.opacity}) 0%, rgba(28, 28, 30, ${config.opacity + 0.05}) 100%)`
            : `linear-gradient(135deg, rgba(255, 255, 255, ${config.opacity}) 0%, rgba(242, 242, 247, ${config.opacity + 0.05}) 100%)`,
          backdropFilter: `${config.blur} ${config.saturation}`,
          WebkitBackdropFilter: `${config.blur} ${config.saturation}`,
        }}
      />
      
      {/* Animated reflection layer */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
              'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
            ],
            x: ['-100%', '100%', '-100%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
      
      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default LiquidGlassBackground;