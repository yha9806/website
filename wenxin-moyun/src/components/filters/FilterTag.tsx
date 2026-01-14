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
      if (value.length === 0) return 'None';
      if (value.length === 1) return value[0];
      return `${value.length} items`;
    }
    return String(value);
  };

  const colorClasses = {
    blue: 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    red: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    purple: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700',
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
        className="ml-1 min-h-[44px] min-w-[44px] -my-2 flex items-center justify-center hover:bg-black/10 dark:hover:bg-neutral-50/10 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-4 h-4" />
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
        Active Filters:
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
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:rounded underline transition-colors"
        >
          Clear All
        </button>
      )}
    </div>
  );
}