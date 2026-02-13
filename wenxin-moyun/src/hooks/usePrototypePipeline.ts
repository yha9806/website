/**
 * SSE hook for the VULCA prototype pipeline.
 *
 * Connects to GET /api/v1/prototype/runs/{taskId}/events and
 * provides reactive state for pipeline progress, candidates, scores, etc.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_PREFIX } from '../config/api';

export interface PipelineEvent {
  event_type: string;
  stage: string;
  round_num: number;
  payload: Record<string, unknown>;
  timestamp_ms: number;
}

export interface DraftCandidate {
  candidate_id: string;
  image_path: string;
  image_url?: string;
  prompt: string;
  seed: number;
  model_ref: string;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  rationale: string;
}

export interface ScoredCandidate {
  candidate_id: string;
  dimension_scores: DimensionScore[];
  weighted_total: number;
  gate_passed: boolean;
  risk_tags: string[];
}

export interface QueenDecision {
  action: string;
  reason: string;
  rerun_dimensions: string[];
  round: number;
}

export interface HitlConstraints {
  locked_dimensions: string[];
  rerun_dimensions: string[];
  preserved_dimensions: string[];
  applied_scores: number;
  candidates_touched: number;
}

export interface PipelineState {
  taskId: string | null;
  status: 'idle' | 'running' | 'waiting_human' | 'completed' | 'failed';
  currentStage: string;
  currentRound: number;
  events: PipelineEvent[];

  // Scout
  evidence: Record<string, unknown> | null;

  // Draft
  candidates: DraftCandidate[];

  // Critic
  scoredCandidates: ScoredCandidate[];
  bestCandidateId: string | null;
  hitlConstraints: HitlConstraints | null;

  // Queen
  decision: QueenDecision | null;

  // Final
  finalDecision: string | null;
  totalCostUsd: number;
  totalRounds: number;
  totalLatencyMs: number;
  error: string | null;
}

const INITIAL_STATE: PipelineState = {
  taskId: null,
  status: 'idle',
  currentStage: '',
  currentRound: 0,
  events: [],
  evidence: null,
  candidates: [],
  scoredCandidates: [],
  bestCandidateId: null,
  hitlConstraints: null,
  decision: null,
  finalDecision: null,
  totalCostUsd: 0,
  totalRounds: 0,
  totalLatencyMs: 0,
  error: null,
};

interface CreateRunParams {
  subject: string;
  tradition: string;
  provider?: string;
  n_candidates?: number;
  max_rounds?: number;
  enable_hitl?: boolean;
}

export function usePrototypePipeline() {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);

  const updateState = useCallback((partial: Partial<PipelineState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const processEvent = useCallback((event: PipelineEvent) => {
    const { event_type, stage, round_num, payload } = event;

    setState(prev => {
      const newEvents = [...prev.events, event];
      const update: Partial<PipelineState> = { events: newEvents };

      switch (event_type) {
        case 'stage_started':
          update.currentStage = stage;
          update.currentRound = round_num;
          update.status = 'running';
          break;

        case 'stage_completed':
          if (stage === 'scout') {
            update.evidence = (payload.evidence as Record<string, unknown>) || null;
          } else if (stage === 'draft') {
            update.candidates = (payload.candidates as DraftCandidate[]) || [];
          } else if (stage === 'critic') {
            const critique = payload.critique as Record<string, unknown> | undefined;
            if (critique) {
              update.scoredCandidates = (critique.scored_candidates as ScoredCandidate[]) || [];
              update.bestCandidateId = (critique.best_candidate_id as string) || null;
            }
            const rawConstraints = payload.hitl_constraints as Partial<HitlConstraints> | undefined;
            if (rawConstraints && typeof rawConstraints === 'object' && Object.keys(rawConstraints).length > 0) {
              update.hitlConstraints = {
                locked_dimensions: Array.isArray(rawConstraints.locked_dimensions) ? rawConstraints.locked_dimensions : [],
                rerun_dimensions: Array.isArray(rawConstraints.rerun_dimensions) ? rawConstraints.rerun_dimensions : [],
                preserved_dimensions: Array.isArray(rawConstraints.preserved_dimensions) ? rawConstraints.preserved_dimensions : [],
                applied_scores: typeof rawConstraints.applied_scores === 'number' ? rawConstraints.applied_scores : 0,
                candidates_touched: typeof rawConstraints.candidates_touched === 'number' ? rawConstraints.candidates_touched : 0,
              };
            } else {
              update.hitlConstraints = null;
            }
          }
          break;

        case 'decision_made':
          update.decision = {
            action: payload.action as string,
            reason: payload.reason as string,
            rerun_dimensions: (payload.rerun_dimensions as string[]) || [],
            round: payload.round as number,
          };
          break;

        case 'human_required':
          update.status = 'waiting_human';
          break;

        case 'human_received':
          update.status = 'running';
          break;

        case 'pipeline_completed':
          update.status = 'completed';
          update.finalDecision = payload.final_decision as string;
          update.totalCostUsd = (payload.total_cost_usd as number) || 0;
          update.totalRounds = (payload.total_rounds as number) || 0;
          update.totalLatencyMs = (payload.total_latency_ms as number) || 0;
          break;

        case 'pipeline_failed':
          update.status = 'failed';
          update.error = (payload.error as string) || 'Unknown error';
          break;
      }

      return { ...prev, ...update };
    });
  }, []);

  const startRun = useCallback(async (params: CreateRunParams) => {
    // Reset state
    setState({ ...INITIAL_STATE, status: 'running' });

    try {
      const res = await fetch(`${API_PREFIX}/prototype/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        const detail = err.detail || 'Unknown error';
        let errorMsg: string;

        if (res.status === 400 && typeof detail === 'string' && detail.includes('API_KEY')) {
          errorMsg = `Provider configuration error: ${detail}. Select "Mock" provider or configure the API key on the server.`;
        } else if (res.status === 429) {
          errorMsg = 'Daily run limit reached. Please try again tomorrow.';
        } else if (res.status === 422) {
          const fields = Array.isArray(detail)
            ? detail.map((d: { loc?: string[]; msg?: string }) => `${d.loc?.join('.')} — ${d.msg}`).join('; ')
            : String(detail);
          errorMsg = `Invalid request: ${fields}`;
        } else if (res.status >= 500) {
          errorMsg = `Server error (${res.status}). Please try again later.`;
        } else {
          errorMsg = `Request failed (${res.status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
        }

        updateState({ status: 'failed', error: errorMsg });
        return;
      }

      const data = await res.json();
      const taskId = data.task_id;
      updateState({ taskId });

      // Connect SSE
      const es = new EventSource(`${API_PREFIX}/prototype/runs/${taskId}/events`);
      eventSourceRef.current = es;

      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as PipelineEvent;
          processEvent(event);

          if (event.event_type === 'pipeline_completed' || event.event_type === 'pipeline_failed') {
            es.close();
            eventSourceRef.current = null;
          }
        } catch {
          // Skip malformed events
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        // Only set failed if not already completed
        setState(prev => {
          if (prev.status === 'running') {
            return { ...prev, status: 'failed', error: 'Connection to server lost. The pipeline may still be running — check status later.' };
          }
          return prev;
        });
      };
    } catch (err) {
      const msg = err instanceof TypeError
        ? 'Cannot reach server. Please check that the backend is running.'
        : String(err);
      updateState({ status: 'failed', error: msg });
    }
  }, [updateState, processEvent]);

  const submitAction = useCallback(async (
    action: string,
    options?: { locked_dimensions?: string[]; rerun_dimensions?: string[]; candidate_id?: string; reason?: string },
  ) => {
    if (!state.taskId) return;

    try {
      const res = await fetch(`${API_PREFIX}/prototype/runs/${state.taskId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...options }),
      });

      if (!res.ok) {
        console.error('Failed to submit action:', await res.text());
      }
    } catch (err) {
      console.error('Submit action error:', err);
    }
  }, [state.taskId]);

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    state,
    startRun,
    submitAction,
    reset,
  };
}
