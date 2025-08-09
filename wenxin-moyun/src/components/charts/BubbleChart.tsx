import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import type { LeaderboardEntry } from '../../types/types';

interface BubbleChartProps {
  data: LeaderboardEntry[];
  title?: string;
  onBubbleClick?: (entry: LeaderboardEntry) => void;
}

export default function BubbleChart({ 
  data, 
  title = "模型综合性能气泡图",
  onBubbleClick 
}: BubbleChartProps) {
  
  const getColorByOrg = (org: string) => {
    const colors: Record<string, string> = {
      'Alibaba': '#ff6900',
      'Anthropic': '#6366f1',
      'OpenAI': '#10b981',
      'Google': '#4285f4',
      'Meta': '#0084ff',
      'Baidu': '#2932e1',
      'ByteDance': '#fe2c55',
      'Microsoft': '#00bcf2'
    };
    return colors[org] || '#6b7280';
  };
  
  const chartData = useMemo(() => {
    // X轴: 创意得分, Y轴: 文化契合度, 气泡大小: 综合评分
    const xExtent = [
      Math.min(...data.map(d => d.model.metrics.creativity)) * 0.9,
      Math.max(...data.map(d => d.model.metrics.creativity)) * 1.1
    ];
    const yExtent = [
      Math.min(...data.map(d => d.model.metrics.cultural)) * 0.9,
      Math.max(...data.map(d => d.model.metrics.cultural)) * 1.1
    ];
    const sizeExtent = [
      Math.min(...data.map(d => d.score)),
      Math.max(...data.map(d => d.score))
    ];

    const xScale = scaleLinear().domain(xExtent).range([80, 520]);
    const yScale = scaleLinear().domain(yExtent).range([320, 80]);
    const sizeScale = scaleSqrt().domain(sizeExtent).range([5, 30]);

    return data.map(entry => ({
      entry,
      x: xScale(entry.model.metrics.creativity),
      y: yScale(entry.model.metrics.cultural),
      r: sizeScale(entry.score),
      color: getColorByOrg(entry.model.organization)
    }));
  }, [data]);

  // 获取唯一的组织列表用于图例
  const organizations = Array.from(new Set(data.map(d => d.model.organization)));

  return (
    <div className="bg-neutral-50 dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {title}
      </h3>
      
      <div className="relative">
        <svg
          width="600"
          height="400"
          className="w-full h-auto"
          viewBox="0 0 600 400"
        >
          {/* 背景渐变 */}
          <defs>
            <radialGradient id="bgGradient">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* 背景圆 */}
          <circle cx="300" cy="200" r="150" fill="url(#bgGradient)" />

          {/* 网格线 */}
          <g className="opacity-10">
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={`h-${i}`}
                x1="80"
                x2="520"
                y1={80 + i * 60}
                y2={80 + i * 60}
                stroke="currentColor"
                strokeDasharray="2,2"
              />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <line
                key={`v-${i}`}
                x1={80 + i * 73}
                x2={80 + i * 73}
                y1="80"
                y2="320"
                stroke="currentColor"
                strokeDasharray="2,2"
              />
            ))}
          </g>

          {/* 坐标轴 */}
          <line x1="80" x2="520" y1="320" y2="320" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <line x1="80" x2="80" y1="80" y2="320" stroke="currentColor" strokeWidth="2" opacity="0.3" />

          {/* 轴标签 */}
          <text
            x="300"
            y="360"
            textAnchor="middle"
            className="fill-gray-600 dark:fill-gray-400 text-sm font-medium"
          >
            创意新颖度 →
          </text>
          <text
            x="40"
            y="200"
            textAnchor="middle"
            transform="rotate(-90, 40, 200)"
            className="fill-gray-600 dark:fill-gray-400 text-sm font-medium"
          >
            文化契合度 →
          </text>

          {/* 象限标签 */}
          <text x="150" y="100" className="fill-gray-400 text-xs" opacity="0.5">高文化低创意</text>
          <text x="400" y="100" className="fill-gray-400 text-xs" opacity="0.5">双高区域</text>
          <text x="150" y="300" className="fill-gray-400 text-xs" opacity="0.5">双低区域</text>
          <text x="400" y="300" className="fill-gray-400 text-xs" opacity="0.5">高创意低文化</text>

          {/* 气泡 */}
          {chartData.map((item, index) => (
            <motion.g
              key={item.entry.model.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              whileHover={{ scale: 1.1, opacity: 1 }}
              transition={{ 
                delay: index * 0.03, 
                duration: 0.5,
                type: "spring",
                stiffness: 200
              }}
              className="cursor-pointer"
              onClick={() => onBubbleClick?.(item.entry)}
            >
              {/* 外发光效果 */}
              <circle
                cx={item.x}
                cy={item.y}
                r={item.r + 3}
                fill={item.color}
                fillOpacity="0.2"
              />
              
              {/* 主气泡 */}
              <circle
                cx={item.x}
                cy={item.y}
                r={item.r}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* 标签（只显示前10名） */}
              {item.entry.rank <= 10 && (
                <text
                  x={item.x}
                  y={item.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-xs font-bold pointer-events-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {item.entry.rank}
                </text>
              )}
              
              {/* 悬停提示 */}
              <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={item.x - 60}
                  y={item.y - item.r - 35}
                  width="120"
                  height="30"
                  fill="black"
                  fillOpacity="0.9"
                  rx="4"
                />
                <text
                  x={item.x}
                  y={item.y - item.r - 20}
                  textAnchor="middle"
                  className="fill-white text-xs font-medium"
                >
                  {item.entry.model.name}
                </text>
                <text
                  x={item.x}
                  y={item.y - item.r - 8}
                  textAnchor="middle"
                  className="fill-gray-300 text-xs"
                >
                  综合: {item.entry.score.toFixed(1)}
                </text>
              </g>
            </motion.g>
          ))}

          {/* 图例 */}
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="140" height={Math.min(organizations.length * 20 + 10, 150)} fill="white" fillOpacity="0.95" rx="4" stroke="gray" strokeOpacity="0.2" />
            <text x="10" y="15" className="fill-gray-700 text-xs font-bold">组织</text>
            {organizations.slice(0, 7).map((org, i) => (
              <g key={org} transform={`translate(10, ${25 + i * 18})`}>
                <circle cx="0" cy="0" r="5" fill={getColorByOrg(org)} opacity="0.8" />
                <text x="12" y="4" className="fill-gray-600 text-xs">
                  {org}
                </text>
              </g>
            ))}
          </g>

          {/* 说明文字 */}
          <text x="300" y="380" textAnchor="middle" className="fill-gray-500 text-xs">
            气泡大小代表综合评分，位置反映创意与文化维度表现
          </text>
        </svg>
      </div>
    </div>
  );
}