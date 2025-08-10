import React from 'react';
import { cn } from '../../utils/cn';

export interface ChineseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'text';
  size?: 'sm' | 'md' | 'lg';
  withFeibai?: boolean;
  withGoldTexture?: boolean;
  children: React.ReactNode;
}

const ChineseButton = React.forwardRef<HTMLButtonElement, ChineseButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    withFeibai = false,
    withGoldTexture = false,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = [
      // 基础样式 - 参考案例几何现代化
      'relative overflow-hidden',
      'font-lantinghei font-medium',
      'border-2 rounded-xl', // 更现代的圆角
      'transition-all duration-500 ease-out', // 更流畅的过渡
      'active:scale-95 active:rotate-1', // 增加微妙的旋转效果
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-4 focus:ring-chinese-gold/30', // 更柔和的焦点环
      'transform-gpu', // 启用 GPU 加速
      
      // 几何装饰效果
      withFeibai && 'feibai-effect',
      withGoldTexture && 'gold-texture'
    ].filter(Boolean);

    const variantClasses = {
      primary: [
        // 主色 - 青金石系，参考案例1的高对比度设计
        'bg-gradient-to-br from-chinese-stone-600 to-chinese-stone-800 text-chinese-paper border-chinese-gold-400',
        'hover:shadow-[0_8px_32px_rgba(201,161,74,0.6)] hover:shadow-chinese-gold-300/20',
        'hover:border-chinese-gold-300 hover:from-chinese-stone-500 hover:to-chinese-stone-700',
        'hover:-translate-y-1', // 参考案例2的悬浮效果
        'active:bg-gradient-to-br active:from-chinese-stone-700 active:to-chinese-stone-900'
      ],
      secondary: [
        // 次要 - 透明背景，参考案例3的简约风格
        'bg-gradient-to-r from-transparent via-chinese-paper/5 to-transparent',
        'text-chinese-stone-700 border-chinese-gold-400',
        'hover:bg-gradient-to-r hover:from-chinese-stone-50 hover:via-chinese-stone-100 hover:to-chinese-stone-50',
        'hover:text-chinese-stone-800 hover:shadow-[0_4px_20px_rgba(30,64,175,0.25)]',
        'hover:-translate-y-0.5',
        'active:bg-chinese-stone-200 active:text-chinese-stone-900'
      ],
      accent: [
        // 强调色 - 朱砂系，参考案例1的鲜艳色彩
        'bg-gradient-to-br from-chinese-cinnabar-500 to-chinese-cinnabar-700 text-chinese-paper border-chinese-gold-400',
        'hover:shadow-[0_8px_32px_rgba(220,38,38,0.5)] hover:shadow-chinese-cinnabar-400/20',
        'hover:border-chinese-gold-300 hover:from-chinese-cinnabar-400 hover:to-chinese-cinnabar-600',
        'hover:-translate-y-1',
        'active:from-chinese-cinnabar-600 active:to-chinese-cinnabar-800'
      ],
      text: [
        // 文本 - 最简约，参考案例3的留白美学
        'bg-transparent text-chinese-stone-600 border-transparent',
        'hover:text-chinese-cinnabar-600 hover:bg-gradient-to-r hover:from-chinese-gold-50/30 hover:to-transparent',
        'hover:border-chinese-gold-200/50',
        'active:bg-chinese-gold-100/40'
      ]
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    const allClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        className={allClasses}
        ref={ref}
        {...props}
      >
        {/* 金丝纹理装饰层 */}
        {withGoldTexture && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full gold-texture" />
          </div>
        )}
        
        {/* 飞白效果装饰层 */}
        {withFeibai && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="w-full h-full feibai-effect" />
          </div>
        )}
        
        {/* 按钮内容 */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* 悬停时的金色发光效果 - 参考案例的几何装饰 */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="w-full h-full animate-gold-glow rounded-xl" />
          {/* 几何装饰线条 - 参考案例3的十字形元素 */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-chinese-gold-300 rounded-tl opacity-60" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-chinese-gold-300 rounded-tr opacity-60" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-chinese-gold-300 rounded-bl opacity-60" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-chinese-gold-300 rounded-br opacity-60" />
        </div>
      </button>
    );
  }
);

ChineseButton.displayName = 'ChineseButton';

export { ChineseButton };