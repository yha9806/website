import React, { useState, useEffect } from 'react';
import { IOSRangeSlider, IOSCard, IOSCardHeader, IOSCardContent, EmojiIcon } from '../ios';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  unit?: string;
  showValues?: boolean;
}

export default function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  showValues = true
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (newValue: [number, number]) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <IOSCard variant="glass" padding="lg">
      <IOSCardHeader
        title={label}
        emoji={<EmojiIcon category="actions" name="edit" size="md" />}
        action={
          showValues && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {localValue[0]}{unit} - {localValue[1]}{unit}
            </span>
          )
        }
      />
      <IOSCardContent>
        <div className="space-y-6">
          <IOSRangeSlider
            value={localValue}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            color="primary"
            size="md"
            showValues={true}
            unit={unit}
            formatValue={(v) => v.toString()}
          />
          
          {/* Range marks */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{min}{unit}</span>
            <span>{Math.round((min + max) / 2)}{unit}</span>
            <span>{max}{unit}</span>
          </div>

          {/* Numeric inputs */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor="range-min" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Min Value
              </label>
              <input
                id="range-min"
                type="number"
                min={min}
                max={localValue[1]}
                step={step}
                value={localValue[0]}
                onChange={(e) => {
                  const newMin = Number(e.target.value);
                  if (newMin >= min && newMin <= localValue[1]) {
                    const newValue: [number, number] = [newMin, localValue[1]];
                    handleSliderChange(newValue);
                  }
                }}
                className="w-full px-3 py-2 text-sm ios-glass border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600/40 focus:border-slate-600 dark:focus:border-slate-500 transition-colors"
              />
            </div>
            <div className="text-gray-400 text-sm font-medium pt-5">to</div>
            <div className="flex-1">
              <label htmlFor="range-max" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Max Value
              </label>
              <input
                id="range-max"
                type="number"
                min={localValue[0]}
                max={max}
                step={step}
                value={localValue[1]}
                onChange={(e) => {
                  const newMax = Number(e.target.value);
                  if (newMax <= max && newMax >= localValue[0]) {
                    const newValue: [number, number] = [localValue[0], newMax];
                    handleSliderChange(newValue);
                  }
                }}
                className="w-full px-3 py-2 text-sm ios-glass border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600/40 focus:border-slate-600 dark:focus:border-slate-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </IOSCardContent>
    </IOSCard>
  );
}

