import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/useTheme';
import { motion } from 'framer-motion';
import { IOSToggle } from '../ios';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <IOSToggle
      checked={theme === 'dark'}
      onChange={() => toggleTheme()}
      color="primary"
      size="sm"
      leftIcon={<Sun className="w-3 h-3 text-amber-500" />}
      rightIcon={<Moon className="w-3 h-3 text-slate-500" />}
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
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#1A1614] border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-800"
    >
      {theme === 'light' ? (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-500" />
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
      leftIcon={<Sun className="w-3 h-3 text-amber-500" />}
      rightIcon={<Moon className="w-3 h-3 text-slate-500" />}
    />
  );
}

// 整合的头部控制组件（语言切换功能已搁置）
export function HeaderControls() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
    </div>
  );
}