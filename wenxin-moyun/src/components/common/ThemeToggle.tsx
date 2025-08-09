import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-[#21262D] border border-gray-200 dark:border-[#30363D] transition-all duration-200 hover:bg-gray-200 dark:hover:bg-[#30363D]"
      aria-label={`切换到${theme === 'light' ? '深色' : '浅色'}模式`}
    >
      <div className="relative w-5 h-5">
        {/* 太阳图标 - 浅色模式显示 */}
        <Sun
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-180 scale-0'
          }`}
        />
        
        {/* 月亮图标 - 深色模式显示 */}
        <Moon
          className={`absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-180 scale-0'
          }`}
        />
      </div>
    </motion.button>
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
          <span className="text-sm text-gray-700 dark:text-gray-300">浅色</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">深色</span>
        </>
      )}
    </motion.button>
  );
}

// 紧凑的主题切换开关
export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-[#30363D] transition-colors duration-200"
      aria-label="切换主题"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-neutral-50 dark:bg-[#58A6FF] transition-transform duration-200 ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-white" />
        )}
      </span>
    </button>
  );
}