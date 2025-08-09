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
  // 默认使用深色主题
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // 从 localStorage 读取用户偏好
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    // 如果没有保存的主题，检查系统偏好
    if (!savedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return savedTheme;
  });

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    
    // 移除旧的主题类
    root.classList.remove('light', 'dark');
    // 添加新的主题类
    root.classList.add(theme);
    
    // 生成并应用 CSS 变量
    const cssVariables = generateCSSVariables(themes[theme]);
    const styleElement = document.getElementById('theme-variables') || document.createElement('style');
    styleElement.id = 'theme-variables';
    styleElement.textContent = `:root { ${cssVariables} }`;
    
    if (!document.getElementById('theme-variables')) {
      document.head.appendChild(styleElement);
    }
    
    // 保存到 localStorage
    localStorage.setItem('theme', theme);
    
    // 更新 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themes[theme].bg.base);
    }
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在用户没有手动设置主题时才跟随系统
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
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

// 导出主题相关的 Tailwind 类名助手
export const tw = {
  // 背景
  bgBase: 'bg-neutral-50 dark:bg-[#0D1117]',
  bgSurface: 'bg-gray-50 dark:bg-[#161B22]',
  bgElevated: 'bg-neutral-50 dark:bg-[#1C2128]',
  bgOverlay: 'bg-neutral-50 dark:bg-[#262C36]',
  
  // 文字
  textPrimary: 'text-gray-900 dark:text-[#F0F6FC]',
  textSecondary: 'text-gray-600 dark:text-[#8B949E]',
  textTertiary: 'text-gray-500 dark:text-[#6E7681]',
  textMuted: 'text-gray-400 dark:text-[#484F58]',
  
  // 边框
  borderDefault: 'border-gray-200 dark:border-[#30363D]',
  borderMuted: 'border-gray-100 dark:border-[#21262D]',
  borderStrong: 'border-gray-300 dark:border-[#48545F]',
  
  // 常用组合
  card: 'bg-neutral-50 dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]',
  cardHover: 'hover:bg-gray-50 dark:hover:bg-[#1C2128]',
  button: 'bg-[#0969DA] dark:bg-[#58A6FF] text-white hover:opacity-90',
  buttonSecondary: 'bg-gray-100 dark:bg-[#21262D] text-gray-700 dark:text-[#F0F6FC]',
};