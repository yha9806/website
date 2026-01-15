/**
 * Art Professional Chart Theme
 * 温暖、专业、艺术品味的图表配色
 * 支持深色/浅色模式自动切换
 */

import { ORGANIZATION_COLORS, getOrganizationColor, DEFAULT_ORG_COLOR } from '../constants/organizationColors';

// ============= Art Professional 色彩系统 =============

export const iosSystemColors = {
  // 主色调 - 暖色系艺术风格
  bronze: '#C87F4A',      // 暖铜棕 - 主色
  terracotta: '#9B6B56',  // 陶土色 - 次要强调
  sage: '#5F8A50',        // 鼠尾草绿
  amber: '#B8923D',       // 琥珀黄
  slate: '#64748B',       // 墨石灰
  coral: '#B35A50',       // 珊瑚红
  ochre: '#8F7860',       // 赭石色
  olive: '#4A7A46',       // 橄榄绿
  // 兼容旧代码
  blue: '#64748B',        // 映射到墨石灰
  green: '#5F8A50',
  orange: '#C87F4A',
  red: '#B35A50',
  purple: '#9B6B56',
  teal: '#4A7A46',
  indigo: '#64748B',
  pink: '#B35A50',
  yellow: '#B8923D',
};

// 深色模式系统色 (更亮的暖色版本)
export const iosDarkSystemColors = {
  bronze: '#DDA574',      // 暖铜棕亮
  terracotta: '#C49976',  // 陶土色亮
  sage: '#87A878',        // 鼠尾草绿亮
  amber: '#D4A84B',       // 琥珀黄亮
  slate: '#94A3B8',       // 墨石灰亮
  coral: '#C97064',       // 珊瑚红亮
  ochre: '#B8A089',       // 赭石色亮
  olive: '#7A9B76',       // 橄榄绿亮
  // 兼容旧代码
  blue: '#94A3B8',
  green: '#87A878',
  orange: '#DDA574',
  red: '#C97064',
  purple: '#C49976',
  teal: '#7A9B76',
  indigo: '#94A3B8',
  pink: '#C97064',
  yellow: '#D4A84B',
};

// ============= 浅色模式图表配置 =============

export const chartColorsLight = {
  // Art Professional 颜色序列
  primary: [
    iosSystemColors.bronze,      // #C87F4A 暖铜棕
    iosSystemColors.terracotta,  // #9B6B56 陶土色
    iosSystemColors.sage,        // #5F8A50 鼠尾草绿
    iosSystemColors.amber,       // #B8923D 琥珀黄
    iosSystemColors.slate,       // #64748B 墨石灰
    iosSystemColors.coral,       // #B35A50 珊瑚红
    iosSystemColors.ochre,       // #8F7860 赭石色
    iosSystemColors.olive,       // #4A7A46 橄榄绿
  ],

  // 渐变色配置 - 暖色调渐变
  gradients: {
    primaryToSuccess: [iosSystemColors.slate, iosSystemColors.sage],
    primaryToAccent: [iosSystemColors.slate, iosSystemColors.bronze],
    successToWarning: [iosSystemColors.sage, iosSystemColors.amber],
    purpleToBlue: [iosSystemColors.terracotta, iosSystemColors.slate],
  },

  // 语义色 - Art Professional 风格
  semantic: {
    success: '#5F8A50',       // 鼠尾草绿
    warning: '#B8923D',       // 琥珀黄
    error: '#B35A50',         // 珊瑚红
    info: '#64748B',          // 墨石灰
    neutral: '#7A726A',       // 暖灰
  },

  // 网格和轴线颜色 - WCAG AA 对比度优化
  grid: {
    line: '#999999',        // 对比度 3.5:1 (原 #E5E5EA 1.14:1)
    text: '#636366',        // iOS Gray 600 - 5.34:1 ✓
    subText: '#707070',     // 对比度 4.5:1 (原 #8E8E93 3.01:1)
    axis: '#808080',        // 对比度 4.0:1 (原 #C7C7CC 1.53:1)
  },

  // 背景色
  background: {
    card: '#FFFFFF',
    hover: '#F2F2F7',       // iOS Gray 50
    disabled: '#E5E5EA',    // iOS Gray 100
    tooltip: 'rgba(0, 0, 0, 0.85)',
  },

  // 工具提示
  tooltip: {
    background: 'rgba(0, 0, 0, 0.85)',
    text: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.1)',
  },
};

