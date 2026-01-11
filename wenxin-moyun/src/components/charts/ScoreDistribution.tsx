import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { chartColors, chartConfig } from '../../config/chartTheme';

interface ScoreDistributionProps {
  data: {
    dimension: string;
    score: number;
    benchmark?: number;
  }[];
  title?: string;
  showBenchmark?: boolean;
}

const ScoreDistribution: React.FC<ScoreDistributionProps> = ({
  data,
  title = '评分分布',
  showBenchmark = false
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-neutral-900 text-white p-3 rounded-lg shadow-lg"
          style={{ fontSize: chartConfig.font.sizes.tooltip }}
        >
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}分
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-hover"
    >
      <h3 className="text-h3 text-neutral-900 mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={chartConfig.margin}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={chartColors.grid.line}
            vertical={false}
          />
          <XAxis 
            dataKey="dimension"
            tick={{ fill: chartColors.grid.text, fontSize: chartConfig.font.sizes.tick }}
            axisLine={{ stroke: chartColors.grid.line }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: chartColors.grid.text, fontSize: chartConfig.font.sizes.tick }}
            axisLine={{ stroke: chartColors.grid.line }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: chartConfig.font.sizes.legend
            }}
          />
          
          <Bar 
            dataKey="score" 
            name="得分" 
            fill={chartColors.primary[0]}
            radius={[8, 8, 0, 0]}
            animationDuration={chartConfig.animation.duration}
          />
          
          {showBenchmark && (
            <Bar 
              dataKey="benchmark" 
              name="基准分" 
              fill={chartColors.primary[1]}
              radius={[8, 8, 0, 0]}
              animationDuration={chartConfig.animation.duration}
              fillOpacity={0.6}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default ScoreDistribution;