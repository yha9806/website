import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { IOSToggle, EmojiIcon } from '../ios';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <IOSToggle
      checked={theme === 'dark'}
      onChange={() => toggleTheme()}
      color="primary"
      size="sm"
      leftIcon={<Sun className="w-3 h-3 text-amber-500" />}
      rightIcon={<Moon className="w-3 h-3 text-blue-400" />}
    />
  );
}

// 带文字的主题切换按钮变体
export function ThemeToggleWithLabel() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#21262D] border border-gray-200 dark:border-[#30363D] transition-all duration-200 hover:bg-gray-200 dark:hover:bg-[#30363D]"
    >
      {theme === 'light' ? (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark</span>
        </>
      )}
    </motion.button>
  );
}

// 紧凑的主题切换开关
export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <IOSToggle
      checked={theme === 'dark'}
      onChange={() => toggleTheme()}
      color="primary"
      size="sm"
      showLabel={false}
      leftIcon={<Sun className="w-3 h-3 text-amber-500" />}
      rightIcon={<Moon className="w-3 h-3 text-blue-400" />}
    />
  );
}

// 语言切换组件
function LanguageToggle() {
  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    return (localStorage.getItem('language') as 'zh' | 'en') || 'en';
  });

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <IOSToggle
      checked={language === 'en'}
      onChange={toggleLanguage}
      color="green"
      size="sm"
      leftIcon={<span className="text-xs font-medium">CN</span>}
      rightIcon={<span className="text-xs font-medium">EN</span>}
    />
  );
}

// 整合的头部控制组件
export function HeaderControls() {
  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
}