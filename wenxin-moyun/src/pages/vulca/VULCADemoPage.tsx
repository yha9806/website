/**
 * VULCA Demo Page
 * Main page for VULCA 47-dimensional evaluation demonstration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ComparisonView } from './ComparisonView';
import { DimensionToggle } from '../../components/vulca/DimensionToggle';
import { ModelSelector } from '../../components/vulca/ModelSelector';
import { CulturalPerspectiveSelector } from '../../components/vulca/CulturalPerspectiveSelector';
import { VULCAVisualization } from '../../components/vulca/VULCAVisualization';
import { ExportButton } from '../../components/vulca/ExportButton';
import { useVULCAData } from '../../hooks/vulca/useVULCAData';
import type { ViewMode, VisualizationType } from '../../types/vulca';
import { IOSAlert } from '../../components/ios/core/IOSAlert';
import { IOSCard } from '../../components/ios/core/IOSCard';
import { IOSButton } from '../../components/ios/core/IOSButton';
import { 
  Loader2, BarChart3, Radar, Grid3x3, Download, 
  RefreshCw, AlertCircle, WifiOff, CheckCircle, Clock 
} from 'lucide-react';

// Models will be loaded dynamically from the API

export const VULCADemoPage: React.FC = () => {
  const [availableModels, setAvailableModels] = useState<Array<{id: number, name: string, organization: string}>>([]);
  const [selectedModels, setSelectedModels] = useState<number[]>([]); // Will be set after models load
  const [viewMode, setViewMode] = useState<ViewMode>('6d');
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('radar');
  const [culturalPerspective, setCulturalPerspective] = useState<string>('eastern');
  const [activeTab, setActiveTab] = useState<'visualization' | 'comparison'>('visualization');
  
  const {
    evaluations,
    comparison,
    dimensions,
    perspectives,
    systemInfo,
    loading,
    initializing,
    comparing,
    error,
    errorDetails,
    isConnected,
    lastSync,
    compareModels,
    loadDemoData,
    refreshAll,
    clearError,
    retryConnection,
  } = useVULCAData(selectedModels);
  
  // Load available models from API
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Use the main models API with VULCA data
        const response = await fetch('http://localhost:8001/api/v1/models/?include_vulca=true&limit=50');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Filter models that have VULCA data
            const modelsWithVulca = data.filter((m: any) => m.vulca_scores_47d != null);
            const models = modelsWithVulca.map((m: any) => ({
              id: m.id,
              name: m.name,
              organization: m.organization
            }));
            setAvailableModels(models);
            // Select first two models by default
            if (models.length >= 2) {
              setSelectedModels([models[0].id, models[1].id]);
            } else if (models.length === 1) {
              setSelectedModels([models[0].id]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback to some default models that exist in database
        setAvailableModels([
          { id: 1, name: 'GPT-4o', organization: 'OpenAI' },
          { id: 2, name: 'Claude 3.5 Sonnet', organization: 'Anthropic' },
          { id: 3, name: 'o1-preview', organization: 'OpenAI' },
          { id: 4, name: 'Llama 3.1 405B', organization: 'Meta' },
          { id: 5, name: 'GPT-4 Turbo', organization: 'OpenAI' },
        ]);
        setSelectedModels([1, 2]);
      }
    };
    loadModels();
  }, []);
  
  // Handle model selection
  const handleModelSelect = useCallback((modelId: number) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        // Remove model
        return prev.filter(id => id !== modelId);
      }
      if (prev.length >= 5) {
        // Max 5 models for comparison
        return [...prev.slice(1), modelId];
      }
      return [...prev, modelId];
    });
  }, []);
  
  // Trigger comparison when models change
  useEffect(() => {
    if (selectedModels.length >= 2 && availableModels.length > 0) {
      compareModels(selectedModels);
    }
  }, [selectedModels.join(','), availableModels.length, compareModels]);
  
  // Export functionality
  const handleExport = useCallback(() => {
    const exportData = {
      evaluations,
      comparison,
      dimensions: viewMode === '47d' ? dimensions : dimensions.slice(0, 6),
      exportDate: new Date().toISOString(),
      settings: {
        viewMode,
        culturalPerspective,
        selectedModels,
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulca-evaluation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [evaluations, comparison, dimensions, viewMode, culturalPerspective, selectedModels]);
  
  // Initialize with demo data if not connected
  useEffect(() => {
    if (!isConnected && !initializing && !error) {
      loadDemoData();
    }
  }, [isConnected, initializing, error, loadDemoData]);
  
  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Initializing VULCA System...</p>
          <p className="text-sm text-gray-500">Connecting to evaluation framework</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VULCA Multi-Dimensional Evaluation
            </h1>
            <p className="text-gray-600 mt-2">
              Advanced AI Model Assessment: From 6 to 47 Dimensions with 8 Cultural Perspectives
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-600">Offline Mode</span>
                </>
              )}
            </div>
            
            {/* Refresh Button */}
            <IOSButton
              variant="secondary"
              size="sm"
              onClick={refreshAll}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </IOSButton>
            
            <span className="px-3 py-1 border border-gray-300 rounded-full text-sm">
              EMNLP 2025 Findings
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  {isConnected ? 'Error' : 'Connection Issue'}
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {errorDetails && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Technical Details
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 p-2 bg-red-100 rounded overflow-x-auto">
                      {JSON.stringify(errorDetails, null, 2)}
                    </pre>
                  </details>
                )}
                <div className="mt-3 flex gap-2">
                  {!isConnected && (
                    <IOSButton
                      variant="primary"
                      size="sm"
                      onClick={retryConnection}
                    >
                      Retry Connection
                    </IOSButton>
                  )}
                  <IOSButton
                    variant="secondary"
                    size="sm"
                    onClick={clearError}
                  >
                    Dismiss
                  </IOSButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <IOSCard variant="elevated">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            
            <div className="space-y-6">
              {/* Model Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Models (2-5)
                </label>
                <ModelSelector
                  models={availableModels}
                  selectedModels={selectedModels}
                  onModelSelect={handleModelSelect}
                />
              </div>
              
              {/* Dimension Toggle */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Evaluation Dimensions
                </label>
                <DimensionToggle
                  mode={viewMode}
                  onModeChange={setViewMode}
                />
              </div>
              
              {/* Visualization Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Visualization
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <IOSButton
                    variant={visualizationType === 'radar' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setVisualizationType('radar')}
                  >
                    <Radar className="w-4 h-4 mr-1" />
                    Radar
                  </IOSButton>
                  <IOSButton
                    variant={visualizationType === 'heatmap' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setVisualizationType('heatmap')}
                  >
                    <Grid3x3 className="w-4 h-4 mr-1" />
                    Heatmap
                  </IOSButton>
                  <IOSButton
                    variant={visualizationType === 'bar' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setVisualizationType('bar')}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Bar
                  </IOSButton>
                  <IOSButton
                    variant={visualizationType === 'parallel' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setVisualizationType('parallel')}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Parallel
                  </IOSButton>
                </div>
              </div>
              
              {/* Cultural Perspective */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cultural Perspective
                </label>
                <CulturalPerspectiveSelector
                  perspectives={perspectives}
                  selected={culturalPerspective}
                  onSelect={setCulturalPerspective}
                />
              </div>
              
              {/* Export */}
              <ExportButton onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </ExportButton>
            </div>
          </IOSCard>
          
          {/* Statistics Card */}
          <IOSCard variant="elevated">
            <h3 className="text-lg font-semibold mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Models Selected:</span>
                <span className="font-medium">{selectedModels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dimensions:</span>
                <span className="font-medium">{viewMode === '6d' ? '6' : '47'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expansion Rate:</span>
                <span className="font-medium">683%</span>
              </div>
              {comparison && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Difference:</span>
                    <span className="font-medium">
                      {comparison.summary.averageDifference.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {lastSync && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Last Sync:
                  </span>
                  <span className="font-medium text-xs">
                    {new Date(lastSync).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {systemInfo && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Version: {systemInfo.version || 'v1.0.0'}
                  </div>
                </div>
              )}
            </div>
          </IOSCard>
        </div>
        
        {/* Main Visualization Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Custom Tab Interface */}
          <div className="w-full">
            <div className="flex w-full border-b">
              <IOSButton
                variant={activeTab === 'visualization' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('visualization')}
                className="flex-1 rounded-none border-b-2 border-transparent data-[active]:border-blue-500"
              >
                Visualization
              </IOSButton>
              <IOSButton
                variant={activeTab === 'comparison' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('comparison')}
                className="flex-1 rounded-none border-b-2 border-transparent data-[active]:border-blue-500"
              >
                Comparison
              </IOSButton>
            </div>
            
            {activeTab === 'visualization' && (
              <div className="mt-6">
                <IOSCard variant="elevated">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      {viewMode === '6d' ? '6-Dimensional' : '47-Dimensional'} Analysis
                    </h2>
                    {comparing && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                      </div>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                        <p className="text-sm text-gray-500">Loading visualization...</p>
                      </div>
                    </div>
                  ) : evaluations.length > 0 ? (
                    <VULCAVisualization
                      evaluations={evaluations}
                      dimensions={viewMode === '6d' ? dimensions.slice(0, 6) : dimensions}
                      viewMode={viewMode}
                      visualizationType={visualizationType}
                      culturalPerspective={culturalPerspective}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Radar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No evaluation data available</p>
                        <IOSButton
                          variant="primary"
                          size="sm"
                          onClick={loadDemoData}
                          className="mt-4"
                        >
                          Load Demo Data
                        </IOSButton>
                      </div>
                    </div>
                  )}
                </IOSCard>
              </div>
            )}
            
            {activeTab === 'comparison' && (
              <div className="mt-6">
                {selectedModels.length >= 2 && comparison ? (
                  <ComparisonView
                    comparison={comparison}
                    viewMode={viewMode}
                    culturalPerspective={culturalPerspective}
                  />
                ) : (
                  <IOSCard variant="elevated">
                    <div className="text-center text-gray-500 p-12">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select at least 2 models to see comparison</p>
                    </div>
                  </IOSCard>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VULCADemoPage;