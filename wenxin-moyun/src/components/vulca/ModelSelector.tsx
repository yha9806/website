import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  organization?: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModels: string[];
  onModelSelect: (modelId: string) => void;
  maxSelection?: number;
  compact?: boolean;
}

// Compact dropdown version for horizontal layout
const CompactModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModels,
  onModelSelect,
  maxSelection = 5,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModelNames = models
    .filter(m => selectedModels.includes(m.id))
    .map(m => m.name);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[160px]"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
          {selectedModels.length === 0
            ? 'Select models'
            : `${selectedModels.length} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
          {/* Selected models preview */}
          {selectedModels.length > 0 && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-1">
                {selectedModelNames.slice(0, 3).map(name => (
                  <span key={name} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                    {name}
                  </span>
                ))}
                {selectedModelNames.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded-full">
                    +{selectedModelNames.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Model list */}
          <div className="p-2">
            {models.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              const isDisabled = !isSelected && selectedModels.length >= maxSelection;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => !isDisabled && onModelSelect(model.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors
                    ${isSelected ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                    ${isSelected
                      ? 'bg-slate-600 border-slate-600'
                      : 'border-gray-300 dark:border-gray-600'}`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {model.name}
                    </div>
                    {model.organization && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {model.organization}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedModels.length}/{maxSelection} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Standard list version for sidebar layout
const StandardModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModels,
  onModelSelect,
  maxSelection = 5,
}) => {
  return (
    <div className="space-y-2">
      {models.map((model) => {
        const isSelected = selectedModels.includes(model.id);
        const isDisabled = !isSelected && selectedModels.length >= maxSelection;

        return (
          <div
            key={model.id}
            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
              isSelected ? 'bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            } ${isDisabled ? 'opacity-50' : ''}`}
            data-model={model.name}
          >
            <input
              type="checkbox"
              id={`model-${model.id}`}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => onModelSelect(model.id)}
              className="h-4 w-4 text-slate-700 focus:ring-slate-600 border-gray-300 dark:border-gray-600 rounded"
            />
            <label
              htmlFor={`model-${model.id}`}
              className="flex-1 cursor-pointer select-none"
            >
              <span className="font-medium">{model.name}</span>
              {model.organization && (
                <span className="inline-block ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                  {model.organization}
                </span>
              )}
            </label>
          </div>
        );
      })}

      {selectedModels.length >= maxSelection && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Maximum {maxSelection} models can be selected
        </p>
      )}
    </div>
  );
};

export const ModelSelector: React.FC<ModelSelectorProps> = (props) => {
  if (props.compact) {
    return <CompactModelSelector {...props} />;
  }
  return <StandardModelSelector {...props} />;
};
