import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxHeight?: number;
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = '选择...',
  maxHeight = 300
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 过滤选项
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearch('');
  };

  const selectAll = () => {
    onChange(options);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-neutral-50 dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-lg flex items-center justify-between hover:border-gray-300 dark:hover:border-[#48545F] transition-colors"
      >
        <span className="text-sm truncate">
          {value.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : value.length === 1 ? (
            value[0]
          ) : (
            `已选择 ${value.length} 项`
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 已选择的标签 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.slice(0, 3).map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
            >
              {item}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(item);
                }}
                className="hover:text-blue-800 dark:hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {value.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
              +{value.length - 3} 更多
            </span>
          )}
        </div>
      )}

      {/* 下拉面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-neutral-50 dark:bg-[#1C2128] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg"
          >
            {/* 搜索框 */}
            <div className="p-2 border-b border-gray-200 dark:border-[#30363D]">
              <input
                type="text"
                aria-label="Search options"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索..."
                className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* 快捷操作 */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-[#30363D]">
              <button
                onClick={selectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                全选
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
              >
                清除
              </button>
            </div>

            {/* 选项列表 */}
            <div className="overflow-y-auto" style={{ maxHeight }}>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  无匹配项
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = value.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleOption(option)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#262C36] transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {option}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}