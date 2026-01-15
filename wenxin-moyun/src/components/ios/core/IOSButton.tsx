import React from 'react';
import { motion } from 'framer-motion';
import { iosAnimations } from '../utils/animations';

export interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'glass' | 'text' | 'artistic';
  size?: 'sm' | 'md' | 'lg';
  glassMorphism?: boolean;
  emoji?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md',
    glassMorphism = false,
    emoji,
    disabled = false,
    children, 
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    ...props 
  }, ref) => {
    
    // Size classes - iOS HIG 44px minimum touch target
    const sizeClasses = {
      sm: 'px-4 py-2.5 text-sm font-medium min-h-[44px] min-w-[44px]',
      md: 'px-5 py-3 text-base font-semibold min-h-[44px] min-w-[44px]',
      lg: 'px-7 py-4 text-lg font-semibold min-h-[52px] min-w-[52px]',
    };
    
    // Base classes
    const baseClasses = `
      relative inline-flex items-center justify-center
      rounded-${size === 'sm' ? 'lg' : size === 'md' ? 'xl' : '2xl'}
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      select-none
    `;
    
    // Variant styles - Art Professional (无渐变，纯色)
    const variantStyles = {
      primary: `
        bg-slate-700 hover:bg-slate-600
        dark:bg-slate-600 dark:hover:bg-slate-500
        text-white shadow-md shadow-gray-900/15
        focus:ring-slate-400
        border border-slate-600/30
      `,
      secondary: `
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-200
        shadow-sm border border-gray-200 dark:border-gray-700
        focus:ring-gray-300 dark:focus:ring-gray-600
      `,
      destructive: `
        bg-red-600 hover:bg-red-700
        dark:bg-red-700 dark:hover:bg-red-600
        text-white shadow-md shadow-red-500/15
        focus:ring-red-300
        border border-red-700/30
      `,
      glass: `
        bg-white/10 dark:bg-white/5
        hover:bg-white/20 dark:hover:bg-white/10
        backdrop-blur-xl backdrop-saturate-150
        text-gray-900 dark:text-white
        shadow-md border border-white/20
        focus:ring-white/30
      `,
      text: `
        bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50
        text-slate-700 dark:text-slate-300
        focus:ring-slate-300 dark:focus:ring-slate-600
      `,
      artistic: `
        bg-bronze-500 hover:bg-bronze-600
        dark:bg-bronze-500 dark:hover:bg-bronze-400
        text-white shadow-md shadow-bronze-500/20
        focus:ring-bronze-500/50
        border border-bronze-600/30
      `
    };
    
    // Glass morphism overlay styles
    const glassOverlay = glassMorphism ? `
      before:absolute before:inset-0 before:rounded-inherit
      before:bg-gradient-to-b before:from-white/20 before:to-transparent
      before:pointer-events-none
    ` : '';
    
    const buttonClasses = `
      ${baseClasses}
      ${variantStyles[variant]}
      ${sizeClasses[size]}
      ${glassOverlay}
      ${className}
    `.replace(/\s+/g, ' ').trim();
    
    // Motion animation variants
    const motionVariants = {
      tap: { scale: 0.96 },
      hover: variant !== 'text' ? { y: -1 } : { scale: 1.05 },
    };
    
    // Handle click with haptic feedback
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      // Haptic feedback simulation
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      // Ripple effect
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
      `;
      ripple.classList.add('ios-ripple');
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
      
      if (onClick) {
        onClick(e);
      }
    };
    
    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled}
        onClick={handleClick}
        whileTap={motionVariants.tap}
        whileHover={motionVariants.hover}
        transition={iosAnimations.spring}
        {...props}
      >
        {/* Glass morphism overlay */}
        {glassMorphism && (
          <div className="absolute inset-0 rounded-inherit bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        )}
        
        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          {children}
        </span>
        
        {/* iOS-style highlight on top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      </motion.button>
    );
  }
);

IOSButton.displayName = 'IOSButton';

export default IOSButton;

// Add ripple effect styles
if (typeof document !== 'undefined' && !document.getElementById('ios-button-styles')) {
  const style = document.createElement('style');
  style.id = 'ios-button-styles';
  style.textContent = `
    .ios-ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: scale(0);
      animation: ios-ripple-animation 0.6s ease-out;
      pointer-events: none;
    }
    
    @keyframes ios-ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}