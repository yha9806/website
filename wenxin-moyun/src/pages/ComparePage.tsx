import { useState } from 'react';
import { Plus, X, BarChart3, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { mockModels } from '../data/mockData';
import ComparisonRadar from '../components/charts/ComparisonRadar';
import type { Model } from '../types/types';

export default function ComparePage() {
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleAddModel = (model: Model) => {
    if (selectedModels.length >= 4) {
      toast.error('Maximum 4 models can be compared');
      return;
    }
    if (selectedModels.find(m => m.id === model.id)) {
      toast.error('This model is already in the comparison list');
      return;
    }
    setSelectedModels([...selectedModels, model]);
    toast.success(`Added ${model.name}`);
  };

  const handleRemoveModel = (modelId: string) => {
    setSelectedModels(selectedModels.filter(m => m.id !== modelId));
  };

  const exportComparison = () => {
    // 简单的导出功能，实际应用中可以生成PDF或Excel
    const data = selectedModels.map(model => ({
      Name: model.name,
      Organization: model.organization,
      OverallScore: model.overallScore,
      Rhythm: model.metrics.rhythm,
      Composition: model.metrics.composition,
      Narrative: model.metrics.narrative,
      Emotion: model.metrics.emotion,
      Creativity: model.metrics.creativity,
      Cultural: model.metrics.cultural,
    }));
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Comparison data exported');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          <BarChart3 className="inline-block w-10 h-10 mr-3 text-primary-600" />
          Model Comparison Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select up to 4 models for multi-dimensional capability comparison
        </p>
      </motion.div>

      {/* Selected Models */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Selected Models ({selectedModels.length}/4)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSelecting(!isSelecting)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Model
            </button>
            {selectedModels.length > 0 && (
              <button
                onClick={exportComparison}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Comparison
              </button>
            )}
          </div>
        </div>

        {/* Selected Models Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {selectedModels.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="relative ios-glass liquid-glass-container rounded-lg shadow-md p-4"
              >
                <button
                  onClick={() => handleRemoveModel(model.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                
                <div className="flex items-center gap-3">
                  <img
                    src={model.avatar}
                    alt={model.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {model.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {model.organization}
                    </p>
                    <p className="text-sm font-medium text-primary-600">
                      Score: {model.overallScore}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Empty Slots */}
          {[...Array(4 - selectedModels.length)].map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex items-center justify-center"
            >
              <div className="text-center text-gray-400">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Empty Slot</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Selector */}
      {isSelecting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-6 ios-glass liquid-glass-container rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Select Model
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {mockModels.map((model) => {
              const isSelected = selectedModels.find(m => m.id === model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => !isSelected && handleAddModel(model)}
                  disabled={!!isSelected}
                  className={`
                    p-3 rounded-lg text-left transition-all
                    ${isSelected
                      ? 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'ios-glass hover:shadow-md hover:scale-105 transition-all'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={model.avatar}
                      alt={model.name}
                      className="w-8 h-8 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                        {model.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {model.organization}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Comparison Charts */}
      {selectedModels.length >= 2 && (
        <div className="space-y-8">
          {/* Radar Chart */}
          <ComparisonRadar models={selectedModels} />

          {/* Detailed Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-glass liquid-glass-container rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Detailed Data Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Metrics
                    </th>
                    {selectedModels.map(model => (
                      <th key={model.id} className="text-center py-3 px-4">
                        <div className="flex flex-col items-center">
                          <img
                            src={model.avatar}
                            alt={model.name}
                            className="w-8 h-8 rounded mb-1"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {model.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'overallScore', label: 'Overall Score', format: (v: number) => v.toFixed(1) },
                    { key: 'rhythm', label: 'Rhythm & Harmony', format: (v: number) => v },
                    { key: 'composition', label: 'Composition', format: (v: number) => v },
                    { key: 'narrative', label: 'Narrative', format: (v: number) => v },
                    { key: 'emotion', label: 'Emotion', format: (v: number) => v },
                    { key: 'creativity', label: 'Creativity', format: (v: number) => v },
                    { key: 'cultural', label: 'Cultural Relevance', format: (v: number) => v },
                  ].map((metric) => {
                    const values = selectedModels.map(model => 
                      metric.key === 'overallScore' 
                        ? model.overallScore 
                        : (model.metrics as any)[metric.key]
                    );
                    const maxValue = Math.max(...values);
                    
                    return (
                      <tr key={metric.key} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {metric.label}
                        </td>
                        {selectedModels.map((model, index) => {
                          const value = values[index];
                          const isMax = value === maxValue;
                          
                          return (
                            <td key={model.id} className="text-center py-3 px-4">
                              <span className={`
                                inline-block px-3 py-1 rounded-full text-sm font-medium
                                ${isMax 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }
                              `}>
                                {metric.format(value)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {selectedModels.length < 2 && (
        <div className="text-center py-20">
          <BarChart3 className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-xl text-gray-500 dark:text-gray-400">
            Please select at least 2 models to start comparison
          </p>
        </div>
      )}
    </div>
  );
}