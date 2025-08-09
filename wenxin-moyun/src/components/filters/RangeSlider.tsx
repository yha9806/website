import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  unit?: string;
  showValues?: boolean;
}

export default function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  showValues = true
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin <= localValue[1]) {
      setLocalValue([newMin, localValue[1]]);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax >= localValue[0]) {
      setLocalValue([localValue[0], newMax]);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onChange(localValue);
      setIsDragging(false);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // 计算滑块位置百分比
  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {showValues && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {localValue[0]}{unit} - {localValue[1]}{unit}
          </span>
        )}
      </div>

      <div className="relative pt-5 pb-1">
        {/* 背景轨道 */}
        <div className="absolute top-2 left-0 right-0 h-2 bg-gray-200 dark:bg-[#21262D] rounded-full" />
        
        {/* 激活轨道 */}
        <motion.div
          className="absolute top-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`
          }}
          initial={false}
          animate={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`
          }}
          transition={{ duration: 0.1 }}
        />

        {/* 最小值滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="absolute top-0 w-full h-4 bg-transparent appearance-none cursor-pointer z-20 slider-thumb"
          style={{
            background: 'transparent',
            pointerEvents: 'none'
          }}
        />

        {/* 最大值滑块 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="absolute top-0 w-full h-4 bg-transparent appearance-none cursor-pointer z-20 slider-thumb"
          style={{
            background: 'transparent',
            pointerEvents: 'none'
          }}
        />

        {/* 自定义滑块 */}
        <motion.div
          className="absolute top-0 w-4 h-4 bg-neutral-50 dark:bg-[#F0F6FC] border-2 border-blue-500 dark:border-blue-400 rounded-full shadow-md cursor-pointer z-30"
          style={{ left: `calc(${minPercent}% - 8px)` }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseDown={handleMouseDown}
        />
        <motion.div
          className="absolute top-0 w-4 h-4 bg-neutral-50 dark:bg-[#F0F6FC] border-2 border-blue-500 dark:border-blue-400 rounded-full shadow-md cursor-pointer z-30"
          style={{ left: `calc(${maxPercent}% - 8px)` }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseDown={handleMouseDown}
        />

        {/* 刻度标记 */}
        <div className="absolute top-6 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{min}{unit}</span>
          <span>{Math.round((min + max) / 2)}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      {/* 输入框（可选） */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="number"
          min={min}
          max={localValue[1]}
          step={step}
          value={localValue[0]}
          onChange={(e) => {
            const newMin = Number(e.target.value);
            if (newMin >= min && newMin <= localValue[1]) {
              const newValue: [number, number] = [newMin, localValue[1]];
              setLocalValue(newValue);
              onChange(newValue);
            }
          }}
          className="w-20 px-2 py-1 text-sm bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
        />
        <span className="text-gray-500 dark:text-gray-400">-</span>
        <input
          type="number"
          min={localValue[0]}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => {
            const newMax = Number(e.target.value);
            if (newMax <= max && newMax >= localValue[0]) {
              const newValue: [number, number] = [localValue[0], newMax];
              setLocalValue(newValue);
              onChange(newValue);
            }
          }}
          className="w-20 px-2 py-1 text-sm bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
        />
      </div>
    </div>
  );
}

// 添加样式到全局 CSS
const sliderStyles = `
  .slider-thumb::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: transparent;
    cursor: pointer;
    pointer-events: all;
  }
  
  .slider-thumb::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: transparent;
    cursor: pointer;
    pointer-events: all;
    border: none;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = sliderStyles;
  document.head.appendChild(styleSheet);
}