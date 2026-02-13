/**
 * Pipeline stage progress indicator with per-step timing and event log.
 */

import { useState } from 'react';
import type { PipelineEvent } from '../../hooks/usePrototypePipeline';

const STAGES = ['scout', 'draft', 'critic', 'queen', 'archivist'];

const STAGE_LABELS: Record<string, string> = {
  scout: 'Scout',
  draft: 'Draft',
  critic: 'Critic',
  queen: 'Queen',
  archivist: 'Archive',
};

interface Props {
  currentStage: string;
  currentRound: number;
  status: string;
  events: PipelineEvent[];
}

/** Compute per-stage duration from events. */
function stageDurations(events: PipelineEvent[]): Record<string, number> {
  const starts: Record<string, number> = {};
  const durations: Record<string, number> = {};
  for (const e of events) {
    if (e.event_type === 'stage_started') {
      starts[e.stage] = e.timestamp_ms;
    } else if (e.event_type === 'stage_completed' && starts[e.stage]) {
      durations[e.stage] = e.timestamp_ms - starts[e.stage];
    }
  }
  return durations;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PipelineProgress({ currentStage, currentRound, status, events }: Props) {
  const [showLog, setShowLog] = useState(false);

  const completedStages = new Set(
    events
      .filter(e => e.event_type === 'stage_completed')
      .map(e => e.stage)
  );
  const durations = stageDurations(events);

  return (
    <div>
      {/* Stage pipeline */}
      <div className="flex items-center gap-2 py-4 overflow-x-auto">
        {STAGES.map((stage, i) => {
          const isActive = stage === currentStage && status === 'running';
          const isCompleted = completedStages.has(stage);
          const isPending = !isActive && !isCompleted;
          const dur = durations[stage];

          return (
            <div key={stage} className="flex items-center">
              {i > 0 && (
                <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-300
                    ${isActive ? 'bg-blue-500 text-white ring-2 ring-blue-300 animate-pulse' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isPending ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {STAGE_LABELS[stage] || stage}
                  {stage !== 'scout' && currentRound > 1 && isActive ? ` R${currentRound}` : ''}
                </span>
                {dur !== undefined && (
                  <span className="text-[10px] text-gray-400 font-mono">{formatMs(dur)}</span>
                )}
              </div>
            </div>
          );
        })}

        {status === 'completed' && (
          <div className="ml-4 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            Done
          </div>
        )}
        {status === 'failed' && (
          <div className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
            Failed
          </div>
        )}
      </div>

      {/* Event log toggle */}
      {events.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowLog(!showLog)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showLog ? '▼ Hide' : '▶ Show'} event log ({events.length} events)
          </button>

          {showLog && (
            <div className="mt-2 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-2 space-y-1 text-xs font-mono">
              {events.map((e, i) => (
                <div key={i} className="flex gap-2 text-gray-600 dark:text-gray-400">
                  <span className="shrink-0 text-gray-400 w-12 text-right">
                    {e.round_num > 0 ? `R${e.round_num}` : '  '}
                  </span>
                  <span className={`shrink-0 w-20 ${
                    e.event_type.includes('completed') ? 'text-green-600 dark:text-green-400' :
                    e.event_type.includes('failed') ? 'text-red-600 dark:text-red-400' :
                    e.event_type.includes('human') ? 'text-orange-600 dark:text-orange-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {e.stage || '—'}
                  </span>
                  <span className="truncate">{e.event_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
