/**
 * Unified hook for creation sessions — merges evaluate and create flows.
 *
 * Usage:
 *   const { create, result, isLoading, mode, events, error, reset } = useCreateSession();
 *   await create("ink wash landscape", undefined, "chinese_xieyi");
 */

import { useState, useCallback, useRef } from 'react';
import { API_PREFIX } from '../config/api';
import type { EvaluationResult } from '../components/evaluate/ResultCard';
import type { PipelineEvent } from './usePrototypePipeline';

type CreateMode = 'idle' | 'evaluate' | 'create';

interface CreateState {
  mode: CreateMode;
  sessionId: string | null;
  result: EvaluationResult | null;
  events: PipelineEvent[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;

  // Create mode fields
  bestCandidateId: string | null;
  bestImageUrl: string | null;
  totalRounds: number;
}

function mapEvalResponse(data: Record<string, unknown>): EvaluationResult {
  const scores = (data.scores ?? {}) as Record<string, number>;
  const recs = (data.recommendations ?? []) as string[];

  const dimensionLabels: Record<string, string> = {
    L1: 'Visual Perception',
    L2: 'Technical Analysis',
    L3: 'Cultural Context',
    L4: 'Critical Interpretation',
    L5: 'Philosophical Aesthetic',
  };

  const dimensions = Object.entries(scores).map(([key, val]) => ({
    name: dimensionLabels[key] || key,
    score: val as number,
  }));

  return {
    score: (data.weighted_total ?? 0) as number,
    summary: (data.summary ?? '') as string,
    riskLevel: ((data.risk_level ?? 'low') as string) as 'low' | 'medium' | 'high',
    dimensions,
    recommendations: recs,
    traditionUsed: (data.tradition ?? 'default') as string,
  };
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useCreateSession() {
  const [state, setState] = useState<CreateState>({
    mode: 'idle',
    sessionId: null,
    result: null,
    events: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    bestCandidateId: null,
    bestImageUrl: null,
    totalRounds: 0,
  });
  const abortRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const create = useCallback(async (
    intent: string,
    image?: File | null,
    tradition: string = 'default',
  ) => {
    // Cleanup previous
    abortRef.current?.abort();
    eventSourceRef.current?.close();

    const controller = new AbortController();
    abortRef.current = controller;

    const hasImage = !!image;
    const mode: CreateMode = hasImage ? 'evaluate' : 'create';

    setState({
      mode,
      sessionId: null,
      result: null,
      events: [],
      isLoading: true,
      isStreaming: false,
      error: null,
      bestCandidateId: null,
      bestImageUrl: null,
      totalRounds: 0,
    });

    try {
      const body: Record<string, unknown> = {
        intent,
        tradition,
        stream: false,
      };

      if (image) {
        body.image_base64 = await fileToBase64(image);
      }

      const response = await fetch(`${API_PREFIX}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-key',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error((errData as Record<string, string>).detail || `HTTP ${response.status}`);
      }

      const data = await response.json() as Record<string, unknown>;
      const sessionId = data.session_id as string;
      const responseMode = data.mode as string;

      if (responseMode === 'evaluate') {
        const mapped = mapEvalResponse(data);
        setState(prev => ({
          ...prev,
          sessionId,
          result: mapped,
          isLoading: false,
        }));
      } else {
        // Create mode — sync response
        setState(prev => ({
          ...prev,
          sessionId,
          bestCandidateId: (data.best_candidate_id as string) || null,
          bestImageUrl: (data.best_image_url as string) || null,
          totalRounds: (data.total_rounds as number) || 0,
          isLoading: false,
        }));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = (err as Error).message || 'Session failed';
      setState(prev => ({ ...prev, isLoading: false, error: msg }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    eventSourceRef.current?.close();
    setState({
      mode: 'idle',
      sessionId: null,
      result: null,
      events: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      bestCandidateId: null,
      bestImageUrl: null,
      totalRounds: 0,
    });
  }, []);

  return {
    create,
    reset,
    ...state,
  };
}
