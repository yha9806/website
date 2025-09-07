/**
 * VULCA Visualization Component
 * Provides multiple visualization types for VULCA evaluation data
 */

import React, { useMemo, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import { IOSCard } from '../ios/core/IOSCard';
import { IOSButton } from '../ios/core/IOSButton';
import type {
  ViewMode,
  VisualizationType,
  VULCAEvaluation,
} from '../../types/vulca';
import { DIMENSION_CATEGORIES, getDimensionCategory } from '../../utils/vulca-dimensions';

interface VULCAVisualizationProps {
  evaluations: VULCAEvaluation[];
  dimensions: { id: string; name: string; description: string }[];
  viewMode: ViewMode;
  visualizationType: VisualizationType;
  culturalPerspective?: string;
}

export const VULCAVisualization: React.FC<VULCAVisualizationProps> = ({
  evaluations,
  dimensions,
  viewMode,
  visualizationType,
  culturalPerspective = 'eastern',
}) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Filter dimensions by category for 47D mode
  const filteredDimensions = useMemo(() => {
    if (viewMode === '6d') {
      return dimensions.slice(0, 6);
    }
    if (selectedCategory === 'all') {
      return dimensions;
    }
    return dimensions.filter(dim => getDimensionCategory(dim.id) === selectedCategory);
  }, [dimensions, viewMode, selectedCategory]);
  
  // Prepare data for different visualization types
  const radarData = useMemo(() => {
    if (!evaluations.length || !filteredDimensions.length) return [];
    
    // For radar chart, show all dimensions when in 47D mode
    const radarDimensions = filteredDimensions.slice(0, viewMode === '6d' ? 6 : 
      filteredDimensions.length);
    
    return radarDimensions.map(dim => {
      const dataPoint: any = { dimension: dim.name };
      
      evaluations.forEach((evaluation, index) => {
        const scores = viewMode === '6d' ? evaluation.scores6D : evaluation.scores47D;
        dataPoint[`model_${index}`] = scores ? (scores[dim.id as keyof typeof scores] || 0) : 0;
      });
      
      return dataPoint;
    });
  }, [evaluations, filteredDimensions, viewMode]);
  
  const barData = useMemo(() => {
    if (!evaluations.length) return [];
    
    return evaluations.map((evaluation, index) => {
      const scores = viewMode === '6d' ? evaluation.scores6D : evaluation.scores47D;
      return {
        model: evaluation.modelName,
        ...(scores ? Object.entries(scores)
          .slice(0, 8)
          .reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value,
          }), {}) : {}),
        color: colors[index % colors.length],
      };
    });
  }, [evaluations, viewMode]);
  
  const heatmapData = useMemo(() => {
    if (!evaluations.length || !filteredDimensions.length) return [];
    
    const data: any[] = [];
    const dimSlice = filteredDimensions.slice(0, viewMode === '6d' ? 6 : 
      filteredDimensions.length);
    
    evaluations.forEach((evaluation, modelIndex) => {
      dimSlice.forEach((dim, dimIndex) => {
        const scores = viewMode === '6d' ? evaluation.scores6D : evaluation.scores47D;
        data.push({
          x: dimIndex,
          y: modelIndex,
          value: scores ? (scores[dim.id as keyof typeof scores] || 0) : 0,
          model: evaluation.modelName,
          dimension: dim.name,
        });
      });
    });
    
    return data;
  }, [evaluations, filteredDimensions, viewMode]);
  
  const parallelData = useMemo(() => {
    if (!evaluations.length) return [];
    
    // Prepare data for parallel coordinates
    const selectedDimensions = filteredDimensions.slice(0, viewMode === '6d' ? 6 : 
      filteredDimensions.length);
    
    return evaluations.map((evaluation, index) => {
      const scores = viewMode === '6d' ? evaluation.scores6D : evaluation.scores47D;
      const dataPoint: any = {
        model: evaluation.modelName,
        color: colors[index % colors.length],
      };
      
      selectedDimensions.forEach(dim => {
        dataPoint[dim.id] = scores ? (scores[dim.id as keyof typeof scores] || 0) : 0;
      });
      
      return dataPoint;
    });
  }, [evaluations, filteredDimensions, viewMode]);
  
  // Custom tooltip for heatmap
  const HeatmapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border">
          <p className="font-semibold">{data.model}</p>
          <p className="text-sm">{data.dimension}</p>
          <p className="text-sm font-medium">Score: {data.value?.toFixed(1) || 'N/A'}</p>
        </div>
      );
    }
    return null;
  };
  
  // Get color for heatmap based on value
  const getHeatmapColor = (value: number) => {
    const normalized = value / 100;
    const hue = (1 - normalized) * 240; // Blue (240) to Red (0)
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  // Render based on visualization type
  const renderVisualization = () => {
    switch (visualizationType) {
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={radarData}>
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              
              {evaluations.map((evaluation, index) => (
                <Radar
                  key={`model_${index}`}
                  name={evaluation.modelName}
                  dataKey={`model_${index}`}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              
              {filteredDimensions.map((dim, index) => (
                <Bar
                  key={dim.id}
                  dataKey={dim.id}
                  name={dim.name}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'heatmap':
        const heatmapDimSlice = filteredDimensions.slice(0, viewMode === '6d' ? 6 : 
          filteredDimensions.length);
        
        return (
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 60, left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, heatmapDimSlice.length - 1]}
                  ticks={heatmapDimSlice.map((_, i) => i)}
                  tickFormatter={(value) => 
                    heatmapDimSlice[value]?.name.substring(0, 8) || ''
                  }
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis
                  type="number"
                  domain={[0, evaluations.length - 1]}
                  ticks={evaluations.map((_, i) => i)}
                  tickFormatter={(value) => 
                    evaluations[value]?.modelName || ''
                  }
                />
                <Tooltip content={<HeatmapTooltip />} />
                
                <Scatter data={heatmapData} fill="#8884d8">
                  {heatmapData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getHeatmapColor(entry.value)}
                      stroke="white"
                      strokeWidth={1}
                      style={{
                        width: 40,
                        height: 40,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            
            {/* Color scale legend */}
            <div className="mt-4 flex items-center justify-center">
              <span className="text-sm mr-2">Low (0)</span>
              <div
                className="h-4 w-48 rounded"
                style={{
                  background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(120, 70%, 50%), hsl(0, 70%, 50%))',
                }}
              />
              <span className="text-sm ml-2">High (100)</span>
            </div>
          </div>
        );
      
      case 'parallel':
        const selectedDims = filteredDimensions.slice(0, viewMode === '6d' ? 6 : 
          filteredDimensions.length);
        
        return (
          <div>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={parallelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="model"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                
                {selectedDims.map((dim, index) => (
                  <Line
                    key={dim.id}
                    type="monotone"
                    dataKey={dim.id}
                    name={dim.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            <p className="text-sm text-gray-500 mt-2">
              Parallel coordinates showing {selectedDims.length} dimensions across models
            </p>
          </div>
        );
      
      default:
        return <p>Unknown visualization type</p>;
    }
  };
  
  // Cultural perspective overlay
  const renderCulturalOverlay = () => {
    if (!evaluations.length) return null;
    
    const culturalScores = evaluations.map(e => ({
      model: e.modelName,
      score: e.culturalPerspectives && culturalPerspective 
        ? (e.culturalPerspectives[culturalPerspective as keyof typeof e.culturalPerspectives] || 0)
        : 0,
    }));
    
    return (
      <IOSCard variant="elevated" className="mt-4">
        <h4 className="text-sm font-medium mb-3">
          Cultural Perspective: {culturalPerspective ? culturalPerspective.replace('_', ' ').toUpperCase() : 'EASTERN'}
        </h4>
        
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={culturalScores} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="model" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="score" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </IOSCard>
    );
  };
  
  if (!evaluations.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <p className="text-lg">No evaluation data available</p>
          <p className="text-sm mt-2">Select models and run evaluation to see visualizations</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Category selector for 47D mode */}
      {viewMode === '47d' && (
        <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg">
          <IOSButton
            variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Dimensions ({dimensions.length})
          </IOSButton>
          {Object.entries(DIMENSION_CATEGORIES).map(([key, category]) => (
            <IOSButton
              key={key}
              variant={selectedCategory === key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              style={{
                borderColor: selectedCategory === key ? category.color : undefined,
                color: selectedCategory === key ? category.color : undefined
              }}
            >
              {category.name} ({category.range[1] - category.range[0] + 1})
            </IOSButton>
          ))}
        </div>
      )}
      
      {/* Main visualization */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
        {renderVisualization()}
      </div>
      
      {/* Cultural perspective overlay */}
      {renderCulturalOverlay()}
      
      {/* Statistics summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {evaluations.map((evaluation, index) => {
          const avgScore = viewMode === '6d'
            ? (evaluation.scores6D ? Object.values(evaluation.scores6D).reduce((a, b) => a + b, 0) / 6 : 0)
            : (evaluation.scores47D ? Object.values(evaluation.scores47D).slice(0, 47).reduce((a, b) => a + b, 0) / 47 : 0);
          
          return (
            <IOSCard key={evaluation.modelId} variant="elevated">
              <div
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <h5 className="font-medium text-sm">{evaluation.modelName}</h5>
              <p className="text-2xl font-bold mt-1">{avgScore.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Average Score</p>
            </IOSCard>
          );
        })}
      </div>
    </div>
  );
};

export default VULCAVisualization;