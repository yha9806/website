import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/useTheme';
import { useMemo } from 'react';

interface GeometricBackgroundProps {
  variant?: 'default' | 'minimal' | 'dense';
  className?: string;
}

/**
 * Geometric Background - Scale AI inspired with 3D rotation and liquid effects
 * Features:
 * - 3D rotating geometric shapes
 * - Liquid morphing blobs
 * - Depth layers with parallax
 * - Professional, high-end aesthetic
 */
export default function GeometricBackground({
  variant = 'default',
  className = ''
}: GeometricBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Color palette - Art professional theme
  const colors = useMemo(() => ({
    // Primary shapes
    shape1: isDark ? 'rgba(200, 127, 74, 0.12)' : 'rgba(200, 127, 74, 0.06)',
    shape2: isDark ? 'rgba(51, 65, 85, 0.15)' : 'rgba(51, 65, 85, 0.05)',
    shape3: isDark ? 'rgba(100, 116, 139, 0.1)' : 'rgba(100, 116, 139, 0.04)',
    // Liquid blobs
    blob1: isDark ? 'rgba(200, 127, 74, 0.08)' : 'rgba(200, 127, 74, 0.04)',
    blob2: isDark ? 'rgba(71, 85, 105, 0.1)' : 'rgba(71, 85, 105, 0.03)',
    // Lines
    line: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    // Glow
    glow: isDark ? 'rgba(200, 127, 74, 0.15)' : 'rgba(200, 127, 74, 0.08)',
  }), [isDark]);

  // Minimal variant - just subtle gradient
  if (variant === 'minimal') {
    return (
      <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 30% 20%, rgba(200, 127, 74, 0.06) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 30% 20%, rgba(200, 127, 74, 0.03) 0%, transparent 50%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* SVG Filters for liquid effects */}
      <svg className="absolute w-0 h-0">
        <defs>
          {/* Liquid morphing filter */}
          <filter id="liquid-morph">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01"
              numOctaves="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="30s"
                values="0.01;0.02;0.01"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="30"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Blur glow filter */}
          <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients for shapes */}
          <linearGradient id="geo-gradient-1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.shape1} />
            <stop offset="100%" stopColor={colors.shape2} />
          </linearGradient>

          <linearGradient id="geo-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.shape2} />
            <stop offset="100%" stopColor={colors.shape3} />
          </linearGradient>

          <radialGradient id="blob-gradient-1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.glow} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      {/* Layer 1: Liquid Blob - Top Right */}
      <motion.div
        className="absolute"
        style={{
          top: '-10%',
          right: '-15%',
          width: '60vw',
          height: '60vw',
          maxWidth: '800px',
          maxHeight: '800px',
        }}
        animate={{
          scale: [1, 1.1, 1, 0.95, 1],
          rotate: [0, 5, 0, -5, 0],
          x: [0, 20, 0, -20, 0],
          y: [0, -10, 0, 10, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'url(#liquid-morph)' }}>
          <motion.path
            d="M 100 20
               C 150 20, 180 50, 180 100
               C 180 150, 150 180, 100 180
               C 50 180, 20 150, 20 100
               C 20 50, 50 20, 100 20"
            fill={colors.blob1}
            animate={{
              d: [
                "M 100 20 C 150 20, 180 50, 180 100 C 180 150, 150 180, 100 180 C 50 180, 20 150, 20 100 C 20 50, 50 20, 100 20",
                "M 100 30 C 140 15, 185 60, 175 100 C 165 145, 140 175, 100 170 C 55 165, 25 140, 30 100 C 35 55, 60 35, 100 30",
                "M 100 25 C 155 30, 175 55, 170 100 C 165 150, 145 170, 100 175 C 50 170, 30 145, 25 100 C 30 50, 55 25, 100 25",
                "M 100 20 C 150 20, 180 50, 180 100 C 180 150, 150 180, 100 180 C 50 180, 20 150, 20 100 C 20 50, 50 20, 100 20",
              ]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>

      {/* Layer 2: 3D Rotating Triangle - Right side */}
      <motion.div
        className="absolute"
        style={{
          top: '15%',
          right: '5%',
          width: '400px',
          height: '400px',
          perspective: '1000px',
        }}
        animate={{
          rotateY: [0, 180, 360],
          rotateX: [0, 10, 0, -10, 0],
        }}
        transition={{
          rotateY: {
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          },
          rotateX: {
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Triangle front face */}
          <motion.path
            d="M 100 30 L 170 150 L 30 150 Z"
            fill="url(#geo-gradient-1)"
            style={{ filter: 'blur(1px)' }}
          />
          {/* Triangle inner outline */}
          <path
            d="M 100 50 L 150 135 L 50 135 Z"
            stroke={colors.line}
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Layer 3: 3D Cube outline - Left side */}
      <motion.div
        className="absolute"
        style={{
          bottom: '10%',
          left: '-5%',
          width: '350px',
          height: '350px',
          perspective: '800px',
        }}
        animate={{
          rotateY: [0, 90, 180, 270, 360],
          rotateX: [15, 25, 15, 5, 15],
          rotateZ: [0, 5, 0, -5, 0],
        }}
        transition={{
          rotateY: {
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          },
          rotateX: {
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          rotateZ: {
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Cube - front face */}
          <rect
            x="50"
            y="50"
            width="100"
            height="100"
            fill="url(#geo-gradient-2)"
            rx="4"
            style={{ filter: 'blur(2px)' }}
          />
          {/* Cube - top edge (3D illusion) */}
          <path
            d="M 50 50 L 70 30 L 170 30 L 150 50"
            fill={colors.shape3}
            opacity="0.5"
          />
          {/* Cube - right edge (3D illusion) */}
          <path
            d="M 150 50 L 170 30 L 170 130 L 150 150"
            fill={colors.shape1}
            opacity="0.3"
          />
        </svg>
      </motion.div>

      {/* Layer 4: Liquid Blob - Bottom center */}
      <motion.div
        className="absolute"
        style={{
          bottom: '-20%',
          left: '30%',
          width: '50vw',
          height: '50vw',
          maxWidth: '600px',
          maxHeight: '600px',
        }}
        animate={{
          scale: [1, 1.15, 1, 0.9, 1],
          x: [0, -30, 0, 30, 0],
          y: [0, 15, 0, -15, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'url(#liquid-morph)' }}>
          <motion.ellipse
            cx="100"
            cy="100"
            fill={colors.blob2}
            animate={{
              rx: [80, 90, 75, 85, 80],
              ry: [70, 80, 85, 75, 70],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>

      {/* Layer 5: Floating accent circles */}
      <motion.div
        className="absolute"
        style={{
          top: '50%',
          left: '60%',
          width: '150px',
          height: '150px',
        }}
        animate={{
          y: [0, -30, 0, 30, 0],
          x: [0, 15, 0, -15, 0],
          scale: [1, 1.1, 1, 0.9, 1],
          opacity: [0.6, 0.8, 0.6, 0.4, 0.6],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="url(#blob-gradient-1)"
            style={{ filter: 'blur(20px)' }}
          />
        </svg>
      </motion.div>

      {/* Layer 6: Perspective lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.line
          x1="0"
          y1="100"
          x2="100"
          y2="0"
          stroke={colors.line}
          strokeWidth="0.1"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.line
          x1="20"
          y1="100"
          x2="100"
          y2="20"
          stroke={colors.line}
          strokeWidth="0.05"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.line
          x1="0"
          y1="80"
          x2="80"
          y2="0"
          stroke={colors.line}
          strokeWidth="0.05"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>

      {/* Layer 7: Warm glow accent */}
      <motion.div
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Dense variant: Add grid */}
      {variant === 'dense' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${colors.line} 1px, transparent 1px),
              linear-gradient(90deg, ${colors.line} 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            opacity: isDark ? 0.3 : 0.2,
          }}
        />
      )}

      {/* Layer 8: Noise texture for authenticity */}
      <div
        className="absolute inset-0 opacity-[0.012] dark:opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

/**
 * Hero Background - More dramatic for landing sections
 */
export function HeroBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large decorative 3D shape */}
      <motion.div
        className="absolute -right-20 top-1/4"
        style={{ perspective: '1200px' }}
        initial={{ opacity: 0, x: 100, rotateY: -30 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <motion.svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: [0, 10, 0, -10, 0],
            rotateX: [0, -5, 0, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <defs>
            <linearGradient id="hero-grad-main" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isDark ? 'rgba(200, 127, 74, 0.2)' : 'rgba(200, 127, 74, 0.1)'} />
              <stop offset="50%" stopColor={isDark ? 'rgba(51, 65, 85, 0.15)' : 'rgba(51, 65, 85, 0.05)'} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="hero-grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? 'rgba(200, 127, 74, 0.15)' : 'rgba(200, 127, 74, 0.08)'} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Abstract art frame - pentagonal prism */}
          <motion.path
            d="M250 50 L450 200 L400 450 L100 400 L50 150 Z"
            fill="url(#hero-grad-main)"
            style={{ filter: 'blur(2px)' }}
            animate={{
              d: [
                "M250 50 L450 200 L400 450 L100 400 L50 150 Z",
                "M250 60 L440 190 L410 440 L110 410 L60 160 Z",
                "M250 50 L450 200 L400 450 L100 400 L50 150 Z",
              ]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Inner frame - creates depth */}
          <path
            d="M250 100 L380 200 L350 380 L150 350 L100 180 Z"
            stroke={isDark ? 'rgba(200, 127, 74, 0.12)' : 'rgba(200, 127, 74, 0.06)'}
            strokeWidth="1"
            fill="none"
          />

          {/* Innermost frame */}
          <path
            d="M250 150 L320 210 L300 320 L180 300 L150 200 Z"
            stroke={isDark ? 'rgba(200, 127, 74, 0.08)' : 'rgba(200, 127, 74, 0.04)'}
            strokeWidth="0.5"
            fill="url(#hero-grad-accent)"
            opacity="0.5"
          />
        </motion.svg>
      </motion.div>

      {/* Floating accent orb */}
      <motion.div
        className="absolute left-10 bottom-1/4 w-64 h-64"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${isDark ? 'rgba(200, 127, 74, 0.1)' : 'rgba(200, 127, 74, 0.05)'} 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </motion.div>
    </div>
  );
}
