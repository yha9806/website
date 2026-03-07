/**
 * Shared hook for NoCode evaluation — enables "evaluate anywhere" across pages.
 *
 * Usage:
 *   const { evaluate, result, isLoading, error, reset } = useNoCodeEvaluate();
 *   await evaluate("Check this for Japanese market", imageFile);
 */

import { useState, useCallback, useRef } from 'react';
import { API_PREFIX } from '../config/api';
import type { EvaluationResult } from '../components/evaluate/ResultCard';

interface NoCodeState {
  result: EvaluationResult | null;
  skillsUsed: string[];
  isLoading: boolean;
  error: string | null;
}

function mapApiResponse(data: Record<string, unknown>): EvaluationResult {
  const card = (data.result_card ?? {}) as Record<string, unknown>;
  const scores = (card.dimensions ?? data.scores ?? {}) as Record<string, number>;
  const recs = (card.recommendations ?? data.recommendations ?? []) as string[];

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

  const extras = (data.extra_skill_results ?? []) as Array<Record<string, unknown>>;
  for (const extra of extras) {
    dimensions.push({
      name: (extra.skill as string) || 'Extra',
      score: (extra.score as number) || 0,
    });
  }

  return {
    score: (card.score ?? data.weighted_total ?? 0) as number,
    summary: (card.summary ?? '') as string,
    riskLevel: ((card.risk_level ?? 'low') as string) as 'low' | 'medium' | 'high',
    dimensions,
    recommendations: recs,
    traditionUsed: (card.tradition_used ?? data.tradition_used ?? 'default') as string,
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

export function useNoCodeEvaluate() {
  const [state, setState] = useState<NoCodeState>({
    result: null,
    skillsUsed: [],
    isLoading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const evaluate = useCallback(async (
    intent: string,
    image?: File | null,
    imageUrl?: string,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ result: null, skillsUsed: [], isLoading: true, error: null });

    try {
      const body: Record<string, unknown> = { intent };

      if (image) {
        body.image_base64 = await fileToBase64(image);
      } else if (imageUrl) {
        body.image_url = imageUrl;
      } else {
        body.image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg';
      }

      const response = await fetch(`${API_PREFIX}/evaluate/nocode`, {
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
      const mapped = mapApiResponse(data);
      setState({
        result: mapped,
        skillsUsed: (data.skills_used ?? []) as string[],
        isLoading: false,
        error: null,
      });
      return mapped;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      const msg = (err as Error).message || 'Evaluation failed';
      setState(prev => ({ ...prev, isLoading: false, error: msg }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ result: null, skillsUsed: [], isLoading: false, error: null });
  }, []);

  return {
    evaluate,
    reset,
    ...state,
  };
}
