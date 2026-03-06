/**
 * Playground header — status badge + title bar for the prototype page.
 */

import type { PipelineState } from '../../hooks/usePrototypePipeline';

interface Props {
  status: PipelineState['status'];
  taskId: string | null;
}

const STATUS_CONFIG: Record<PipelineState['status'], { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  running: { label: 'Running', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  waiting_human: { label: 'HITL', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  completed: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

export default function PlaygroundHeader({ status, taskId }: Props) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
          Playground
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Multi-agent cultural art pipeline
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
        {taskId && (
          <span className="text-[10px] font-mono text-gray-400 max-w-[80px] truncate" title={taskId}>
            {taskId.slice(0, 8)}
          </span>
        )}
      </div>
    </div>
  );
}
