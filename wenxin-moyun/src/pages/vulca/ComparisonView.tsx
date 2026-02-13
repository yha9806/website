/**
 * VULCA Comparison View Component
 * Displays model comparison results with various visualizations
 */

import React, { useMemo } from 'react';
import { IOSCard } from '../../components/ios/core/IOSCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { VULCAComparison, ViewMode } from '../../types/vulca';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ComparisonViewProps {
  comparison: VULCAComparison;
  viewMode: ViewMode;
  culturalPerspective?: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparison,
  viewMode,
  culturalPerspective = 'eastern',
}) => {
  const models = useMemo(() => comparison?.models ?? [], [comparison]);
  const hasModels = models.length > 0;

  // Prepare data for bar chart
  const barChartData = useMemo(() => {
    if (!hasModels) return [];
    
    const dimensions = viewMode === '6d'
      ? ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
      : models[0]?.scores47D 
        ? Object.keys(models[0].scores47D).slice(0, 10)
        : []; // Show first 10 for 47D, empty array if no scores47D
    
    return dimensions.map(dim => {
      const dataPoint: Record<string, string | number> = { dimension: dim };
      
      models.forEach((model, index) => {
        const scores = viewMode === '6d' ? model.scores6D : model.scores47D;
        // Use modelName as key for proper legend display
        const modelKey = model.modelName || `Model ${index + 1}`;
        dataPoint[modelKey] = scores ? (scores[dim as keyof typeof scores] || 0) : 0;
      });
      
      return dataPoint;
    });
  }, [hasModels, models, viewMode]);
  
  // Prepare cultural perspective data
  const culturalData = useMemo(() => {
    if (!hasModels) return [];
    
    return models.map(model => ({
      model: model.modelName,
      score: model.culturalPerspectives && culturalPerspective 
        ? (model.culturalPerspectives[culturalPerspective as keyof typeof model.culturalPerspectives] || 0)
        : 0,
    }));
  }, [hasModels, models, culturalPerspective]);

  // Early return if comparison data is invalid
  if (!hasModels) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-8">
        <p>No comparison data available</p>
      </div>
    );
  }
  
  // Chart colors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  // Calculate performance indicators
  const getPerformanceIndicator = (value: number, baseline: number) => {
    const diff = value - baseline;
    if (Math.abs(diff) < 1) return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
    if (diff > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    return <ArrowDown className="w-4 h-4 text-red-500" />;
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {comparison.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparison.summary.mostSimilar && (
            <IOSCard variant="elevated">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Most Similar Pair</h4>
              <p className="text-lg font-semibold">
                {comparison.summary.mostSimilar.models?.join(' & ') || 'N/A'}
              </p>
              <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded mt-2">
                Difference: {comparison.summary.mostSimilar.difference?.toFixed(2) || 'N/A'}
              </span>
            </IOSCard>
          )}

          {comparison.summary.mostDifferent && (
            <IOSCard variant="elevated">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Most Different Pair</h4>
              <p className="text-lg font-semibold">
                {comparison.summary.mostDifferent.models?.join(' & ') || 'N/A'}
              </p>
              <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded mt-2">
                Difference: {comparison.summary.mostDifferent.difference?.toFixed(2) || 'N/A'}
              </span>
            </IOSCard>
          )}

          <IOSCard variant="elevated">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Average Difference</h4>
            <p className="text-2xl font-bold">
              {comparison.summary.averageDifference?.toFixed(2) || 'N/A'}
            </p>
            {comparison.summary.averageDifference != null && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-slate-600 h-2 rounded-full"
                  style={{ width: `${Math.min(comparison.summary.averageDifference, 100)}%` }}
                ></div>
              </div>
            )}
          </IOSCard>
        </div>
      )}
      
      {/* Dimension Comparison Chart */}
      <IOSCard variant="elevated">
        <h3 className="text-lg font-semibold mb-4">
          Dimension Comparison ({viewMode === '6d' ? '6D' : '47D - First 10'})
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dimension" angle={-45} textAnchor="end" height={80} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            
            {models.map((model, index) => {
              const modelKey = model.modelName || `Model ${index + 1}`;
              return (
                <Bar
                  key={modelKey}
                  dataKey={modelKey}
                  fill={colors[index % colors.length]}
                  name={modelKey}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
        
        {viewMode === '47d' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Note: Showing first 10 dimensions of 47 for clarity. Export data to see all dimensions.
          </p>
        )}
      </IOSCard>
      
      {/* Cultural Perspective Analysis */}
      <IOSCard variant="elevated">
        <h3 className="text-lg font-semibold mb-4">
          Cultural Perspective Analysis: {culturalPerspective ? culturalPerspective.replace('_', ' ').toUpperCase() : 'EASTERN'}
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={culturalData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="model" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="score" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
        
        {comparison.summary?.culturalAnalysis && culturalPerspective && comparison.summary.culturalAnalysis[culturalPerspective] && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Cultural Analysis Insights</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Best Model:</span>
                <span className="ml-2 font-medium">
                  {comparison.summary?.culturalAnalysis && culturalPerspective 
                    ? comparison.summary.culturalAnalysis[culturalPerspective]?.bestModel 
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                <span className="ml-2 font-medium">
                  {comparison.summary?.culturalAnalysis && culturalPerspective 
                    ? comparison.summary.culturalAnalysis[culturalPerspective]?.mean?.toFixed(2) 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </IOSCard>
      
      {/* Model Performance Matrix */}
      <IOSCard variant="elevated">
        <h3 className="text-lg font-semibold mb-4">Model Performance Matrix</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Model</th>
                <th className="text-center py-2">Overall</th>
                <th className="text-center py-2">Creativity</th>
                <th className="text-center py-2">Technical</th>
                <th className="text-center py-2">Cultural</th>
                <th className="text-center py-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, index) => {
                const baseline = models[0]?.scores6D?.creativity || 0;
                return (
                  <tr key={model.modelId} className="border-b">
                    <td className="py-3 font-medium">{model.modelName}</td>
                    <td className="text-center py-3">
                      <span className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
                        {model.scores6D ? (Object.values(model.scores6D).reduce((a, b) => a + b, 0) / 6).toFixed(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        <span>{model.scores6D?.creativity ? model.scores6D.creativity.toFixed(1) : 'N/A'}</span>
                        {model.scores6D?.creativity ? getPerformanceIndicator(model.scores6D.creativity, baseline) : null}
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        <span>{model.scores6D?.technique ? model.scores6D.technique.toFixed(1) : 'N/A'}</span>
                        {model.scores6D?.technique ? getPerformanceIndicator(model.scores6D.technique, baseline) : null}
                      </div>
                    </td>
                    <td className="text-center py-3">
                      {model.culturalPerspectives && culturalPerspective && model.culturalPerspectives[culturalPerspective as keyof typeof model.culturalPerspectives]
                        ? model.culturalPerspectives[culturalPerspective as keyof typeof model.culturalPerspectives].toFixed(1)
                        : 'N/A'}
                    </td>
                    <td className="text-center py-3">
                      <div className="inline-flex">
                        <ResponsiveContainer width={60} height={30}>
                          <LineChart
                            data={[
                              { x: 0, y: model.scores6D?.creativity || 0 },
                              { x: 1, y: model.scores6D?.technique || 0 },
                              { x: 2, y: model.scores6D?.emotion || 0 },
                            ]}
                          >
                            <Line
                              type="monotone"
                              dataKey="y"
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </IOSCard>
      
      {/* Difference Matrix Heatmap */}
      {comparison.differenceMatrix && (
        <IOSCard variant="elevated">
          <h3 className="text-lg font-semibold mb-4">Pairwise Difference Matrix</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {comparison.models.map((model, i) => (
                    <th key={i} className="p-2 text-center">
                      {model.modelName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.differenceMatrix.map((row, i) => (
                  <tr key={i}>
                    <th className="p-2 text-left">{comparison.models[i].modelName}</th>
                    {row.map((value, j) => (
                      <td
                        key={j}
                        className="p-2 text-center"
                        style={{
                          backgroundColor:
                            i === j
                              ? '#f3f4f6'
                              : `rgba(239, 68, 68, ${Math.min(value / 100, 1) * 0.3})`,
                        }}
                      >
                        {i === j ? '-' : value.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Lower values (lighter) indicate higher similarity
          </p>
        </IOSCard>
      )}
    </div>
  );
};

export default ComparisonView;
