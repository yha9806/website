import React from 'react';

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
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
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
              isSelected ? 'bg-primary/10' : 'hover:bg-gray-50'
            } ${isDisabled ? 'opacity-50' : ''}`}
            data-model={model.name}
          >
            <input
              type="checkbox"
              id={`model-${model.id}`}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => onModelSelect(model.id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`model-${model.id}`}
              className="flex-1 cursor-pointer select-none"
            >
              <span className="font-medium">{model.name}</span>
              {model.organization && (
                <span className="inline-block ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {model.organization}
                </span>
              )}
            </label>
          </div>
        );
      })}
      
      {selectedModels.length >= maxSelection && (
        <p className="text-xs text-gray-500 mt-2">
          Maximum {maxSelection} models can be selected
        </p>
      )}
    </div>
  );
};