import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import type { Model } from '../../types/types';

interface ComparisonRadarProps {
  models: Model[];
  title?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ComparisonRadar({ models, title = "模型能力对比" }: ComparisonRadarProps) {
  // 准备雷达图数据
  const radarData = [
    { dimension: '格律韵律', fullMark: 100 },
    { dimension: '构图色彩', fullMark: 100 },
    { dimension: '叙事逻辑', fullMark: 100 },
    { dimension: '情感表达', fullMark: 100 },
    { dimension: '创意新颖', fullMark: 100 },
    { dimension: '文化契合', fullMark: 100 },
  ];

  // 为每个模型添加数据
  const data = radarData.map(item => {
    const point: any = { dimension: item.dimension };
    models.forEach((model, index) => {
      switch (item.dimension) {
        case '格律韵律':
          point[`model${index}`] = model.metrics.rhythm;
          break;
        case '构图色彩':
          point[`model${index}`] = model.metrics.composition;
          break;
        case '叙事逻辑':
          point[`model${index}`] = model.metrics.narrative;
          break;
        case '情感表达':
          point[`model${index}`] = model.metrics.emotion;
          break;
        case '创意新颖':
          point[`model${index}`] = model.metrics.creativity;
          break;
        case '文化契合':
          point[`model${index}`] = model.metrics.cultural;
          break;
      }
    });
    return point;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid 
            gridType="polygon"
            radialLines={true}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <PolarAngleAxis 
            dataKey="dimension"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            className="font-medium"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
          />
          
          {models.map((model, index) => (
            <Radar
              key={model.id}
              name={model.name}
              dataKey={`model${index}`}
              stroke={COLORS[index]}
              fill={COLORS[index]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px'
            }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* 模型卡片 */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {models.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            <img
              src={model.avatar}
              alt={model.name}
              className="w-10 h-10 rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                {model.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {model.organization} · 综合: {model.overallScore}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 维度说明 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          评测维度说明
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-blue-700 dark:text-blue-400">
          <div>• 格律韵律: 诗词格律掌握</div>
          <div>• 构图色彩: 视觉艺术能力</div>
          <div>• 叙事逻辑: 故事构建能力</div>
          <div>• 情感表达: 情感传达深度</div>
          <div>• 创意新颖: 创新创意水平</div>
          <div>• 文化契合: 文化理解程度</div>
        </div>
      </div>
    </motion.div>
  );
}