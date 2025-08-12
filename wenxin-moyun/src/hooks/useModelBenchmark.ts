import { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface ResponseDetail {
  dimension: string;
  test_id: string;
  prompt: string;
  response: string;
  score: number;
  analysis: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    highlights: string[];
  };
  response_time: number;
  tokens_used: number;
}

interface BenchmarkData {
  timestamp: string;
  test_count: number;
  success_count: number;
  detailed_scores: ResponseDetail[];
}

export const useModelBenchmark = (modelId?: string) => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) return;

    const fetchBenchmarkData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch model detail which includes benchmark_results
        const response = await apiClient.get(`/models/${modelId}`);
        
        if (response.data && response.data.benchmark_results) {
          // Parse benchmark_results if it's a string
          const benchmarkResults = typeof response.data.benchmark_results === 'string'
            ? JSON.parse(response.data.benchmark_results)
            : response.data.benchmark_results;
          
          setBenchmarkData(benchmarkResults);
        } else {
          setBenchmarkData(null);
        }
      } catch (err) {
        console.error('Error fetching benchmark data:', err);
        setError('Failed to load benchmark data');
        setBenchmarkData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarkData();
  }, [modelId]);

  return { benchmarkData, loading, error };
};