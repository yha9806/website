import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, RotateCcw } from 'lucide-react';

interface Weight {
  name: string;
  key: string;
  value: number;
  color: string;
  description?: string;
}

interface WeightSliderProps {
  label: string;
  weights: Weight[];
  onChange: (weights: Weight[]) => void;
  showReset?: boolean;
  showTotal?: boolean;
}

export default function WeightSlider({
  label,
  weights,
  onChange,
  showReset = true,
  showTotal = true
}: WeightSliderProps) {
  const [localWeights, setLocalWeights] = useState(weights);
  const [hoveredWeight, setHoveredWeight] = useState<string | null>(null);

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleWeightChange = (key: string, value: number) => {
    const newWeights = localWeights.map(w => 
      w.key === key ? { ...w, value } : w
    );
    setLocalWeights(newWeights);
    onChange(newWeights);
  };

  const resetWeights = () => {
    const equalWeight = 100 / weights.length;
    const newWeights = localWeights.map(w => ({
      ...w,
      value: equalWeight
    }));
    setLocalWeights(newWeights);
    onChange(newWeights);
  };

  const normalizeWeights = () => {
    const total = localWeights.reduce((sum, w) => sum + w.value, 0);
    if (total === 0) return;
    
    const newWeights = localWeights.map(w => ({
      ...w,
      value: (w.value / total) * 100
    }));
    setLocalWeights(newWeights);
    onChange(newWeights);
  };

  const totalWeight = localWeights.reduce((sum, w) => sum + w.value, 0);
  const isNormalized = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {showTotal && (
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              isNormalized 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
            }`}>
              总计: {totalWeight.toFixed(1)}%
            </span>
          )}
          {showReset && (
            <button
              onClick={resetWeights}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="重置为均等权重"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {localWeights.map((weight) => (
          <div 
            key={weight.key}
            className="space-y-1"
            onMouseEnter={() => setHoveredWeight(weight.key)}
            onMouseLeave={() => setHoveredWeight(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {weight.name}
                </span>
                {weight.description && hoveredWeight === weight.key && (
                  <div className="relative">
                    <Info className="w-3 h-3 text-gray-400" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-6 top-0 z-50 w-48 p-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-lg"
                    >
                      {weight.description}
                    </motion.div>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {weight.value.toFixed(1)}%
              </span>
            </div>

            <div className="relative">
              {/* 背景轨道 */}
              <div className="h-2 bg-gray-200 dark:bg-[#21262D] rounded-full overflow-hidden">
                {/* 填充条 */}
                <motion.div
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: weight.color,
                    opacity: hoveredWeight === weight.key ? 1 : 0.8
                  }}
                  initial={false}
                  animate={{ width: `${weight.value}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* 滑块输入 */}
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weight.value}
                onChange={(e) => handleWeightChange(weight.key, Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: '20px', top: '-6px' }}
              />
            </div>

            {/* 快捷按钮 */}
            <div className="flex gap-1">
              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => handleWeightChange(weight.key, val)}
                  className={`
                    flex-1 px-1 py-0.5 text-xs rounded transition-all
                    ${weight.value === val
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-[#21262D] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262C36]'
                    }
                  `}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 归一化按钮 */}
      {!isNormalized && showTotal && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={normalizeWeights}
          className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          归一化到 100%
        </motion.button>
      )}

      {/* 视觉化饼图 */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-[#0D1117] rounded-lg">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {localWeights.reduce((acc, weight, index) => {
                const startAngle = acc.angle;
                const angle = (weight.value / 100) * 360;
                const endAngle = startAngle + angle;
                
                const startRadians = (startAngle * Math.PI) / 180;
                const endRadians = (endAngle * Math.PI) / 180;
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                const x1 = 50 + 40 * Math.cos(startRadians);
                const y1 = 50 + 40 * Math.sin(startRadians);
                const x2 = 50 + 40 * Math.cos(endRadians);
                const y2 = 50 + 40 * Math.sin(endRadians);
                
                acc.elements.push(
                  <path
                    key={weight.key}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={weight.color}
                    opacity={hoveredWeight === weight.key ? 1 : 0.8}
                    onMouseEnter={() => setHoveredWeight(weight.key)}
                    onMouseLeave={() => setHoveredWeight(null)}
                    className="transition-opacity cursor-pointer"
                  />
                );
                
                acc.angle = endAngle;
                return acc;
              }, { angle: 0, elements: [] as JSX.Element[] }).elements}
              
              {/* 中心圆 */}
              <circle 
                cx="50" 
                cy="50" 
                r="20" 
                className="fill-neutral-50 dark:fill-[#0D1117]"
              />
            </svg>
            
            {/* 中心文字 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                权重
              </span>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {localWeights.map((weight) => (
            <div 
              key={weight.key}
              className="flex items-center gap-2 text-xs"
              onMouseEnter={() => setHoveredWeight(weight.key)}
              onMouseLeave={() => setHoveredWeight(null)}
            >
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: weight.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {weight.name}: {weight.value.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}