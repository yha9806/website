import { motion } from 'framer-motion';

interface VulcaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animate?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'hero';
}

/**
 * VULCA Logo - Extreme minimalist design with 3D perspective
 * Inspired by Scale AI's sophisticated geometric approach
 * Represents multiple cultural perspectives converging
 */
export default function VulcaLogo({
  size = 'md',
  showText = true,
  animate = true,
  className = '',
  variant = 'default'
}: VulcaLogoProps) {
  const sizeConfig = {
    sm: { icon: 28, text: 'text-sm', sub: 'text-[9px]', gap: 'gap-2' },
    md: { icon: 36, text: 'text-base', sub: 'text-[10px]', gap: 'gap-2.5' },
    lg: { icon: 44, text: 'text-lg', sub: 'text-xs', gap: 'gap-3' },
    xl: { icon: 56, text: 'text-xl', sub: 'text-sm', gap: 'gap-3.5' }
  };

  const config = sizeConfig[size];

  // 3D rotation animation for the logo mark
  const rotateAnimation = animate ? {
    rotateY: [0, 10, 0, -10, 0],
    rotateX: [0, -5, 0, 5, 0],
  } : {};

  // Hover animation
  const hoverAnimation = animate ? {
    scale: 1.05,
    rotateY: 15,
  } : {};

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {/* Logo Mark - 3D Prismatic V */}
      <motion.div
        className="relative"
        style={{ perspective: '500px' }}
        animate={rotateAnimation}
        whileHover={hoverAnimation}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            transformStyle: 'preserve-3d',
          }}
        >
          <defs>
            {/* Primary gradient - Deep slate to warm copper */}
            <linearGradient id="vulca-prism-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#C87F4A" />
            </linearGradient>

            {/* Highlight gradient for 3D effect */}
            <linearGradient id="vulca-prism-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Shadow gradient for depth */}
            <linearGradient id="vulca-prism-shadow" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Copper accent */}
            <linearGradient id="vulca-copper" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C87F4A" />
              <stop offset="100%" stopColor="#E8A66A" />
            </linearGradient>
          </defs>

          {/* Back face of prism - creates depth */}
          <path
            d="M24 6 L42 38 L24 34 L6 38 Z"
            fill="url(#vulca-prism-shadow)"
            opacity="0.6"
          />

          {/* Left face of V prism */}
          <path
            d="M6 38 L24 6 L24 34 Z"
            fill="url(#vulca-prism-main)"
          />

          {/* Right face of V prism - lighter for 3D effect */}
          <path
            d="M24 6 L42 38 L24 34 Z"
            fill="url(#vulca-prism-light)"
            opacity="0.85"
          />

          {/* Central spine - copper accent */}
          <path
            d="M24 10 L24 32"
            stroke="url(#vulca-copper)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Bottom edge highlight */}
          <path
            d="M8 37 L24 33 L40 37"
            stroke="url(#vulca-copper)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.7"
          />

          {/* Subtle inner glow */}
          <circle
            cx="24"
            cy="24"
            r="8"
            fill="url(#vulca-copper)"
            opacity="0.1"
            style={{ filter: 'blur(4px)' }}
          />
        </svg>
      </motion.div>

      {/* Text - Clean typography */}
      {showText && (
        <motion.div
          className="hidden sm:block"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className={`${config.text} font-semibold tracking-tight text-gray-900 dark:text-gray-100`}>
            VULCA
          </h1>
          {variant !== 'minimal' && (
            <p className={`${config.sub} text-gray-500 dark:text-gray-400 tracking-wide font-medium`}>
              Cultural AI Evaluation
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Hero variant - Larger, more dramatic for landing pages
 */
export function VulcaLogoHero({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`flex flex-col items-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div
        style={{ perspective: '1000px' }}
        animate={{
          rotateY: [0, 5, 0, -5, 0],
          rotateX: [0, -3, 0, 3, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 8px 32px rgba(200, 127, 74, 0.3))',
            transformStyle: 'preserve-3d',
          }}
        >
          <defs>
            <linearGradient id="hero-prism-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#C87F4A" />
            </linearGradient>
            <linearGradient id="hero-prism-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="hero-prism-shadow" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="hero-copper" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C87F4A" />
              <stop offset="100%" stopColor="#E8A66A" />
            </linearGradient>
          </defs>
          <path d="M24 6 L42 38 L24 34 L6 38 Z" fill="url(#hero-prism-shadow)" opacity="0.6" />
          <path d="M6 38 L24 6 L24 34 Z" fill="url(#hero-prism-main)" />
          <path d="M24 6 L42 38 L24 34 Z" fill="url(#hero-prism-light)" opacity="0.85" />
          <path d="M24 10 L24 32" stroke="url(#hero-copper)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d="M8 37 L24 33 L40 37" stroke="url(#hero-copper)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
        </svg>
      </motion.div>

      <motion.h1
        className="mt-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        VULCA
      </motion.h1>
      <motion.p
        className="mt-2 text-lg text-gray-500 dark:text-gray-400 tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Cultural AI Evaluation
      </motion.p>
    </motion.div>
  );
}

/**
 * Minimal logo for footer and compact spaces
 */
export function VulcaLogoMinimal({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-7 h-7 relative">
        <svg
          width="28"
          height="28"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#C87F4A" />
            </linearGradient>
          </defs>
          <path d="M6 38 L24 6 L24 34 Z" fill="url(#mini-grad)" />
          <path d="M24 6 L42 38 L24 34 Z" fill="#64748b" opacity="0.7" />
        </svg>
      </div>
      <span className="text-gray-900 dark:text-gray-100 font-semibold tracking-tight">
        VULCA
      </span>
    </div>
  );
}
