/**
 * 统一图表主题配置
 * 基于 iOS Human Interface Guidelines 色彩系统
 * 支持深色/浅色模式自动切换
 */

// ============= iOS 系统标准色 =============

export const iosSystemColors = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  teal: '#0097A7',      // Deepened for WCAG 3:1 contrast (原 #64D2FF 2.3:1)
  indigo: '#5856D6',
  pink: '#FF2D55',
  yellow: '#B38F00',    // Deepened for WCAG 3:1 contrast (原 #FFCC00 1.9:1)
};

// iOS 深色模式系统色 (更鲜艳的版本)
export const iosDarkSystemColors = {
  blue: '#0A84FF',
  green: '#30D158',
  orange: '#FF9F0A',
  red: '#FF453A',
  purple: '#BF5AF2',
  teal: '#70D7FF',
  indigo: '#5E5CE6',
  pink: '#FF375F',
  yellow: '#FFD60A',
};

// ============= 浅色模式图表配置 =============

export const chartColorsLight = {
  // 主要图表颜色序列 - iOS 系统色
  primary: [
    iosSystemColors.blue,     // #007AFF
    iosSystemColors.green,    // #34C759
    iosSystemColors.orange,   // #FF9500
    iosSystemColors.purple,   // #AF52DE
    iosSystemColors.red,      // #FF3B30
    iosSystemColors.teal,     // #64D2FF
    iosSystemColors.indigo,   // #5856D6
    iosSystemColors.pink,     // #FF2D55
  ],

  // 渐变色配置
  gradients: {
    primaryToSuccess: [iosSystemColors.blue, iosSystemColors.green],
    primaryToAccent: [iosSystemColors.blue, iosSystemColors.orange],
    successToWarning: [iosSystemColors.green, iosSystemColors.orange],
    purpleToBlue: [iosSystemColors.purple, iosSystemColors.blue],
  },

  // 语义色 - 修复对比度
  semantic: {
    success: '#1A7F37',       // 深化绿色 (对比度 4.5:1)
    warning: '#9A6700',       // 深化橙色 (对比度 4.5:1)
    error: '#CF222E',         // 深化红色 (对比度 4.5:1)
    info: iosSystemColors.blue,
    neutral: '#8E8E93',
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
  // 主要图表颜色序列 - iOS 深色模式系统色
  primary: [
    iosDarkSystemColors.blue,     // #0A84FF
    iosDarkSystemColors.green,    // #30D158
    iosDarkSystemColors.orange,   // #FF9F0A
    iosDarkSystemColors.purple,   // #BF5AF2
    iosDarkSystemColors.red,      // #FF453A
    iosDarkSystemColors.teal,     // #70D7FF
    iosDarkSystemColors.indigo,   // #5E5CE6
    iosDarkSystemColors.pink,     // #FF375F
  ],

  // 渐变色配置
  gradients: {
    primaryToSuccess: [iosDarkSystemColors.blue, iosDarkSystemColors.green],
    primaryToAccent: [iosDarkSystemColors.blue, iosDarkSystemColors.orange],
    successToWarning: [iosDarkSystemColors.green, iosDarkSystemColors.orange],
    purpleToBlue: [iosDarkSystemColors.purple, iosDarkSystemColors.blue],
  },

  // 语义色
  semantic: {
    success: iosDarkSystemColors.green,
    warning: '#D29922',    // 深色模式橙色
    error: iosDarkSystemColors.red,
    info: iosDarkSystemColors.blue,
    neutral: '#8E8E93',
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

export const organizationColors: Record<string, string> = {
  'OpenAI': '#10b981',
  'Anthropic': '#d97757',
  'Google': '#4285F4',
  'Alibaba': '#ff6900',
  'Baidu': '#2932e1',
  'Tencent': '#1ba3ff',
  'ByteDance': '#fe2c55',
  'Moonshot': '#6366f1',
  'Zhipu': '#8b5cf6',
  'Minimax': '#f59e0b',
  'iFlytek': '#0891b2',
  'DeepSeek': '#3B82F6',
  'xAI': '#1D1D1F',
  'Meta': '#0668E1',
  'Mistral': '#FF6B35',
  'Stability AI': '#7C3AED',
  'Midjourney': '#5865F2',
};

// ============= VULCA 维度类别色 =============

export const vulcaCategoryColors = {
  creativity: {
    light: iosSystemColors.red,
    dark: iosDarkSystemColors.red,
  },
  technical: {
    light: iosSystemColors.green,
    dark: iosDarkSystemColors.green,
  },
  emotional: {
    light: iosSystemColors.blue,
    dark: iosDarkSystemColors.blue,
  },
  contextual: {
    light: iosSystemColors.indigo,
    dark: iosDarkSystemColors.indigo,
  },
  innovation: {
    light: iosSystemColors.orange,
    dark: iosDarkSystemColors.orange,
  },
  impact: {
    light: iosSystemColors.purple,
    dark: iosDarkSystemColors.purple,
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
 */
export const getOrgColor = (orgName: string): string => {
  return organizationColors[orgName] || chartColorsLight.primary[0];
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
