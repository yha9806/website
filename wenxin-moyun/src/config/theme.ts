// 深色科研主题系统配置
// 参考 GitHub Dark + VSCode 风格，营造专业分析氛围

export const themes = {
  dark: {
    // 背景层级系统 - 从深到浅
    bg: {
      base: '#0D1117',      // 最深背景 - 页面底色
      surface: '#161B22',   // 表面 - 卡片/面板背景
      elevated: '#1C2128',  // 提升 - 悬浮层/模态框
      overlay: '#262C36',   // 覆盖 - dropdown/tooltip
      hover: '#30363D',     // 悬停态背景
      active: '#3A424D',    // 激活态背景
    },
    
    // 边框系统
    border: {
      default: '#30363D',   // 默认边框
      muted: '#21262D',     // 弱边框 - 分割线
      strong: '#48545F',    // 强边框 - 焦点/选中
      subtle: '#1B1F23',    // 极弱边框
    },
    
    // 文字层级系统
    text: {
      primary: '#F0F6FC',   // 主要文字 - 标题/重要内容
      secondary: '#8B949E', // 次要文字 - 正文
      tertiary: '#6E7681',  // 辅助文字 - 说明/提示
      muted: '#484F58',     // 禁用文字
      inverse: '#0D1117',   // 反色文字 - 用于亮色按钮
    },
    
    // 语义色彩系统
    semantic: {
      blue: '#58A6FF',      // 主色 - 链接/主按钮
      green: '#3FB950',     // 成功 - 正向反馈
      yellow: '#D29922',    // 警告 - 提醒
      red: '#F85149',       // 错误 - 危险操作
      purple: '#A371F7',    // 创新 - 特殊亮点
      orange: '#FB8500',    // 强调 - 重要提示
      cyan: '#79C0FF',      // 信息 - 一般信息
      pink: '#FF7B9C',      // 装饰 - 徽章/标签
    },
    
    // 图表专用色板
    chart: {
      primary: '#58A6FF',
      secondary: '#A371F7',
      tertiary: '#3FB950',
      quaternary: '#FB8500',
      series: [
        '#58A6FF', '#A371F7', '#3FB950', '#FB8500',
        '#79C0FF', '#FF7B9C', '#D29922', '#F85149'
      ]
    },
    
    // 特殊用途
    special: {
      gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',     // 金牌
      silver: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',   // 银牌
      bronze: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',   // 铜牌
      gradient: 'linear-gradient(135deg, #58A6FF 0%, #A371F7 100%)', // 品牌渐变
    }
  },
  
  light: {
    // 保留现有浅色主题配置，后续迁移
    bg: {
      base: '#FFFFFF',
      surface: '#F6F8FA',
      elevated: '#FFFFFF',
      overlay: '#FFFFFF',
      hover: '#F3F4F6',
      active: '#E5E7EB',
    },
    
    border: {
      default: '#D1D5DB',
      muted: '#E5E7EB',
      strong: '#9CA3AF',
      subtle: '#F3F4F6',
    },
    
    text: {
      primary: '#24292F',
      secondary: '#57606A',
      tertiary: '#6E7781',
      muted: '#8C959F',
      inverse: '#FFFFFF',
    },
    
    semantic: {
      blue: '#0969DA',
      green: '#1A7F37',
      yellow: '#9A6700',
      red: '#CF222E',
      purple: '#8250DF',
      orange: '#FB8500',
      cyan: '#1B7C83',
      pink: '#BF3989',
    },
    
    chart: {
      primary: '#0969DA',
      secondary: '#8250DF',
      tertiary: '#1A7F37',
      quaternary: '#FB8500',
      series: [
        '#0969DA', '#8250DF', '#1A7F37', '#FB8500',
        '#1B7C83', '#BF3989', '#9A6700', '#CF222E'
      ]
    },
    
    special: {
      gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      silver: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
      bronze: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
      gradient: 'linear-gradient(135deg, #0969DA 0%, #8250DF 100%)',
    }
  }
};

// 导出类型定义
export type Theme = typeof themes.dark;
export type ThemeMode = keyof typeof themes;

// 获取当前主题
export const getTheme = (mode: ThemeMode): Theme => {
  return themes[mode];
};

// CSS 变量生成器
export const generateCSSVariables = (theme: Theme): string => {
  const cssVars: string[] = [];
  
  const processObject = (obj: any, prefix: string = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'object' && !Array.isArray(value)) {
        processObject(value, varName);
      } else if (!Array.isArray(value)) {
        cssVars.push(`--${varName}: ${value};`);
      }
    });
  };
  
  processObject(theme);
  return cssVars.join('\n  ');
};

// 主题类名映射
export const themeClasses = {
  // 背景类
  bgBase: 'bg-[var(--bg-base)]',
  bgSurface: 'bg-[var(--bg-surface)]',
  bgElevated: 'bg-[var(--bg-elevated)]',
  bgOverlay: 'bg-[var(--bg-overlay)]',
  
  // 文字类
  textPrimary: 'text-[var(--text-primary)]',
  textSecondary: 'text-[var(--text-secondary)]',
  textTertiary: 'text-[var(--text-tertiary)]',
  
  // 边框类
  borderDefault: 'border-[var(--border-default)]',
  borderMuted: 'border-[var(--border-muted)]',
  borderStrong: 'border-[var(--border-strong)]',
};