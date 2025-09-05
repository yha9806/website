/**
 * useVULCAData Hook
 * Custom hook for managing VULCA evaluation data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { vulcaService } from '../../utils/vulca/api';
import type { 
  VULCAEvaluation,
  VULCAComparison,
  VULCADimensionInfo,
  VULCACulturalPerspectiveInfo,
  VULCAScore6D,
} from '../../types/vulca';


interface UseVULCADataReturn {
  // Data
  evaluations: VULCAEvaluation[];
  comparison: VULCAComparison | null;
  dimensions: VULCADimensionInfo[];
  perspectives: VULCACulturalPerspectiveInfo[];
  systemInfo: any | null;
  
  // Loading states
  loading: boolean;
  initializing: boolean;
  evaluating: boolean;
  comparing: boolean;
  
  // Error state
  error: string | null;
  errorDetails: any | null;
  
  // Connection status
  isConnected: boolean;
  lastSync: Date | null;
  
  // Actions
  evaluateModel: (modelId: number, scores6D: VULCAScore6D, modelName?: string) => Promise<void>;
  compareModels: (modelIds: number[]) => Promise<void>;
  loadDimensions: () => Promise<void>;
  loadPerspectives: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  retryConnection: () => Promise<void>;
}

// SessionStorage helper functions
const SESSION_STORAGE_KEY = 'vulca_data_cache';

function saveToSessionStorage(key: string, data: any): void {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const cache = existing ? JSON.parse(existing) : {};
    cache[key] = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Failed to save to session storage:', err);
  }
}

function loadFromSessionStorage(key: string, maxAge = 1800000): any | null {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!existing) return null;
    
    const cache = JSON.parse(existing);
    const entry = cache[key];
    if (!entry) return null;
    
    // Check if data is still fresh
    if (Date.now() - entry.timestamp > maxAge) {
      delete cache[key];
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
      return null;
    }
    
    return entry.data;
  } catch (err) {
    console.warn('Failed to load from session storage:', err);
    return null;
  }
}

export function useVULCAData(initialModelIds?: number[]): UseVULCADataReturn {
  const [evaluations, setEvaluations] = useState<VULCAEvaluation[]>([]);
  const [comparison, setComparison] = useState<VULCAComparison | null>(null);
  const [dimensions, setDimensions] = useState<VULCADimensionInfo[]>([]);
  const [perspectives, setPerspectives] = useState<VULCACulturalPerspectiveInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const isMounted = useRef(true);

  // Initialize data on mount
  useEffect(() => {
    initializeData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load initial comparison if model IDs provided
  useEffect(() => {
    if (initialModelIds && initialModelIds.length >= 2 && isConnected) {
      compareModels(initialModelIds);
    }
  }, [initialModelIds?.join(','), isConnected]);
  
  // Initialize all data
  const initializeData = async () => {
    try {
      setInitializing(true);
      
      // Check connection first
      const connected = await vulcaService.healthCheck();
      setIsConnected(connected);
      
      if (!connected) {
        // Try to load from session storage
        const cachedDims = loadFromSessionStorage('dimensions');
        const cachedPersp = loadFromSessionStorage('perspectives');
        
        if (cachedDims) setDimensions(cachedDims);
        if (cachedPersp) setPerspectives(cachedPersp);
        
        setError('Unable to connect to VULCA API. Using cached data.');
        return;
      }
      
      // Load all initial data in parallel
      const [info, dims, persp] = await Promise.all([
        vulcaService.getInfo(),
        vulcaService.getDimensions(),
        vulcaService.getCulturalPerspectives()
      ]);
      
      if (isMounted.current) {
        setSystemInfo(info);
        setDimensions(dims);
        setPerspectives(persp);
        setLastSync(new Date());
        
        // Save to session storage
        saveToSessionStorage('dimensions', dims);
        saveToSessionStorage('perspectives', persp);
      }
      
    } catch (err: any) {
      console.error('Error initializing VULCA data:', err);
      
      // Try to load from session storage as fallback
      const cachedDims = loadFromSessionStorage('dimensions');
      const cachedPersp = loadFromSessionStorage('perspectives');
      
      if (cachedDims) setDimensions(cachedDims);
      if (cachedPersp) setPerspectives(cachedPersp);
      
      if (isMounted.current) {
        setError(err.message || 'Failed to initialize VULCA data');
        setErrorDetails(err);
      }
    } finally {
      if (isMounted.current) {
        setInitializing(false);
      }
    }
  };

  const loadDimensions = useCallback(async () => {
    try {
      setLoading(true);
      const dims = await vulcaService.getDimensions();
      if (isMounted.current) {
        setDimensions(dims);
        saveToSessionStorage('dimensions', dims);
        setLastSync(new Date());
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError('Failed to load dimensions');
        setErrorDetails(err);
      }
      console.error('Error loading dimensions:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadPerspectives = useCallback(async () => {
    try {
      setLoading(true);
      const persp = await vulcaService.getCulturalPerspectives();
      if (isMounted.current) {
        setPerspectives(persp);
        saveToSessionStorage('perspectives', persp);
        setLastSync(new Date());
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError('Failed to load cultural perspectives');
        setErrorDetails(err);
      }
      console.error('Error loading perspectives:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const evaluateModel = useCallback(async (
    modelId: number,
    scores6D: VULCAScore6D,
    modelName?: string
  ) => {
    try {
      setEvaluating(true);
      setError(null);
      
      const evaluation = await vulcaService.evaluateModel(modelId, scores6D, modelName);
      
      // Add to evaluations list
      setEvaluations(prev => {
        // Replace if exists, otherwise append
        const index = prev.findIndex(e => e.modelId === modelId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = evaluation;
          return updated;
        }
        return [...prev, evaluation];
      });
      
    } catch (err: any) {
      const message = err.message || 'Failed to evaluate model';
      if (isMounted.current) {
        setError(message);
        setErrorDetails(err);
      }
      console.error('Error evaluating model:', err);
    } finally {
      if (isMounted.current) {
        setEvaluating(false);
      }
    }
  }, []);

  const compareModels = useCallback(async (modelIds: number[]) => {
    if (modelIds.length < 2) {
      setError('At least 2 models required for comparison');
      return;
    }
    
    try {
      setComparing(true);
      setError(null);
      
      const comparisonResult = await vulcaService.compareModels(modelIds);
      setComparison(comparisonResult);
      
      // Also update evaluations from comparison data
      if (comparisonResult.models) {
        setEvaluations(comparisonResult.models);
      }
      
    } catch (err: any) {
      const message = err.message || 'Failed to compare models';
      if (isMounted.current) {
        setError(message);
        setErrorDetails(err);
      }
      console.error('Error comparing models:', err);
    } finally {
      if (isMounted.current) {
        setComparing(false);
      }
    }
  }, []);

  const loadDemoData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const demoComparison = await vulcaService.getDemoComparison();
      if (isMounted.current) {
        setComparison(demoComparison);
        if (demoComparison.models) {
          setEvaluations(demoComparison.models);
        }
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError('Failed to load demo data');
        setErrorDetails(err);
      }
      console.error('Error loading demo data:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);
  
  const refreshAll = useCallback(async () => {
    vulcaService.clearCache();
    await initializeData();
  }, []);
  
  const retryConnection = useCallback(async () => {
    setError(null);
    setErrorDetails(null);
    await initializeData();
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  return {
    // Data
    evaluations,
    comparison,
    dimensions,
    perspectives,
    systemInfo,
    
    // Loading states
    loading,
    initializing,
    evaluating,
    comparing,
    
    // Error state
    error,
    errorDetails,
    
    // Connection status
    isConnected,
    lastSync,
    
    // Actions
    evaluateModel,
    compareModels,
    loadDimensions,
    loadPerspectives,
    loadDemoData,
    refreshAll,
    clearError,
    retryConnection,
  };
}

export default useVULCAData;