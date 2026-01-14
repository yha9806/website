/** @type {import('tailwindcss').Config} */

/**
 * Art Professional Design System Configuration
 *
 * 设计理念: 温暖、专业、艺术品味
 * 参考: 博物馆、画廊、艺术期刊的视觉语言
 *
 * 更新日期: 2026-01-14
 * 设计系统版本: Art Professional v1.0
 */

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Art Professional Color System
        // 主色: 墨石灰 - 专业沉稳
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
          DEFAULT: '#334155',
        },
        // 强调色: 暖铜棕 - 艺术品味
        bronze: {
          50: '#FDF8F4',
          100: '#FAEFE6',
          200: '#F4DCC9',
          300: '#EBC4A1',
          400: '#DDA574',
          500: '#C87F4A', // 主暖铜棕
          600: '#B06B3A',
          700: '#8F5530',
          800: '#6D4127',
          900: '#4A2C1A',
          DEFAULT: '#C87F4A',
        },
        // 兼容色: 保留 blue 用于系统兼容
        blue: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B', // 替换为 slate
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          DEFAULT: '#334155',
        },
        green: {
          50: '#E6F7EC',
          100: '#CEF0D9',
          200: '#9DE1B3',
          300: '#6BD28D',
          400: '#4AC771',
          500: '#34C759', // iOS Green
          600: '#2AA047',
          700: '#1F7835',
          800: '#155024',
          900: '#0A2812',
          DEFAULT: '#34C759',
        },
        orange: {
          50: '#FFF4E5',
          100: '#FFE9CC',
          200: '#FFD399',
          300: '#FFBC66',
          400: '#FFA633',
          500: '#FF9500', // iOS Orange
          600: '#CC7700',
          700: '#995900',
          800: '#663C00',
          900: '#331E00',
          DEFAULT: '#FF9500',
        },
        red: {
          50: '#FFEBE9',
          100: '#FFD6D3',
          200: '#FFADA7',
          300: '#FF857B',
          400: '#FF5C4F',
          500: '#FF3B30', // iOS Red
          600: '#CC2F26',
          700: '#99231D',
          800: '#661813',
          900: '#330C09',
          DEFAULT: '#FF3B30',
        },
        // 辅助暖色: 陶土色 - 用于次要强调
        purple: {
          50: '#FAF5F0',
          100: '#F4EAE0',
          200: '#E8D4C2',
          300: '#D9B99A',
          400: '#C49976',
          500: '#9B6B56', // 陶土色 (替代紫色)
          600: '#7D5645',
          700: '#5F4235',
          800: '#422E25',
          900: '#251A15',
          DEFAULT: '#9B6B56',
        },
        
        // iOS Gray Scale
        gray: {
          50: '#F2F2F7',   // iOS Light Gray 6
          100: '#E5E5EA',  // iOS Light Gray 5  
          200: '#D1D1D6',  // iOS Light Gray 4
          300: '#C7C7CC',  // iOS Light Gray 3
          400: '#AEAEB2',  // iOS Light Gray 2
          500: '#8E8E93',  // iOS Light Gray
          600: '#636366',  // iOS Dark Gray
          700: '#48484A',  // iOS Dark Gray 2
          800: '#3A3A3C',  // iOS Dark Gray 3
          900: '#1C1C1E',  // iOS Dark Gray 4
          950: '#000000',  // iOS Dark Gray 6
        },
        
        // Neutral mapping for compatibility
        neutral: {
          50: '#F2F2F7',
          100: '#E5E5EA', 
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#1C1C1E',
          950: '#000000',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        text: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      boxShadow: {
        'ios-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'ios-md': '0 4px 6px rgba(0,0,0,0.07)',
        'ios-lg': '0 10px 15px rgba(0,0,0,0.1)',
        'ios-xl': '0 20px 25px rgba(0,0,0,0.15)',
        'ios-2xl': '0 25px 50px rgba(0,0,0,0.25)',
        'ios-inner': 'inset 0 1px 3px rgba(0,0,0,0.06)',
        'ios-focus': '0 0 0 3px rgba(0,122,255,0.5)',
      },
      borderRadius: {
        'ios-sm': '6px',
        'ios': '10px',
        'ios-md': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
        'ios-2xl': '24px',
        'ios-3xl': '32px',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ios-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}