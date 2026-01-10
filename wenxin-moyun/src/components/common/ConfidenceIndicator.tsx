import React from 'react';

export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-1 scale
  level?: ConfidenceLevel;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  if (confidence >= 0.3) return 'low';
  return 'very_low';
};

const confidenceConfig = {
  very_low: {
    label: 'Very Low',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    progressColor: 'bg-red-500',
    icon: '⚠️',
    description: 'Low confidence in accuracy'
  },
  low: {
    label: 'Low',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    progressColor: 'bg-orange-500', 
    icon: '🟡',
    description: 'Limited data available'
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    progressColor: 'bg-yellow-500',
    icon: '🟠',
    description: 'Moderate confidence'
  },
  high: {
    label: 'High',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    progressColor: 'bg-green-500',
    icon: '🟢',
    description: 'High confidence in accuracy'
  }
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    icon: 'text-xs',
    progress: 'h-1'
  },
  md: {
    text: 'text-sm', 
    padding: 'px-2.5 py-1.5',
    icon: 'text-sm',
    progress: 'h-2'
  },
  lg: {
    text: 'text-base',
    padding: 'px-3 py-2', 
    icon: 'text-base',
    progress: 'h-3'
  }
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  level,
  size = 'sm',
  showPercentage = false,
  showLabel = true,
  showIcon = true,
  className = ''
}) => {
  const confidenceLevel = level || getConfidenceLevel(confidence);
  const config = confidenceConfig[confidenceLevel];
  const sizeStyles = sizeConfig[size];
  const percentage = Math.round(confidence * 100);
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Badge */}
      <span
        className={`
          inline-flex items-center gap-1 font-medium rounded-full
          ${config.color}
          ${sizeStyles.text}
          ${sizeStyles.padding}
        `}
        title={`${config.description} (${percentage}%)`}
      >
        {showIcon && (
          <span className={sizeStyles.icon} role="img" aria-label={config.label}>
            {config.icon}
          </span>
        )}
        {showLabel && config.label}
        {showPercentage && ` ${percentage}%`}
      </span>
      
      {/* Progress bar */}
      {size !== 'sm' && (
        <div className={`w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeStyles.progress}`}>
          <div
            className={`${config.progressColor} ${sizeStyles.progress} transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ConfidenceIndicator;