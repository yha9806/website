/**
 * RPAITRadar Component
 *
 * Radar chart visualization for RPAIT scores using Recharts
 * Follows iOS design system with locked visual parameters
 */

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { RPAITScores, Critique, Persona } from '../../types/exhibition';
import { RPAIT_LABELS, RPAIT_COLORS } from '../../types/exhibition';

interface RPAITRadarProps {
  critiques: Critique[];
  personas: Persona[];
  selectedPersonas?: string[];
  size?: 'sm' | 'md' | 'lg';
}

const DIMENSION_ORDER: (keyof RPAITScores)[] = ['R', 'P', 'A', 'I', 'T'];

// LOCKED: Radar chart configuration (iOS Design System)
const RADAR_CONFIG = {
  outerRadius: '80%',
  domain: [0, 10] as [number, number],
  gridStroke: '#E5E5EA',
  gridStrokeWidth: 1,
  tickFontSize: 11,
  tickFill: '#8E8E93',
};

export function RPAITRadar({
  critiques,
  personas,
  selectedPersonas,
  size = 'md',
}: RPAITRadarProps) {
  // Transform critiques to radar data format
  const radarData = DIMENSION_ORDER.map((dimension) => {
    const entry: Record<string, string | number> = {
      dimension: RPAIT_LABELS[dimension].en,
      dimensionZh: RPAIT_LABELS[dimension].zh,
      fullMark: 10,
    };

    critiques.forEach((critique) => {
      if (!selectedPersonas || selectedPersonas.includes(critique.personaId)) {
        entry[critique.personaId] = critique.rpait[dimension];
      }
    });

    return entry;
  });

  // Get persona colors
  const getPersonaColor = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    return persona?.color || '#8E8E93';
  };

  // Filter active personas
  const activePersonas = personas.filter(
    (p) => !selectedPersonas || selectedPersonas.includes(p.id)
  );

  const height = size === 'sm' ? 200 : size === 'lg' ? 400 : 300;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} outerRadius={RADAR_CONFIG.outerRadius}>
          <PolarGrid
            stroke={RADAR_CONFIG.gridStroke}
            strokeWidth={RADAR_CONFIG.gridStrokeWidth}
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fontSize: RADAR_CONFIG.tickFontSize,
              fill: RADAR_CONFIG.tickFill,
              fontFamily: '-apple-system, SF Pro Display, sans-serif',
            }}
          />
          <PolarRadiusAxis
            domain={RADAR_CONFIG.domain}
            tick={{ fontSize: 10, fill: RADAR_CONFIG.tickFill }}
            tickCount={6}
          />

          {activePersonas.map((persona) => (
            <Radar
              key={persona.id}
              name={persona.nameEn}
              dataKey={persona.id}
              stroke={getPersonaColor(persona.id)}
              fill={getPersonaColor(persona.id)}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">
                    {payload[0]?.payload?.dimension}
                    <span className="ml-1 text-gray-500">
                      ({payload[0]?.payload?.dimensionZh})
                    </span>
                  </p>
                  {payload.map((entry) => (
                    <p
                      key={entry.dataKey}
                      className="text-sm"
                      style={{ color: entry.color }}
                    >
                      {entry.name}: <span className="font-bold">{entry.value}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />

          {activePersonas.length <= 4 && (
            <Legend
              wrapperStyle={{
                fontSize: 12,
                fontFamily: '-apple-system, SF Pro Display, sans-serif',
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Single persona radar for detail view
 */
export function SinglePersonaRadar({
  scores,
  color = '#007AFF',
  size = 'md',
}: {
  scores: RPAITScores;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const radarData = DIMENSION_ORDER.map((dimension) => ({
    dimension: RPAIT_LABELS[dimension].en,
    dimensionZh: RPAIT_LABELS[dimension].zh,
    score: scores[dimension],
    fullMark: 10,
  }));

  const height = size === 'sm' ? 150 : size === 'lg' ? 300 : 200;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} outerRadius={RADAR_CONFIG.outerRadius}>
          <PolarGrid
            stroke={RADAR_CONFIG.gridStroke}
            strokeWidth={RADAR_CONFIG.gridStrokeWidth}
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fontSize: size === 'sm' ? 9 : RADAR_CONFIG.tickFontSize,
              fill: RADAR_CONFIG.tickFill,
              fontFamily: '-apple-system, SF Pro Display, sans-serif',
            }}
          />
          <PolarRadiusAxis
            domain={RADAR_CONFIG.domain}
            tick={{ fontSize: 9, fill: RADAR_CONFIG.tickFill }}
            tickCount={6}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RPAITRadar;
