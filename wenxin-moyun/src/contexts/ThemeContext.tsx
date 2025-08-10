import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, generateCSSVariables } from '../config/theme';
import type { ThemeMode } from '../config/theme';

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
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
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
    localStorage.setItem('theme', theme);
    
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
      if (!localStorage.getItem('theme')) {
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

// Export theme-related Tailwind class helpers
export const tw = {
  // Background
  bgBase: 'bg-neutral-50 dark:bg-[#0D1117]',
  bgSurface: 'bg-gray-50 dark:bg-[#161B22]',
  bgElevated: 'bg-neutral-50 dark:bg-[#1C2128]',
  bgOverlay: 'bg-neutral-50 dark:bg-[#262C36]',
  
  // Text
  textPrimary: 'text-gray-900 dark:text-[#F0F6FC]',
  textSecondary: 'text-gray-600 dark:text-[#8B949E]',
  textTertiary: 'text-gray-500 dark:text-[#6E7681]',
  textMuted: 'text-gray-400 dark:text-[#484F58]',
  
  // Border
  borderDefault: 'border-gray-200 dark:border-[#30363D]',
  borderMuted: 'border-gray-100 dark:border-[#21262D]',
  borderStrong: 'border-gray-300 dark:border-[#48545F]',
  
  // Common combinations
  card: 'bg-neutral-50 dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]',
  cardHover: 'hover:bg-gray-50 dark:hover:bg-[#1C2128]',
  button: 'bg-[#0969DA] dark:bg-[#58A6FF] text-white hover:opacity-90',
  buttonSecondary: 'bg-gray-100 dark:bg-[#21262D] text-gray-700 dark:text-[#F0F6FC]',
};