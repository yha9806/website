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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  // Prepare data for bar chart
  const barChartData = useMemo(() => {
    if (!comparison.models || comparison.models.length === 0) return [];
    
    const dimensions = viewMode === '6d'
      ? ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
      : Object.keys(comparison.models[0].scores47D).slice(0, 10); // Show first 10 for 47D
    
    return dimensions.map(dim => {
      const dataPoint: any = { dimension: dim };
      
      comparison.models.forEach((model, index) => {
        const scores = viewMode === '6d' ? model.scores6D : model.scores47D;
        dataPoint[`model_${index}`] = scores[dim as keyof typeof scores] || 0;
      });
      
      return dataPoint;
    });
  }, [comparison, viewMode]);
  
  // Prepare cultural perspective data
  const culturalData = useMemo(() => {
    if (!comparison.models) return [];
    
    return comparison.models.map(model => ({
      model: model.modelName,
      score: model.culturalPerspectives[culturalPerspective as keyof typeof model.culturalPerspectives] || 0,
    }));
  }, [comparison, culturalPerspective]);
  
  // Chart colors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  // Calculate performance indicators
  const getPerformanceIndicator = (value: number, baseline: number) => {
    const diff = value - baseline;
    if (Math.abs(diff) < 1) return <Minus className="w-4 h-4 text-gray-400" />;
    if (diff > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    return <ArrowDown className="w-4 h-4 text-red-500" />;
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IOSCard variant="elevated">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Most Similar Pair</h4>
          <p className="text-lg font-semibold">
            {comparison.summary.mostSimilar.models.join(' & ')}
          </p>
          <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded mt-2">
            Difference: {comparison.summary.mostSimilar.difference.toFixed(2)}
          </span>
        </IOSCard>
        
        <IOSCard variant="elevated">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Most Different Pair</h4>
          <p className="text-lg font-semibold">
            {comparison.summary.mostDifferent.models.join(' & ')}
          </p>
          <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded mt-2">
            Difference: {comparison.summary.mostDifferent.difference.toFixed(2)}
          </span>
        </IOSCard>
        
        <IOSCard variant="elevated">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Average Difference</h4>
          <p className="text-2xl font-bold">
            {comparison.summary.averageDifference.toFixed(2)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${Math.min(comparison.summary.averageDifference, 100)}%` }}
            ></div>
          </div>
        </IOSCard>
      </div>
      
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
            
            {comparison.models.map((model, index) => (
              <Bar
                key={`model_${index}`}
                dataKey={`model_${index}`}
                fill={colors[index % colors.length]}
                name={model.modelName}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        
        {viewMode === '47d' && (
          <p className="text-sm text-gray-500 mt-2">
            Note: Showing first 10 dimensions of 47 for clarity. Export data to see all dimensions.
          </p>
        )}
      </IOSCard>
      
      {/* Cultural Perspective Analysis */}
      <IOSCard variant="elevated">
        <h3 className="text-lg font-semibold mb-4">
          Cultural Perspective Analysis: {culturalPerspective.replace('_', ' ').toUpperCase()}
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
        
        {comparison.summary.culturalAnalysis && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Cultural Analysis Insights</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Best Model:</span>
                <span className="ml-2 font-medium">
                  {comparison.summary.culturalAnalysis[culturalPerspective]?.bestModel}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Average Score:</span>
                <span className="ml-2 font-medium">
                  {comparison.summary.culturalAnalysis[culturalPerspective]?.mean.toFixed(2)}
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
              {comparison.models.map((model, index) => {
                const baseline = comparison.models[0].scores6D.creativity;
                return (
                  <tr key={model.modelId} className="border-b">
                    <td className="py-3 font-medium">{model.modelName}</td>
                    <td className="text-center py-3">
                      <span className="px-2 py-1 border border-gray-300 rounded text-sm">
                        {(Object.values(model.scores6D).reduce((a, b) => a + b, 0) / 6).toFixed(1)}
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        <span>{model.scores6D.creativity.toFixed(1)}</span>
                        {getPerformanceIndicator(model.scores6D.creativity, baseline)}
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex items-center justify-center gap-1">
                        <span>{model.scores6D.technique.toFixed(1)}</span>
                        {getPerformanceIndicator(model.scores6D.technique, baseline)}
                      </div>
                    </td>
                    <td className="text-center py-3">
                      {model.culturalPerspectives[culturalPerspective as keyof typeof model.culturalPerspectives]?.toFixed(1)}
                    </td>
                    <td className="text-center py-3">
                      <div className="inline-flex">
                        <ResponsiveContainer width={60} height={30}>
                          <LineChart
                            data={[
                              { x: 0, y: model.scores6D.creativity },
                              { x: 1, y: model.scores6D.technique },
                              { x: 2, y: model.scores6D.emotion },
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
          
          <p className="text-xs text-gray-500 mt-2">
            Lower values (lighter) indicate higher similarity
          </p>
        </IOSCard>
      )}
    </div>
  );
};

export default ComparisonView;