import { useState, useEffect, useCallback } from 'react';
import type { EvaluationTask } from '../types/types';
import { evaluationsService } from '../services/evaluations.service';

export function useEvaluations(modelId?: string, taskType?: string) {
  const [evaluations, setEvaluations] = useState<EvaluationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await evaluationsService.getEvaluations(page, pageSize, modelId, taskType);
      setEvaluations(response.evaluations);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load evaluations');
      console.error('Error fetching evaluations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, modelId, taskType]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const createEvaluation = async (data: {
    modelId: string;
    taskType: 'poem' | 'story' | 'painting' | 'music';
    prompt: string;
    parameters?: Record<string, any>;
  }) => {
    try {
      const newEvaluation = await evaluationsService.createEvaluation(data);
      setEvaluations(prev => [newEvaluation, ...prev]);
      return newEvaluation;
    } catch (err) {
      console.error('Error creating evaluation:', err);
      throw err;
    }
  };

  const updateEvaluation = async (id: string, data: {
    humanScore?: number;
    humanFeedback?: string;
  }) => {
    try {
      const updatedEvaluation = await evaluationsService.updateEvaluation(id, data);
      setEvaluations(prev => prev.map(e => e.id === id ? updatedEvaluation : e));
      return updatedEvaluation;
    } catch (err) {
      console.error('Error updating evaluation:', err);
      throw err;
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      await evaluationsService.deleteEvaluation(id);
      setEvaluations(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      throw err;
    }
  };

  const refreshEvaluations = () => {
    fetchEvaluations();
  };

  return {
    evaluations,
    loading,
    error,
    total,
    page,
    setPage,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    refreshEvaluations
  };
}

export function useEvaluation(id: string) {
  const [evaluation, setEvaluation] = useState<EvaluationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await evaluationsService.getEvaluation(id);
        setEvaluation(data);
      } catch (err) {
        setError('Failed to load evaluation');
        console.error('Error fetching evaluation:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvaluation();
    }
  }, [id]);

  const updateEvaluation = async (data: {
    humanScore?: number;
    humanFeedback?: string;
  }) => {
    if (!id) return;
    
    try {
      const updatedEvaluation = await evaluationsService.updateEvaluation(id, data);
      setEvaluation(updatedEvaluation);
      return updatedEvaluation;
    } catch (err) {
      console.error('Error updating evaluation:', err);
      throw err;
    }
  };

  return {
    evaluation,
    loading,
    error,
    updateEvaluation
  };
}