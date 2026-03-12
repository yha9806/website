/**
 * ArchetypePerformanceChart — horizontal bar chart of prompt archetypes.
 *
 * Displays the top-10 archetypes (count >= 3) sorted by count descending.
 * Each bar shows the count; a percentage label at the bar end shows avg_score.
 * Small tradition dots below each bar visualise tradition distribution.
 * Custom tooltip shows pattern, count, avg_score%, traditions, 1 example prompt.
 *
 * Data source: digestionStatus.prompt_contexts.archetypes (from /api/v1/digestion/status)
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { IOSCard, IOSCardHeader, IOSCardContent } from '../ios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArchetypeRaw {
  pattern: string;
  avg_score: number;
  count: number;
  traditions: string[];
  example_prompts?: string[];
  insights?: string;
}

export interface ArchetypePerformanceChartProps {
  archetypes: ArchetypeRaw[];
}

// ---------------------------------------------------------------------------
// Palette (Art Professional — no blue/purple/indigo/violet)
// ---------------------------------------------------------------------------

const BAR_COLOR = '#C87F4A';   // accent bronze
const BAR_HOVER = '#B8923D';   // amber on hover

const TRADITION_COLORS: Record<string, string> = {
  chinese_xieyi:         '#C87F4A',
  chinese_gongbi:        '#9B6B56',
  japanese_traditional:  '#5F8A50',
  islamic_geometric:     '#B8923D',
  western_academic:      '#64748B',
  african_traditional:   '#C65D4D',
  south_asian:           '#8F7860',
  watercolor:            '#4A7A46',
  default:               '#334155',
};

const traditionColor = (t: string): string =>
  TRADITION_COLORS[t] ?? TRADITION_COLORS.default;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const humanTradition = (t: string): string =>
  t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  payload: {
    pattern: string;
    count: number;
    avgScorePct: number;
    traditions: string[];
    examplePrompt: string;
  };
}

function CustomTooltip(props: TooltipProps<ValueType, NameType>) {
  const { active } = props;
  const tooltipPayload = (props as Record<string, unknown>).payload as TooltipPayloadEntry[] | undefined;
  if (!active || !tooltipPayload || tooltipPayload.length === 0) return null;
  const d = tooltipPayload[0].payload;
  return (
    <div className="rounded-lg px-4 py-3 shadow-lg border text-sm max-w-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">
        {capitalize(d.pattern)}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Count: <span className="font-medium text-gray-900 dark:text-white">{d.count}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Avg score: <span className="font-medium text-[#C87F4A]">{d.avgScorePct}%</span>
      </p>
      {d.traditions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {d.traditions.map(t => (
            <span
              key={t}
              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${traditionColor(t)}20`, color: traditionColor(t) }}
            >
              {humanTradition(t)}
            </span>
          ))}
        </div>
      )}
      {d.examplePrompt && (
        <p className="mt-1.5 text-[11px] italic text-gray-500 dark:text-gray-400 line-clamp-2">
          &ldquo;{d.examplePrompt}&rdquo;
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ArchetypePerformanceChart({ archetypes }: ArchetypePerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!Array.isArray(archetypes) || archetypes.length === 0) return [];

    return archetypes
      .filter(a => a.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(a => ({
        pattern: capitalize(a.pattern),
        count: a.count,
        avgScorePct: Math.round(a.avg_score * 100),
        traditions: a.traditions ?? [],
        examplePrompt: a.example_prompts?.[0] ?? '',
      }));
  }, [archetypes]);

  if (chartData.length === 0) {
    return (
      <IOSCard variant="elevated" padding="lg">
        <IOSCardHeader
          title="Prompt Archetypes"
          subtitle="Top prompt patterns from high-scoring sessions"
        />
        <IOSCardContent>
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            Not enough archetype data yet (need patterns with count &ge; 3).
          </div>
        </IOSCardContent>
      </IOSCard>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 44 + 40);

  return (
    <IOSCard variant="elevated" padding="lg">
      <IOSCardHeader
        title="Prompt Archetypes"
        subtitle="Top prompt patterns from high-scoring sessions"
      />
      <IOSCardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 60, bottom: 4, left: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-gray-200, #E5E7EB)"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              tick={{ fill: '#636366', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="pattern"
              tick={{ fill: '#334155', fontSize: 13, fontWeight: 500 }}
              width={120}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(200,127,74,0.08)' }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              barSize={24}
              animationDuration={600}
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={idx === 0 ? BAR_HOVER : BAR_COLOR} />
              ))}
              <LabelList
                dataKey="avgScorePct"
                position="right"
                formatter={(v: unknown) => `${v}%`}
                style={{ fill: '#B8923D', fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tradition dots legend */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap gap-3">
            {Object.entries(TRADITION_COLORS)
              .filter(([key]) => key !== 'default')
              .filter(([key]) =>
                chartData.some(d => d.traditions.includes(key)),
              )
              .map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {humanTradition(key)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </IOSCardContent>
    </IOSCard>
  );
}
