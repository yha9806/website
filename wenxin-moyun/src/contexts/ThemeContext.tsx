import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, generateCSSVariables } from '../config/theme';
import type { ThemeMode } from '../config/theme';
import { getItem, setItem } from '../utils/storageUtils';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to dark theme
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Read user preference from localStorage
    const savedTheme = getItem('theme') as ThemeMode;
    // If no saved theme, check system preference
    if (!savedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return savedTheme;
  });

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove old theme class
    root.classList.remove('light', 'dark');
    // Add new theme class
    root.classList.add(theme);
    
    // Generate and apply CSS variables
    const cssVariables = generateCSSVariables(themes[theme]);
    const styleElement = document.getElementById('theme-variables') || document.createElement('style');
    styleElement.id = 'theme-variables';
    styleElement.textContent = `:root { ${cssVariables} }`;
    
    if (!document.getElementById('theme-variables')) {
      document.head.appendChild(styleElement);
    }
    
    // Save to localStorage
    setItem('theme', theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themes[theme].bg.base);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only follow system when user hasn't manually set theme
      if (!getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    // Add transition animation class
    document.documentElement.classList.add('theme-transition');
    
    // Toggle theme
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    
    // Remove transition class after animation to avoid affecting other animations
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export theme-related Tailwind class helpers (Art Professional palette)
export const tw = {
  // Background - Art Professional warm tones
  bgBase: 'bg-white dark:bg-[#0F0D0C]',
  bgSurface: 'bg-gray-50 dark:bg-[#1A1614]',
  bgElevated: 'bg-white dark:bg-[#252220]',
  bgOverlay: 'bg-white dark:bg-[#302D2B]',

  // Text - Warm gray tones
  textPrimary: 'text-gray-900 dark:text-gray-100',
  textSecondary: 'text-gray-600 dark:text-gray-400',
  textTertiary: 'text-gray-500 dark:text-gray-500',
  textMuted: 'text-gray-400 dark:text-gray-600',

  // Border - Warm brown tones
  borderDefault: 'border-gray-200 dark:border-gray-700',
  borderMuted: 'border-gray-100 dark:border-gray-800',
  borderStrong: 'border-gray-300 dark:border-gray-600',

  // Common combinations
  card: 'bg-white dark:bg-[#1A1614] border border-gray-200 dark:border-gray-700',
  cardHover: 'hover:bg-gray-50 dark:hover:bg-[#252220]',
  button: 'bg-slate-700 dark:bg-slate-600 text-white hover:opacity-90',
  buttonSecondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100',
};