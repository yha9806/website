import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { chartColors } from '../../config/chartTheme';

interface DonutProgressProps {
  value: number;
  maxValue?: number;
  title?: string;
  subtitle?: string;
  size?: number;
  thickness?: number;
}

const DonutProgress: React.FC<DonutProgressProps> = ({
  value,
  maxValue = 100,
  title,
  subtitle,
  size = 200,
  thickness = 20
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  const data = [
    { name: '完成', value: percentage },
    { name: '剩余', value: 100 - percentage }
  ];

  // 渐变色从主色到成功色
  const getGradientColor = (percent: number) => {
    if (percent < 50) return chartColors.primary[0];
    if (percent < 80) return chartColors.primary[1];
    return chartColors.gradients.primaryToSuccess[1];
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy
  }: any) => {
    return (
      <text 
        x={cx} 
        y={cy} 
        fill={chartColors.grid.text}
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        <tspan x={cx} dy="-0.2em" className="text-[24px] font-bold">
          {Math.round(percentage)}%
        </tspan>
        {subtitle && (
          <tspan x={cx} dy="1.5em" className="text-[12px]" fill={chartColors.grid.subText}>
            {subtitle}
          </tspan>
        )}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      {title && (
        <h4 className="text-body font-medium text-neutral-700 mb-2">{title}</h4>
      )}
      
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={chartColors.primary[0]} />
              <stop offset="100%" stopColor={chartColors.gradients.primaryToSuccess[1]} />
            </linearGradient>
          </defs>
          
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={size / 2 - 10}
            innerRadius={size / 2 - 10 - thickness}
            fill="#8884d8"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            animationBegin={0}
            animationDuration={800}
          >
            <Cell fill="url(#progressGradient)" />
            <Cell fill={chartColors.grid.line} />
          </Pie>
          
          <Tooltip 
            formatter={(value: any) => `${value}%`}
            contentStyle={{
              backgroundColor: chartColors.background.card,
              border: `1px solid ${chartColors.grid.line}`,
              borderRadius: 8,
              fontSize: 12
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {value !== undefined && maxValue !== undefined && (
        <p className="text-caption text-neutral-600 mt-2">
          {value} / {maxValue}
        </p>
      )}
    </motion.div>
  );
};

export default DonutProgress;