// ============= 深色模式图表配置 =============

export const chartColorsDark = {
  // Art Professional 深色模式颜色序列
  primary: [
    iosDarkSystemColors.bronze,      // #DDA574 暖铜棕亮
    iosDarkSystemColors.terracotta,  // #C49976 陶土色亮
    iosDarkSystemColors.sage,        // #87A878 鼠尾草绿亮
    iosDarkSystemColors.amber,       // #D4A84B 琥珀黄亮
    iosDarkSystemColors.slate,       // #94A3B8 墨石灰亮
    iosDarkSystemColors.coral,       // #C97064 珊瑚红亮
    iosDarkSystemColors.ochre,       // #B8A089 赭石色亮
    iosDarkSystemColors.olive,       // #7A9B76 橄榄绿亮
  ],

  // 渐变色配置 - 暖色调渐变
  gradients: {
    primaryToSuccess: [iosDarkSystemColors.slate, iosDarkSystemColors.sage],
    primaryToAccent: [iosDarkSystemColors.slate, iosDarkSystemColors.bronze],
    successToWarning: [iosDarkSystemColors.sage, iosDarkSystemColors.amber],
    purpleToBlue: [iosDarkSystemColors.terracotta, iosDarkSystemColors.slate],
  },

  // 语义色 - Art Professional 深色模式
  semantic: {
    success: iosDarkSystemColors.sage,
    warning: iosDarkSystemColors.amber,
    error: iosDarkSystemColors.coral,
    info: iosDarkSystemColors.slate,
    neutral: '#A89E94',
  },

  // 网格和轴线颜色 - WCAG AA 对比度优化
  grid: {
    line: '#555555',        // 对比度 3.0:1 (原 #3A3A3C 1.11:1)
    text: '#AEAEB2',        // iOS Gray 400 - 9.04:1 ✓
    subText: '#8E8E93',     // iOS Gray 500 - 5.0:1 ✓
    axis: '#666666',        // 对比度 3.5:1 (原 #48484A 1.5:1)
  },

  // 背景色
  background: {
    card: '#1C1C1E',        // iOS Dark Gray 900
    hover: '#2C2C2E',       // iOS Gray 900
    disabled: '#3A3A3C',    // iOS Dark Gray 800
    tooltip: 'rgba(255, 255, 255, 0.9)',
  },

  // 工具提示
  tooltip: {
    background: 'rgba(255, 255, 255, 0.9)',
    text: '#000000',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

// ============= 组织机构品牌色映射 =============
// Re-export from centralized constants for backward compatibility
export const organizationColors = ORGANIZATION_COLORS;

// ============= VULCA 维度类别色 - Art Professional =============

export const vulcaCategoryColors = {
  creativity: {
    light: iosSystemColors.bronze,      // 暖铜棕 - 创造力
    dark: iosDarkSystemColors.bronze,
  },
  technical: {
    light: iosSystemColors.sage,        // 鼠尾草绿 - 技术
    dark: iosDarkSystemColors.sage,
  },
  emotional: {
    light: iosSystemColors.coral,       // 珊瑚红 - 情感
    dark: iosDarkSystemColors.coral,
  },
  contextual: {
    light: iosSystemColors.slate,       // 墨石灰 - 语境
    dark: iosDarkSystemColors.slate,
  },
  innovation: {
    light: iosSystemColors.amber,       // 琥珀黄 - 创新
    dark: iosDarkSystemColors.amber,
  },
  impact: {
    light: iosSystemColors.terracotta,  // 陶土色 - 影响
    dark: iosDarkSystemColors.terracotta,
  },
};

// ============= 图表通用配置 =============

export const chartConfig = {
  // 字体配置 - iOS 系统字体
  font: {
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    sizes: {
      title: 17,      // iOS Body
      label: 15,      // iOS Subheadline
      tick: 13,       // iOS Footnote
      legend: 13,     // iOS Footnote
      tooltip: 14,
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // 动画配置 - iOS 风格
  animation: {
    duration: 300,
    easing: 'ease-out',
    spring: {
      stiffness: 400,
      damping: 30,
    },
  },

  // 边距配置
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // 圆角配置 - iOS 风格
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
  },
};

// ============= 工具函数 =============

/**
 * 获取当前主题的图表颜色
 */
export const getChartColors = (isDark: boolean = false) => {
  return isDark ? chartColorsDark : chartColorsLight;
};

/**
 * 获取数据系列颜色
 */
export const getSeriesColors = (count: number, isDark: boolean = false): string[] => {
  const colors = isDark ? chartColorsDark.primary : chartColorsLight.primary;

  if (count <= colors.length) {
    return colors.slice(0, count);
  }

  // 如果需要更多颜色，循环使用并调整透明度
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const baseColor = colors[i % colors.length];
    const opacity = i < colors.length ? 1 : 0.7;
    result.push(opacity === 1 ? baseColor : `${baseColor}B3`);
  }
  return result;
};

/**
 * 获取组织机构颜色
 * Uses centralized organizationColors from constants
 */
export const getOrgColor = (orgName: string): string => {
  return getOrganizationColor(orgName);
};

/**
 * 获取 VULCA 维度类别颜色
 */
export const getVulcaCategoryColor = (
  category: keyof typeof vulcaCategoryColors,
  isDark: boolean = false
): string => {
  const colors = vulcaCategoryColors[category];
  return colors ? (isDark ? colors.dark : colors.light) : chartColorsLight.primary[0];
};

/**
 * 获取渐变色 CSS
 */
export const getGradientCSS = (
  gradientKey: keyof typeof chartColorsLight.gradients,
  isDark: boolean = false,
  angle: number = 135
): string => {
  const gradients = isDark ? chartColorsDark.gradients : chartColorsLight.gradients;
  const [start, end] = gradients[gradientKey];
  return `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`;
};

/**
 * Recharts 专用配置生成器
 */
export const getRechartsTheme = (isDark: boolean = false) => {
  const colors = getChartColors(isDark);

  return {
    // 轴线配置
    axis: {
      stroke: colors.grid.axis,
      tick: {
        fill: colors.grid.text,
        fontSize: chartConfig.font.sizes.tick,
        fontFamily: chartConfig.font.family,
      },
    },

    // 网格配置
    cartesianGrid: {
      stroke: colors.grid.line,
      strokeDasharray: '3 3',
      strokeOpacity: isDark ? 0.3 : 0.5,
    },

    // 工具提示配置
    tooltip: {
      contentStyle: {
        backgroundColor: colors.tooltip.background,
        border: `1px solid ${colors.tooltip.border}`,
        borderRadius: chartConfig.borderRadius.md,
        padding: '12px 16px',
        boxShadow: isDark
          ? '0 10px 40px rgba(0,0,0,0.4)'
          : '0 10px 40px rgba(0,0,0,0.15)',
      },
      labelStyle: {
        color: colors.tooltip.text,
        fontWeight: chartConfig.font.weights.semibold,
        marginBottom: 8,
      },
      itemStyle: {
        color: colors.tooltip.text,
        fontSize: chartConfig.font.sizes.tooltip,
      },
    },

    // 图例配置
    legend: {
      wrapperStyle: {
        paddingTop: '20px',
        fontFamily: chartConfig.font.family,
        fontSize: chartConfig.font.sizes.legend,
      },
    },

    // 雷达图配置
    radar: {
      polarGrid: {
        stroke: colors.grid.line,
        strokeOpacity: isDark ? 0.3 : 0.5,
      },
      polarAngleAxis: {
        tick: {
          fill: colors.grid.text,
          fontSize: 11,
        },
      },
      polarRadiusAxis: {
        tick: {
          fill: colors.grid.subText,
          fontSize: 10,
        },
        axisLine: {
          stroke: colors.grid.line,
        },
      },
    },
  };
};

// ============= 向后兼容导出 =============

export const chartColors = chartColorsLight;

// 类型导出
export type ChartColors = typeof chartColorsLight;
export type OrganizationColorKey = keyof typeof organizationColors;
export type VulcaCategoryKey = keyof typeof vulcaCategoryColors;
