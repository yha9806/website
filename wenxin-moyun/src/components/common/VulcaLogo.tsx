import { motion } from 'framer-motion';

interface VulcaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
  variant?: 'default' | 'header' | 'footer' | 'hero';
}

/**
 * V 形图标组件 - 品牌标志
 */
function VulcaIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeConfig = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${sizeConfig[size]} ${className}`}
    >
      <path
        d="M4 6L12 18L20 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-bronze-500"
      />
    </svg>
  );
}

/**
 * VULCA Logo - 带图标的标准版本
 *
 * 设计理念：
 * - V 形图标 + 文字组合
 * - 图标使用品牌暖铜色
 * - 文字根据变体调整颜色
 */
export default function VulcaLogo({
  size = 'md',
  showSubtitle = false,
  showIcon = true,
  animate = true,
  className = '',
  variant = 'default'
}: VulcaLogoProps) {
  const sizeConfig = {
    sm: {
      text: 'text-lg',
      subtitle: 'text-[10px]',
      tracking: 'tracking-tight',
      weight: 'font-bold',
      gap: 'gap-1.5',
    },
    md: {
      text: 'text-xl',
      subtitle: 'text-xs',
      tracking: 'tracking-tight',
      weight: 'font-extrabold',
      gap: 'gap-2',
    },
    lg: {
      text: 'text-2xl',
      subtitle: 'text-sm',
      tracking: 'tracking-tight',
      weight: 'font-extrabold',
      gap: 'gap-2',
    },
    xl: {
      text: 'text-4xl',
      subtitle: 'text-base',
      tracking: 'tracking-tight',
      weight: 'font-black',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  // 根据变体决定颜色
  const getColorClasses = () => {
    switch (variant) {
      case 'header':
        return 'text-gray-900 dark:text-white';
      case 'footer':
        return 'text-gray-900 dark:text-white';
      case 'hero':
        return 'text-bronze-500';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  const LogoContent = (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {showIcon && <VulcaIcon size={size} />}
      <div className="flex flex-col">
        <span
          className={`
            ${config.text}
            ${config.weight}
            ${config.tracking}
            ${getColorClasses()}
            font-sans
            select-none
            transition-colors duration-300
          `}
          style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          VULCA
        </span>
        {showSubtitle && (
          <span
            className={`
              ${config.subtitle}
              text-gray-500 dark:text-gray-400
              font-medium
              tracking-wide
            `}
          >
            Cultural AI Evaluation
          </span>
        )}
      </div>
    </div>
  );

  if (!animate) {
    return LogoContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      {LogoContent}
    </motion.div>
  );
}

/**
 * Hero 版本 - 用于首页大标题
 */
export function VulcaLogoHero({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-center gap-4 mb-4">
        <VulcaIcon size="xl" />
        <h1
          className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-bronze-500 select-none"
          style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            letterSpacing: '-0.04em',
          }}
        >
          VULCA
        </h1>
      </div>
      <motion.p
        className="mt-4 text-lg md:text-xl text-gray-500 dark:text-gray-400 tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Cultural AI Evaluation
      </motion.p>
    </motion.div>
  );
}

/**
 * 极简版本 - 用于紧凑空间
 */
export function VulcaLogoMinimal({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <VulcaIcon size="sm" />
      <span
        className="text-lg font-bold tracking-tight text-gray-900 dark:text-white select-none"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        VULCA
      </span>
    </div>
  );
}

// 导出图标组件供单独使用
export { VulcaIcon };
