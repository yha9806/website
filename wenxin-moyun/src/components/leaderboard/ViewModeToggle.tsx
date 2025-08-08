import { LayoutGrid, List, Layers } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { ViewMode } from '../../store/uiStore';

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useUIStore();

  const modes: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
    { value: 'card', icon: <LayoutGrid className="w-4 h-4" />, label: '卡片' },
    { value: 'compact', icon: <List className="w-4 h-4" />, label: '紧凑' },
    { value: 'detailed', icon: <Layers className="w-4 h-4" />, label: '详细' },
  ];

  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setViewMode(mode.value)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md transition-all
            ${viewMode === mode.value
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
          title={mode.label}
        >
          {mode.icon}
          <span className="hidden sm:inline text-sm font-medium">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}