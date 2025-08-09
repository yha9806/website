import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterTagProps {
  label: string;
  value: string | number | string[];
  onRemove: () => void;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

export default function FilterTag({
  label,
  value,
  onRemove,
  color = 'blue'
}: FilterTagProps) {
  const formatValue = () => {
    if (Array.isArray(value)) {
      if (value.length === 0) return '无';
      if (value.length === 1) return value[0];
      return `${value.length} 项`;
    }
    return String(value);
  };

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm
        border ${colorClasses[color]} transition-all cursor-default
      `}
    >
      <span className="font-medium">{label}:</span>
      <span className="font-normal">{formatValue()}</span>
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 hover:bg-black/10 dark:hover:bg-neutral-50/10 rounded-full transition-colors"
        aria-label={`移除${label}筛选`}
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

interface FilterTagGroupProps {
  tags: Array<{
    id: string;
    label: string;
    value: string | number | string[];
    color?: FilterTagProps['color'];
  }>;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function FilterTagGroup({
  tags,
  onRemove,
  onClearAll,
  className = ''
}: FilterTagGroupProps) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        活动筛选:
      </span>
      {tags.map((tag) => (
        <FilterTag
          key={tag.id}
          label={tag.label}
          value={tag.value}
          color={tag.color}
          onRemove={() => onRemove(tag.id)}
        />
      ))}
      {tags.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors"
        >
          清除全部
        </button>
      )}
    </div>
  );
}