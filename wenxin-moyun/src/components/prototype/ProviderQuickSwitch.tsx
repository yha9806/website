/**
 * Provider Quick Switch — dynamically fetches available providers from the
 * backend /capabilities endpoint and renders a segmented control.
 *
 * Falls back to hardcoded Mock + NB2 if the fetch fails.
 */

import { useState, useEffect } from 'react';
import { IOSSegmentedControl } from '../ios';
import type { SegmentItem } from '../ios';
import { API_PREFIX } from '@/config/api';

interface ProviderInfo {
  id: string;
  label: string;
  cost: number;
  available: boolean;
}

const FALLBACK_PROVIDERS: ProviderInfo[] = [
  { id: 'mock', label: 'Mock', cost: 0, available: true },
  { id: 'nb2', label: 'NB2', cost: 0.067, available: true },
];

interface ProviderQuickSwitchProps {
  value: string;
  onChange: (provider: string) => void;
  disabled?: boolean;
  /** Number of candidates — used for cost estimate. */
  nCandidates?: number;
}

export default function ProviderQuickSwitch({
  value,
  onChange,
  disabled = false,
  nCandidates = 4,
}: ProviderQuickSwitchProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>(FALLBACK_PROVIDERS);

  useEffect(() => {
    fetch(`${API_PREFIX}/prototype/capabilities`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.providers?.length) {
          setProviders(data.providers.filter((p: ProviderInfo) => p.available));
        }
      })
      .catch(() => {});  // Keep fallback on error
  }, []);

  const segments: SegmentItem[] = providers.map(p => ({
    id: p.id,
    label: p.label,
    value: p.id,
  }));

  const selectedIndex = Math.max(0, providers.findIndex(p => p.id === value));
  const selected = providers[selectedIndex];
  const estimatedCost = selected ? selected.cost * nCandidates : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Provider</span>
        {selected && selected.cost > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            ~${estimatedCost.toFixed(3)}/run ({nCandidates} images)
          </span>
        )}
      </div>
      <IOSSegmentedControl
        segments={segments}
        selectedIndex={selectedIndex}
        onChange={(idx) => {
          const p = providers[idx];
          if (p) onChange(p.id);
        }}
        size="compact"
        disabled={disabled}
      />
      <div className="flex items-center gap-1.5 px-1">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: selected?.cost === 0 ? '#5F8A50' : '#B8923D' }}
        />
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {selected?.cost === 0 ? 'Free, instant' : `$${selected?.cost}/image`}
        </span>
      </div>
    </div>
  );
}
