import React, { useState, useEffect } from 'react';
import { themes, generateCSSVariables } from '../config/theme';
import type { ThemeMode } from '../config/theme';
import { getItem, setItem } from '../utils/storageUtils';
import { ThemeContext } from './themeContext.shared';

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
