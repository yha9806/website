/**
 * 统一的图表主题配置
 * 基于视觉设计系统的色彩规范
 */

export const chartColors = {
  // 主要图表颜色序列
  primary: ['#0052CC', '#FF8B00', '#36B37E', '#FFAB00', '#FF5630'],
  
  // 渐变色配置
  gradients: {
    primaryToSuccess: ['#0052CC', '#36B37E'],
    primaryToAccent: ['#0052CC', '#FF8B00'],
    successToWarning: ['#36B37E', '#FFAB00'],
  },
  
  // 组织机构品牌色（保持原有映射）
  organizations: {
    'Alibaba': '#ff6900',
    'OpenAI': '#10b981',
    'Baidu': '#2932e1',
    'Tencent': '#1ba3ff',
    'ByteDance': '#fe2c55',
    'Anthropic': '#d97757',
    'Moonshot': '#6366f1',
    'Zhipu': '#8b5cf6',
    'Minimax': '#f59e0b',
    'iFlytek': '#0891b2',
  },
  
  // 网格和轴线颜色
  grid: {
    line: '#DFE1E6',      // neutral-300
    text: '#6B778C',      // neutral-600
    subText: '#A5ADBA',   // neutral-500
  },
  
  // 背景色
  background: {
    card: '#FFFFFF',
    hover: '#F4F5F7',     // neutral-100
    disabled: '#FAFBFC',  // neutral-50
  }
};

// 图表通用配置
export const chartConfig = {
  // 字体配置
  font: {
    family: 'Inter, system-ui, -apple-system, sans-serif',
    sizes: {
      title: 18,
      label: 14,
      tick: 12,
      legend: 14,
    }
  },
  
  // 动画配置
  animation: {
    duration: 400,
    easing: 'ease-in-out',
  },
  
  // 边距配置
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  
  // 工具提示样式
  tooltip: {
    backgroundColor: 'rgba(9, 30, 66, 0.9)', // neutral-900 with opacity
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
  }
};

// 获取数据系列颜色
export const getSeriesColors = (count: number): string[] => {
  const colors = chartColors.primary;
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // 如果需要更多颜色，循环使用并调整透明度
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const baseColor = colors[i % colors.length];
    const opacity = i < colors.length ? 1 : 0.7;
    result.push(opacity === 1 ? baseColor : `${baseColor}B3`); // B3 = 70% opacity in hex
  }
  return result;
};

// 获取组织机构颜色
export const getOrgColor = (orgName: string): string => {
  return chartColors.organizations[orgName as keyof typeof chartColors.organizations] || chartColors.primary[0];
};