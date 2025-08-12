import { useEffect, useRef, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '../../types/types';

interface ScatterPlotProps {
  data: LeaderboardEntry[];
  xAxis: 'score' | 'winRate' | 'battles';
  yAxis: 'score' | 'winRate' | 'battles' | 'creativity' | 'cultural';
  title?: string;
  onModelClick?: (entry: LeaderboardEntry) => void;
}

export default function ScatterPlot({ 
  data, 
  xAxis, 
  yAxis, 
  title = "Model Performance Distribution",
  onModelClick 
}: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 计算数据范围和比例尺
  const { xScale, yScale, xLabel, yLabel, getAxisValue } = useMemo(() => {
    const getAxisValue = (entry: LeaderboardEntry, axis: string) => {
      switch (axis) {
        case 'score': return entry.score;
        case 'winRate': return entry.winRate;
        case 'battles': return entry.battles;
        case 'creativity': return entry.model.metrics.creativity;
        case 'cultural': return entry.model.metrics.cultural;
        default: return 0;
      }
    };

    const getAxisLabel = (axis: string) => {
      switch (axis) {
        case 'score': return 'Overall Score';
        case 'winRate': return 'Win Rate (%)';
        case 'battles': return 'Battle Count';
        case 'creativity': return 'Creativity Score';
        case 'cultural': return 'Cultural Score';
        default: return '';
      }
    };

    // Filter out NULL values for domain calculations
    const xValues = data.map(d => getAxisValue(d, xAxis)).filter(v => v != null);
    const yValues = data.map(d => getAxisValue(d, yAxis)).filter(v => v != null);

    const xDomain = xValues.length > 0 ? 
      [Math.min(...xValues) * 0.9, Math.max(...xValues) * 1.1] : [0, 100];
    const yDomain = yValues.length > 0 ? 
      [Math.min(...yValues) * 0.9, Math.max(...yValues) * 1.1] : [0, 100];

    const xScale = scaleLinear()
      .domain(xDomain)
      .range([60, 540]);

    const yScale = scaleLinear()
      .domain(yDomain)
      .range([340, 60]);

    return {
      xScale,
      yScale,
      xLabel: getAxisLabel(xAxis),
      yLabel: getAxisLabel(yAxis),
      getAxisValue
    };
  }, [data, xAxis, yAxis]);

  // 获取模型分类颜色
  const getColorByCategory = (category: string) => {
    switch (category) {
      case 'text': return '#3b82f6'; // blue
      case 'visual': return '#10b981'; // green
      case 'multimodal': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="bg-neutral-50 dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {title}
      </h3>
      
      <div className="relative">
        <svg
          ref={svgRef}
          width="600"
          height="400"
          className="w-full h-auto"
          viewBox="0 0 600 400"
        >
          {/* Grid Lines */}
          <g className="opacity-20">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <line
                key={`h-${i}`}
                x1="60"
                x2="540"
                y1={60 + i * 56}
                y2={60 + i * 56}
                stroke="currentColor"
                strokeDasharray="2,2"
              />
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <line
                key={`v-${i}`}
                x1={60 + i * 60}
                x2={60 + i * 60}
                y1="60"
                y2="340"
                stroke="currentColor"
                strokeDasharray="2,2"
              />
            ))}
          </g>

          {/* Axes */}
          <line x1="60" x2="540" y1="340" y2="340" stroke="currentColor" strokeWidth="2" />
          <line x1="60" x2="60" y1="60" y2="340" stroke="currentColor" strokeWidth="2" />

          {/* Axis Labels */}
          <text
            x="300"
            y="380"
            textAnchor="middle"
            className="fill-gray-600 dark:fill-gray-400 text-sm font-medium"
          >
            {xLabel}
          </text>
          <text
            x="30"
            y="200"
            textAnchor="middle"
            transform="rotate(-90, 30, 200)"
            className="fill-gray-600 dark:fill-gray-400 text-sm font-medium"
          >
            {yLabel}
          </text>

          {/* Data Points */}
          {data.map((entry, index) => {
            const xValue = getAxisValue(entry, xAxis);
            const yValue = getAxisValue(entry, yAxis);
            
            // Handle NULL values by using fallback positions
            const safeXValue = xValue ?? 50;
            const safeYValue = yValue ?? 50;
            const x = xScale(safeXValue);
            const y = yScale(safeYValue);
            
            return (
              <motion.g
                key={entry.model.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
              >
                {/* Hover Area */}
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => onModelClick?.(entry)}
                />
                
                {/* Data Point */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={getColorByCategory(entry.model.category)}
                  fillOpacity="0.7"
                  stroke={getColorByCategory(entry.model.category)}
                  strokeWidth="2"
                  className="hover:fill-opacity-100 transition-all cursor-pointer"
                  onClick={() => onModelClick?.(entry)}
                />
                
                {/* Label on Hover */}
                <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x={x - 40}
                    y={y - 35}
                    width="80"
                    height="25"
                    fill="black"
                    fillOpacity="0.8"
                    rx="4"
                  />
                  <text
                    x={x}
                    y={y - 20}
                    textAnchor="middle"
                    className="fill-white text-xs font-medium"
                  >
                    {entry.model.name}
                  </text>
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    className="fill-gray-300 text-xs"
                  >
                    {xValue != null ? xValue.toFixed(1) : 'N/A'} / {yValue != null ? yValue.toFixed(1) : 'N/A'}
                  </text>
                </g>
              </motion.g>
            );
          })}

          {/* Legend */}
          <g transform="translate(440, 20)">
            <rect x="0" y="0" width="120" height="80" fill="white" fillOpacity="0.9" rx="4" />
            {[
              { category: 'text', label: 'Text', color: '#3b82f6' },
              { category: 'visual', label: 'Visual', color: '#10b981' },
              { category: 'multimodal', label: 'Multimodal', color: '#f59e0b' }
            ].map((item, i) => (
              <g key={item.category} transform={`translate(10, ${20 + i * 20})`}>
                <circle cx="0" cy="0" r="4" fill={item.color} />
                <text x="10" y="4" className="fill-gray-600 text-xs">
                  {item.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Axis Selector */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">X-Axis:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{xLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Y-Axis:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{yLabel}</span>
        </div>
      </div>
    </div>
  );
}