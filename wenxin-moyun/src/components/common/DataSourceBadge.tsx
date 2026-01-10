import React from 'react';

export type DataSource = 'mock' | 'real' | 'benchmark';

interface DataSourceBadgeProps {
  source: DataSource;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

const dataSourceConfig = {
  mock: {
    label: 'Mock Data',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: '🎯',
    description: 'Simulated test data'
  },
  real: {
    label: 'Real Data', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '🔗',
    description: 'Live API data'
  },
  benchmark: {
    label: 'Verified',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
    icon: '✅',
    description: 'Benchmark tested'
  }
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    icon: 'text-xs'
  },
  md: {
    text: 'text-sm',
    padding: 'px-2.5 py-1.5',
    icon: 'text-sm'
  },
  lg: {
    text: 'text-base',
    padding: 'px-3 py-2',
    icon: 'text-base'
  }
};

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  size = 'sm',
  className = '',
  showIcon = true,
  showLabel = true
}) => {
  const config = dataSourceConfig[source];
  const sizeStyles = sizeConfig[size];
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${config.color}
        ${sizeStyles.text}
        ${sizeStyles.padding}
        ${className}
      `}
      title={config.description}
    >
      {showIcon && (
        <span className={sizeStyles.icon} role="img" aria-label={config.label}>
          {config.icon}
        </span>
      )}
      {showLabel && config.label}
    </span>
  );
};

export default DataSourceBadge;