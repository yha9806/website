/**
 * useAutoChartType - Automatically selects the optimal chart type based on data characteristics
 *
 * Chart selection logic:
 * - 6D mode: Always use radar chart (6 dimensions fit well)
 * - 47D grouped: Use dimension group cards (DimensionGroupView)
 * - 47D detailed with many dimensions (>12): Use bar chart for readability
 * - 47D detailed with few dimensions (<=12): Use radar or parallel coordinates
 * - Multiple models comparison: Prefer bar chart for side-by-side comparison
 */

import { useMemo } from 'react';
import type { ViewMode, ViewLevel, VisualizationType } from '../../types/vulca';

interface AutoChartTypeOptions {
  viewMode: ViewMode;
  viewLevel: ViewLevel;
  modelCount: number;
  dimensionCount: number;
}

interface AutoChartResult {
  chartType: VisualizationType;
  reason: string;
  isGroupedView: boolean;
}

export const useAutoChartType = ({
  viewMode,
  viewLevel,
  modelCount,
  dimensionCount,
}: AutoChartTypeOptions): AutoChartResult => {
  return useMemo(() => {
    // 6D Overview mode - always radar
    if (viewMode === '6d') {
      return {
        chartType: 'radar' as VisualizationType,
        reason: 'Radar chart is optimal for 6 dimensions overview',
        isGroupedView: false,
      };
    }

    // 47D Grouped view - use dimension group cards
    if (viewMode === '47d' && viewLevel === 'grouped') {
      return {
        chartType: 'bar' as VisualizationType, // Fallback type, actual render uses DimensionGroupView
        reason: 'Grouped view shows 8 category cards with expandable details',
        isGroupedView: true,
      };
    }

    // 47D Detailed view
    if (viewMode === '47d' && viewLevel === 'detailed') {
      // Many dimensions - use bar chart for readability
      if (dimensionCount > 12) {
        return {
          chartType: 'bar' as VisualizationType,
          reason: `Bar chart is clearer for ${dimensionCount} dimensions`,
          isGroupedView: false,
        };
      }

      // Multiple models - parallel coordinates for comparison
      if (modelCount >= 3) {
        return {
          chartType: 'parallel' as VisualizationType,
          reason: 'Parallel coordinates shows multi-model differences clearly',
          isGroupedView: false,
        };
      }

      // Few dimensions, 1-2 models - radar works well
      return {
        chartType: 'radar' as VisualizationType,
        reason: 'Radar chart for detailed view with limited dimensions',
        isGroupedView: false,
      };
    }

    // Default fallback - bar chart is always readable
    return {
      chartType: 'bar' as VisualizationType,
      reason: 'Default bar chart for general visualization',
      isGroupedView: false,
    };
  }, [viewMode, viewLevel, modelCount, dimensionCount]);
};

export default useAutoChartType;
