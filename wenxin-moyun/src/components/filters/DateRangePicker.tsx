import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangePickerProps {
  label: string;
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export default function DateRangePicker({
  label,
  value,
  onChange,
  placeholder = '选择日期范围',
  minDate,
  maxDate = new Date()
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateInRange = (date: Date) => {
    if (!date || !value[0]) return false;
    
    if (value[1]) {
      return date >= value[0] && date <= value[1];
    }
    
    if (hoveredDate && value[0]) {
      const start = value[0] < hoveredDate ? value[0] : hoveredDate;
      const end = value[0] < hoveredDate ? hoveredDate : value[0];
      return date >= start && date <= end;
    }
    
    return false;
  };

  const isDateDisabled = (date: Date) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (!date || isDateDisabled(date)) return;
    
    if (!value[0] || value[1]) {
      // Start new selection
      onChange([date, null]);
    } else {
      // Complete selection
      if (date < value[0]) {
        onChange([date, value[0]]);
      } else {
        onChange([value[0], date]);
      }
    }
  };

  const changeMonth = (direction: 1 | -1) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const clearSelection = () => {
    onChange([null, null]);
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

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
        <span className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {value[0] && value[1] ? (
            <span className="text-gray-700 dark:text-gray-300">
              {formatDate(value[0])} - {formatDate(value[1])}
            </span>
          ) : value[0] ? (
            <span className="text-gray-700 dark:text-gray-300">
              {formatDate(value[0])} - ?
            </span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
      </button>

      {/* 日历面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-80 mt-2 bg-neutral-50 dark:bg-[#1C2128] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg"
          >
            {/* 月份导航 */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-[#30363D]">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#262C36] rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
              </h3>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#262C36] rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 p-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-gray-500 dark:text-gray-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日期网格 */}
            <div className="grid grid-cols-7 p-2">
              {getDaysInMonth(currentMonth).map((date, index) => (
                <div key={index} className="aspect-square p-0.5">
                  {date && (
                    <button
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={isDateDisabled(date)}
                      className={`
                        w-full h-full flex items-center justify-center text-sm rounded transition-all
                        ${isDateDisabled(date) 
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : isDateInRange(date)
                          ? 'bg-blue-500 text-white'
                          : date.toDateString() === value[0]?.toDateString() || date.toDateString() === value[1]?.toDateString()
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262C36]'
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 快捷选项 */}
            <div className="border-t border-gray-200 dark:border-[#30363D] p-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date(today);
                      lastWeek.setDate(today.getDate() - 7);
                      onChange([lastWeek, today]);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                  >
                    最近7天
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(today);
                      lastMonth.setMonth(today.getMonth() - 1);
                      onChange([lastMonth, today]);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                  >
                    最近30天
                  </button>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline px-2 py-1"
                >
                  清除
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}