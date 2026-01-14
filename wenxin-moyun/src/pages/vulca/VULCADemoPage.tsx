/**
 * VULCA Demo Page
 * Main page for VULCA 47-dimensional evaluation demonstration
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ComparisonView } from './ComparisonView';
import { DimensionToggle } from '../../components/vulca/DimensionToggle';
import { ModelSelector } from '../../components/vulca/ModelSelector';
import { CulturalPerspectiveSelector } from '../../components/vulca/CulturalPerspectiveSelector';
import { VULCAVisualization } from '../../components/vulca/VULCAVisualization';
import { ExportButton } from '../../components/vulca/ExportButton';
import { useVULCAData } from '../../hooks/vulca/useVULCAData';
import type { ViewMode, VisualizationType, ViewLevel } from '../../types/vulca';
import { IOSAlert } from '../../components/ios/core/IOSAlert';
import { IOSCard } from '../../components/ios/core/IOSCard';
import { IOSButton } from '../../components/ios/core/IOSButton';
import {
  Loader2, BarChart3, Radar, Grid3x3, Download,
  RefreshCw, AlertCircle, WifiOff, CheckCircle, Clock,
  ChevronDown, ChevronUp, ChevronRight, BookOpen, Layers, Globe, FlaskConical,
  Flame, History, Palette, Calendar, ArrowRight, FileText, Sparkles
} from 'lucide-react';
import { CitationBlock } from '../../components/vulca/CitationBlock';
import { Link } from 'react-router-dom';
import { VULCA_VERSION, VERSION_BADGE } from '../../config/version';
import { downloadSampleReport } from '../../utils/pdfExport';

// Preset scenarios for quick demos
const PRESET_SCENARIOS = [
  {
    id: 'cross-cultural',
    name: 'Cross-Cultural Symbolism',
    description: 'Compare how models interpret fire imagery across cultures',
    icon: Flame,
    color: 'orange',
    settings: { viewMode: '47d' as const, perspective: 'universal', viewLevel: 'grouped' as const }
  },
  {
    id: 'historical',
    name: 'Historical Context',
    description: 'Evaluate historical awareness and temporal understanding',
    icon: History,
    color: 'purple',
    settings: { viewMode: '47d' as const, perspective: 'eastern', viewLevel: 'detailed' as const }
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic Critique',
    description: 'Deep aesthetic philosophy analysis (qiyun, yijing)',
    icon: Palette,
    color: 'blue',
    settings: { viewMode: '6d' as const, perspective: 'eastern', viewLevel: 'overview' as const }
  },
];

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Models will be loaded dynamically from the API

export const VULCADemoPage: React.FC = () => {
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string, organization: string}>>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]); // Will be set after models load
  const [viewMode, setViewMode] = useState<ViewMode>('6d');
  const [viewLevel, setViewLevel] = useState<ViewLevel>('overview');
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('radar');
  const [culturalPerspective, setCulturalPerspective] = useState<string>('eastern');
  const [activeTab, setActiveTab] = useState<'visualization' | 'comparison'>('visualization');
  const [methodologyExpanded, setMethodologyExpanded] = useState(false);
  
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
        const response = await fetch(`${API_BASE_URL}/api/v1/models/?include_vulca=true&limit=50`);
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
          { id: '9a410997-12fe-400a-b3ed-95098ffd007a', name: 'GPT-4o', organization: 'OpenAI' },
          { id: '95c5586d-dcad-4648-bee5-a42b209fd26d', name: 'Claude 3.5 Sonnet', organization: 'Anthropic' },
        ]);
        setSelectedModels(['9a410997-12fe-400a-b3ed-95098ffd007a', '95c5586d-dcad-4648-bee5-a42b209fd26d']);
      }
    };
    loadModels();
  }, []);
  
  // Handle model selection
  const handleModelSelect = useCallback((modelId: string) => {
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

  // Enhance evaluations with correct model names from availableModels
  const enhancedEvaluations = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return evaluations;

    // Create a lookup map for model names
    const modelNameMap = new Map(
      availableModels.map(m => [m.id, m.name])
    );

    return evaluations.map(evaluation => {
      // Try to find the correct name from availableModels
      const correctName = modelNameMap.get(evaluation.modelId) ||
                         modelNameMap.get(String(evaluation.modelId));

      return {
        ...evaluation,
        modelName: correctName || evaluation.modelName || `Model ${evaluation.modelId}`
      };
    });
  }, [evaluations, availableModels]);

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Connecting to evaluation framework</p>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-amber-700 bg-clip-text text-transparent">
              VULCA Multi-Dimensional Evaluation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Advanced AI Model Assessment: From 6 to 47 Dimensions with 8 Cultural Perspectives
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Offline Mode</span>
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
            
            <span className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300">
              EMNLP 2025 Findings
            </span>
          </div>
        </div>
        
        {/* Demo Library Banner */}
        <div className="mb-6 bg-gradient-to-r from-slate-50 to-amber-50 dark:from-slate-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-blue-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-slate-700 dark:text-slate-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Public Demo Library</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore VULCA evaluation with pre-configured scenarios
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/pricing">
                <IOSButton variant="secondary" size="sm">
                  Upgrade for Full Access
                  <ArrowRight className="w-4 h-4 ml-1" />
                </IOSButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Preset Scenario Buttons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Start Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setViewMode(scenario.settings.viewMode);
                  setCulturalPerspective(scenario.settings.perspective);
                  setViewLevel(scenario.settings.viewLevel);
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md
                  ${viewMode === scenario.settings.viewMode && culturalPerspective === scenario.settings.perspective
                    ? `border-${scenario.color}-500 bg-${scenario.color}-50 dark:bg-${scenario.color}-900/20`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <scenario.icon className={`w-5 h-5 text-${scenario.color}-500`} />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{scenario.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" aria-live="polite" className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {isConnected ? 'Error' : 'Connection Issue'}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                {errorDetails && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                      Technical Details
                    </summary>
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-x-auto">
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
              
              {/* View Level Selector - Only show for 47D mode */}
              {viewMode === '47d' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    View Level
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <IOSButton
                      variant={viewLevel === 'overview' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setViewLevel('overview')}
                    >
                      Overview (6D)
                    </IOSButton>
                    <IOSButton
                      variant={viewLevel === 'grouped' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setViewLevel('grouped')}
                    >
                      Grouped (8 Categories)
                    </IOSButton>
                    <IOSButton
                      variant={viewLevel === 'detailed' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setViewLevel('detailed')}
                    >
                      Detailed (All 47D)
                    </IOSButton>
                  </div>
                </div>
              )}
              
              {/* Visualization Type - Simplified */}
              {viewMode === '6d' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Visualization
                  </label>
                  <IOSButton
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    <Radar className="w-4 h-4 mr-1" />
                    Radar Chart
                  </IOSButton>
                </div>
              )}
              
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
                <span className="text-gray-600 dark:text-gray-400">Models Selected:</span>
                <span className="font-medium">{selectedModels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                <span className="font-medium">{viewMode === '6d' ? '6' : '47'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expansion Rate:</span>
                <span className="font-medium">683%</span>
              </div>
              {comparison && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Difference:</span>
                    <span className="font-medium">
                      {comparison.summary?.averageDifference?.toFixed(2) || 'N/A'}
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
                    {new Date(lastSync).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {VERSION_BADGE.short} | Dataset {VULCA_VERSION.dataset}
                </div>
              </div>
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
                className="flex-1 rounded-none border-b-2 border-transparent data-[active]:border-slate-600"
              >
                Visualization
              </IOSButton>
              <IOSButton
                variant={activeTab === 'comparison' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('comparison')}
                className="flex-1 rounded-none border-b-2 border-transparent data-[active]:border-slate-600"
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
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                      </div>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading visualization...</p>
                      </div>
                    </div>
                  ) : enhancedEvaluations.length > 0 ? (
                    <VULCAVisualization
                      evaluations={enhancedEvaluations}
                      dimensions={viewMode === '6d' ? dimensions.slice(0, 6) : dimensions}
                      viewMode={viewMode}
                      viewLevel={viewLevel}
                      visualizationType={visualizationType}
                      culturalPerspective={culturalPerspective}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Radar className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No evaluation data available</p>
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
                {selectedModels.length >= 2 && comparison && comparison.summary ? (
                  <ComparisonView
                    comparison={comparison}
                    viewMode={viewMode}
                    culturalPerspective={culturalPerspective}
                  />
                ) : (
                  <IOSCard variant="elevated">
                    <div className="text-center text-gray-500 dark:text-gray-400 p-12">
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

      {/* About VULCA Framework - Methodology Section */}
      <div className="mt-12">
        <IOSCard variant="elevated">
          <button
            onClick={() => setMethodologyExpanded(!methodologyExpanded)}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            aria-expanded={methodologyExpanded}
            aria-controls="methodology-content"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-slate-700 dark:text-slate-500" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  About VULCA Framework
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Methodology, dimensions, and cultural perspectives
                </p>
              </div>
            </div>
            {methodologyExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {methodologyExpanded && (
            <div id="methodology-content" className="mt-6 space-y-8 animate-in fade-in duration-300">
              {/* Overview */}
              <div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>VULCA</strong> (Vision-Understanding and Language-based Cultural Adaptability) is a comprehensive
                  evaluation framework designed to assess AI models' artistic creation capabilities through multi-dimensional
                  analysis. The framework evaluates AI-generated art across <strong>47 fine-grained dimensions</strong>,
                  grouped into <strong>6 core categories</strong>, with consideration of <strong>8 distinct cultural perspectives</strong>.
                </p>
              </div>

              {/* 6D → 47D Expansion */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    6D → 47D Dimension Expansion
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The VULCA framework expands 6 core dimensions into 47 fine-grained evaluation metrics using
                  inter-dimensional correlation matrices and artistic theory foundations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-slate-700 dark:text-slate-500 mb-2">Creativity (8 sub-dimensions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Originality, Innovation, Novelty, Unconventionality...</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Technique (8 sub-dimensions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Skill Mastery, Precision, Craftsmanship, Medium Control...</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Emotion (8 sub-dimensions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Emotional Depth, Authenticity, Resonance, Evocativeness...</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">Context (8 sub-dimensions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Historical Awareness, Cultural Reference, Symbolism...</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-amber-700 dark:text-amber-500 mb-2">Innovation (8 sub-dimensions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Boundary Pushing, Experimental, Paradigm Shifting...</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">Impact (7 sub-dimensions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Influence, Memorability, Social Relevance, Legacy...</p>
                  </div>
                </div>
              </div>

              {/* 8 Cultural Perspectives */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    8 Cultural Perspectives
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Art evaluation is inherently culturally influenced. VULCA incorporates 8 distinct cultural perspectives
                  to provide balanced, multi-cultural assessment of AI-generated art.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Eastern', desc: 'Chinese, Japanese, Korean traditions', color: 'red' },
                    { name: 'Western', desc: 'European & American aesthetics', color: 'blue' },
                    { name: 'Islamic', desc: 'Middle Eastern art philosophy', color: 'emerald' },
                    { name: 'African', desc: 'Pan-African artistic heritage', color: 'amber' },
                    { name: 'Latin American', desc: 'Indigenous & colonial fusion', color: 'orange' },
                    { name: 'South Asian', desc: 'Indian subcontinent traditions', color: 'purple' },
                    { name: 'Southeast Asian', desc: 'ASEAN cultural expressions', color: 'teal' },
                    { name: 'Universal', desc: 'Cross-cultural common ground', color: 'gray' },
                  ].map((perspective) => (
                    <div
                      key={perspective.name}
                      className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{perspective.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{perspective.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation Methodology */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Evaluation Methodology
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-500 flex-shrink-0">1</span>
                    <p><strong>Multi-Model Comparison:</strong> AI artworks are evaluated across multiple dimensions, allowing direct comparison of model capabilities.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-500 flex-shrink-0">2</span>
                    <p><strong>Dimension Weighting:</strong> Each cultural perspective applies different weights to the 47 dimensions based on cultural values and artistic traditions.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-500 flex-shrink-0">3</span>
                    <p><strong>Score Aggregation:</strong> Final scores combine dimension scores with cultural weights to produce perspective-specific and universal ratings.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-500 flex-shrink-0">4</span>
                    <p><strong>Visualization:</strong> Results are presented through radar charts, bar graphs, and detailed breakdowns for comprehensive analysis.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </IOSCard>
      </div>

      {/* L1-L5 Five-Layer Framework Section (Based on VULCA-BENCH Paper) */}
      <div className="mt-12">
        <IOSCard variant="elevated">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-700 dark:text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                L1-L5 Five-Layer Evaluation Framework
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                From Visual Perception to Philosophical Aesthetics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { level: 'L1', name: 'Visual Perception', desc: 'Basic visual elements recognition', color: 'blue', gap: '95%' },
              { level: 'L2', name: 'Technical Analysis', desc: 'Composition, technique, brushwork', color: 'green', gap: '88%' },
              { level: 'L3', name: 'Cultural Symbolism', desc: 'Culture-specific symbolic interpretation', color: 'yellow', gap: '62%' },
              { level: 'L4', name: 'Historical Context', desc: 'Historical and temporal understanding', color: 'orange', gap: '45%' },
              { level: 'L5', name: 'Philosophical Aesthetics', desc: 'Deep aesthetic philosophy (e.g., qiyun, yijing)', color: 'red', gap: '38%' },
            ].map((layer, index) => (
              <div key={layer.level} className={`relative p-4 rounded-xl bg-${layer.color}-50 dark:bg-${layer.color}-900/20 border border-${layer.color}-200 dark:border-${layer.color}-800`}>
                <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs font-bold bg-${layer.color}-500 text-white`}>
                  {layer.level}
                </div>
                <h4 className={`font-semibold text-${layer.color}-700 dark:text-${layer.color}-300 mt-2`}>
                  {layer.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {layer.desc}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>VLM Avg.</span>
                    <span className="font-medium">{layer.gap}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${layer.color}-500 rounded-full`}
                      style={{ width: layer.gap }}
                    />
                  </div>
                </div>
                {index < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
            Research shows a 25-40% performance gap between L1-L2 (surface) and L3-L5 (deep cultural) layers
          </p>
        </IOSCard>
      </div>

      {/* 8 Cultural Persona Cards Section (Based on EMNLP 2025 Paper) */}
      <div className="mt-8">
        <IOSCard variant="elevated">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                8 Cultural Perspective Persona Cards
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Expert-inspired evaluation personas for cross-cultural art critique
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Su Shi', culture: 'Chinese', era: 'Song Dynasty', focus: 'Literati aesthetics, qiyun', icon: '🎨' },
              { name: 'Guo Xi', culture: 'Chinese', era: 'Song Dynasty', focus: 'Landscape painting theory', icon: '🏔️' },
              { name: 'John Ruskin', culture: 'Western', era: '19th Century', focus: 'Moral aesthetics, naturalism', icon: '🖼️' },
              { name: 'Okakura Kakuzō', culture: 'Japanese', era: 'Meiji Era', focus: 'Eastern aesthetics bridge', icon: '🍵' },
              { name: 'Mama Zola', culture: 'African', era: 'Contemporary', focus: 'Pan-African visual traditions', icon: '🌍' },
              { name: 'Prof. Elena Petrova', culture: 'Russian', era: 'Contemporary', focus: 'Socialist realism, iconography', icon: '⛪' },
              { name: 'Brother Thomas', culture: 'Islamic', era: 'Contemporary', focus: 'Geometric patterns, calligraphy', icon: '🕌' },
              { name: 'Dr. Aris Thorne', culture: 'Universal', era: 'Contemporary', focus: 'Cross-cultural synthesis', icon: '🌐' },
            ].map((persona) => (
              <div key={persona.name} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{persona.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {persona.name}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-500 font-medium">
                  {persona.culture} • {persona.era}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {persona.focus}
                </p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
            Persona-guided prompting improves VLM cultural critique performance by 20-30%
          </p>
        </IOSCard>
      </div>

      {/* Symbolic Shortcuts & Cultural Bias Analysis (Based on WiNLP 2025 Paper) */}
      <div className="mt-8">
        <IOSCard variant="elevated">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Symbolic Shortcuts & Cultural Bias
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Diagnostic findings on VLM cultural reasoning limitations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Western vs Non-Western Performance */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Cultural Recognition Accuracy
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'Burning Man (Western)', accuracy: 100, color: 'green' },
                  { name: 'Las Fallas (Western)', accuracy: 100, color: 'green' },
                  { name: 'Inti Raymi (Peruvian)', accuracy: 43, color: 'yellow' },
                  { name: 'Huobajie (Chinese)', accuracy: 0, color: 'red' },
                  { name: 'Sadeh (Iranian)', accuracy: 0, color: 'red' },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                      <span className={`font-medium text-${item.color}-600 dark:text-${item.color}-400`}>
                        {item.accuracy}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${item.color}-500 rounded-full`}
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Findings */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Key Research Findings
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0">!</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Symbolic Shortcuts:</strong> Models map fire imagery to common Western associations, missing cultural context
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 flex-shrink-0">!</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Safety Risk:</strong> Wildfires misclassified as festivals (e.g., Guy Fawkes Night)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-500 flex-shrink-0">i</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Western Bias:</strong> 100% accuracy on Burning Man vs 0% on Huobajie
                  </p>
                </div>
              </div>
            </div>
          </div>
        </IOSCard>
      </div>

      {/* CTA Banner - Upgrade to Full Evaluation */}
      <div className="mt-12">
        <div className="bg-gradient-to-r from-slate-700 to-amber-700 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready for Full 47D Evaluation?</h3>
              <p className="text-slate-100">
                Get comprehensive cultural analysis, PDF reports, and enterprise-grade diagnostics for your AI models.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <CheckCircle className="w-4 h-4" />
                  <span>Full 47D Diagnostics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <CheckCircle className="w-4 h-4" />
                  <span>8 Cultural Perspectives</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <CheckCircle className="w-4 h-4" />
                  <span>PDF Reports</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/demo">
                <IOSButton variant="glass" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book a Demo
                </IOSButton>
              </Link>
              <Link to="/solutions">
                <IOSButton variant="secondary" size="lg" className="bg-white text-slate-700 hover:bg-slate-50">
                  View Solutions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </IOSButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Report Download */}
      <div className="mt-8">
        <IOSCard variant="flat">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Download Sample Report</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  See what a full VULCA evaluation report looks like (PDF, 25 pages)
                </p>
              </div>
            </div>
            <IOSButton variant="secondary" onClick={downloadSampleReport}>
              <Download className="w-4 h-4 mr-2" />
              Download Sample
            </IOSButton>
          </div>
        </IOSCard>
      </div>

      {/* Citation Block - Updated with Real Paper Information */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-600" />
          Related Publications
        </h3>

        <CitationBlock
          bibtex={`@inproceedings{yu2025vulca,
  title={VULCA: Evaluating Vision-Language Models in Culturally Situated Art Critiques},
  author={Yu, Haorui and Zhao, Yang and Chu, Yijia and Yi, Qiufeng},
  booktitle={Findings of the Association for Computational Linguistics: EMNLP 2025},
  year={2025},
  publisher={Association for Computational Linguistics}
}`}
          title="VULCA: Evaluating Vision-Language Models in Culturally Situated Art Critiques"
          conference="EMNLP 2025 Findings"
          year="2025"
          links={{
            paper: "https://aclanthology.org/2025.findings-emnlp.103/",
            github: "https://github.com/yha9806/EMNLP2025-VULCA",
          }}
        />

        <CitationBlock
          bibtex={`@article{yu2025vulcabench,
  title={VULCA-BENCH: A Multicultural Vision-Language Benchmark for Culturally Grounded Art Understanding},
  author={Yu, Haorui and Zhao, Yang and Chu, Yijia and Yi, Qiufeng},
  journal={arXiv preprint},
  year={2025}
}`}
          title="VULCA-BENCH: A Multicultural Vision-Language Benchmark (7,410 pairs, 8 cultures, 225 dimensions)"
          conference="Dataset Paper"
          year="2025"
        />

        <CitationBlock
          bibtex={`@inproceedings{yu2025symbols,
  title={Seeing Symbols, Missing Cultures: Probing Vision-Language Models' Reasoning on Fire Imagery and Cultural Meaning},
  author={Yu, Haorui and Zhao, Yang and Chu, Yijia and Yi, Qiufeng},
  booktitle={Proceedings of the 9th Widening NLP Workshop (WiNLP)},
  year={2025},
  publisher={Association for Computational Linguistics}
}`}
          title="Seeing Symbols, Missing Cultures: VLM Cultural Reasoning Diagnostics"
          conference="WiNLP 2025"
          year="2025"
          links={{
            paper: "https://aclanthology.org/2025.winlp-main.1/",
          }}
        />
      </div>
    </div>
  );
};

export default VULCADemoPage;