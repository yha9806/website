import { LayoutGrid, List, Layers, Table } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { ViewMode } from '../../store/uiStore';
import { IOSButton } from '../ios';

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useUIStore();

  const modes: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
    { value: 'table', icon: <Table className="w-4 h-4" />, label: 'Table' },
    { value: 'card', icon: <LayoutGrid className="w-4 h-4" />, label: 'Card' },
    { value: 'compact', icon: <List className="w-4 h-4" />, label: 'Compact' },
    { value: 'detailed', icon: <Layers className="w-4 h-4" />, label: 'Detailed' },
  ];

  return (
    <div className="flex items-center ios-glass rounded-xl p-1 gap-1">
      {modes.map((mode) => (
        <IOSButton
          key={mode.value}
          onClick={() => setViewMode(mode.value)}
          variant={viewMode === mode.value ? 'primary' : 'secondary'}
          size="sm"
          glassMorphism={viewMode !== mode.value}
          className="transition-all duration-200"
          title={mode.label}
        >
          {mode.icon}
          <span className="hidden sm:inline text-sm font-medium ml-2">{mode.label}</span>
        </IOSButton>
      ))}
    </div>
  );
}