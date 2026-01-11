/**
 * useChartTheme - 图表主题 Hook
 * 自动检测深色/浅色模式并返回对应的图表配置
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getChartColors,
  getSeriesColors,
  getRechartsTheme,
  chartConfig,
  type ChartColors
} from '../config/chartTheme';

interface ChartThemeReturn {
  /** 是否深色模式 */
  isDark: boolean;
  /** 当前主题的图表颜色配置 */
  colors: ChartColors;
  /** 获取指定数量的系列颜色 */
  seriesColors: (count: number) => string[];
  /** Recharts 专用主题配置 */
  rechartsTheme: ReturnType<typeof getRechartsTheme>;
  /** 图表通用配置 */
  config: typeof chartConfig;
}

/**
 * 图表主题 Hook
 * 自动监听深色模式变化，返回对应的图表配置
 *
 * @example
 * ```tsx
 * const { isDark, colors, seriesColors, rechartsTheme } = useChartTheme();
 *
 * <RadarChart>
 *   <PolarGrid stroke={colors.grid.line} />
 *   <Tooltip contentStyle={rechartsTheme.tooltip.contentStyle} />
 *   {data.map((item, i) => (
 *     <Radar stroke={seriesColors(5)[i]} />
 *   ))}
 * </RadarChart>
 * ```
 */
export const useChartTheme = (): ChartThemeReturn => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      // 优先检查 HTML 元素的 dark class
      const hasDarkClass = document.documentElement.classList.contains('dark');
      // 其次检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(hasDarkClass || prefersDark);
    };

    // 初始检查
    checkDarkMode();

    // 监听 HTML class 变化 (用于手动切换主题)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // 缓存颜色配置
  const colors = useMemo(() => getChartColors(isDark), [isDark]);

  // 缓存 Recharts 主题
  const rechartsTheme = useMemo(() => getRechartsTheme(isDark), [isDark]);

  // 系列颜色获取函数
  const seriesColors = useCallback(
    (count: number) => getSeriesColors(count, isDark),
    [isDark]
  );

  return {
    isDark,
    colors,
    seriesColors,
    rechartsTheme,
    config: chartConfig,
  };
};

export default useChartTheme;
