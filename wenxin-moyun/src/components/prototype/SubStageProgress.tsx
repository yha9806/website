/**
 * Timeline showing sub-stage progress within a pipeline stage.
 *
 * Displays each sub-step with a status icon and optional duration.
 * Uses Art Professional color palette.
 */

export interface SubStage {
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs?: number;
}

interface Props {
  stages: SubStage[];
  recipeName?: string;
}

const STATUS_CONFIG: Record<SubStage['status'], { icon: string; className: string }> = {
  completed: { icon: '\u2713', className: 'text-[#5F8A50]' },
  running:   { icon: '\u25CC', className: 'text-[#C87F4A] animate-pulse' },
  pending:   { icon: '\u25CB', className: 'text-gray-400' },
  failed:    { icon: '\u2715', className: 'text-[#C65D4D]' },
  skipped:   { icon: '\u2013', className: 'text-gray-300' },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SubStageProgress({ stages, recipeName }: Props) {
  if (stages.length === 0) return null;

  return (
    <div className="bg-[#FAF7F2] dark:bg-gray-800/40 border-l-2 border-[#C87F4A] pl-4 py-3 rounded-r-lg">
      {recipeName && (
        <p className="text-xs font-medium text-[#C87F4A] dark:text-[#DDA574] mb-2">
          {recipeName}
        </p>
      )}
      <div className="space-y-1">
        {stages.map((s) => {
          const cfg = STATUS_CONFIG[s.status];
          return (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className={`w-4 text-center font-mono ${cfg.className}`}>
                {cfg.icon}
              </span>
              <span className={`flex-1 ${s.status === 'skipped' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {s.displayName}
              </span>
              {s.durationMs != null && (
                <span className="font-mono text-gray-400 dark:text-gray-500">
                  {formatDuration(s.durationMs)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
