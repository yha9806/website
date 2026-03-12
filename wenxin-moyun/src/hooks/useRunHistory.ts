/**
 * useRunHistory — fetches recent pipeline runs from the Gallery API
 * for display in the Run History panel on Canvas.
 */

import { useState, useEffect, useCallback } from 'react';
import { API_PREFIX } from '../config/api';

export interface RunHistoryItem {
  id: string;
  subject: string;
  tradition: string;
  overall: number;
  scores: Record<string, number>;
  best_image_url: string;
  total_rounds: number;
  total_latency_ms: number;
  created_at: number;
}

interface UseRunHistoryReturn {
  items: RunHistoryItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRunHistory(limit = 10): UseRunHistoryReturn {
  const [items, setItems] = useState<RunHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_PREFIX}/prototype/gallery?limit=${limit}&sort_by=newest`,
        { headers: { Authorization: 'Bearer demo-key' } },
      );
      if (!res.ok) throw new Error(`Gallery API ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { items, loading, error, refresh: fetchHistory };
}
