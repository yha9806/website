/** @type {import('tailwindcss').Config} */

// 色阶生成函数 - 基于HSL色彩空间智能生成和谐色阶
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateColorScale(baseColor, preserveMain = true) {
  const { h, s, l } = hexToHSL(baseColor);
  const scale = {};
  
  // 生成色阶的配置
  const scaleConfig = [
    { key: 50, lightnessAdjust: 45, saturationAdjust: -30 },
    { key: 100, lightnessAdjust: 35, saturationAdjust: -20 },
    { key: 200, lightnessAdjust: 25, saturationAdjust: -10 },
    { key: 300, lightnessAdjust: 15, saturationAdjust: -5 },
    { key: 400, lightnessAdjust: 5, saturationAdjust: 0 },
    { key: 500, lightnessAdjust: 0, saturationAdjust: 0 }, // 主色
    { key: 600, lightnessAdjust: -8, saturationAdjust: 5 },
    { key: 700, lightnessAdjust: -16, saturationAdjust: 5 },
    { key: 800, lightnessAdjust: -24, saturationAdjust: 5 },
    { key: 900, lightnessAdjust: -32, saturationAdjust: 5 },
  ];

  scaleConfig.forEach(({ key, lightnessAdjust, saturationAdjust }) => {
    if (key === 500 && preserveMain) {
      scale[key] = baseColor;
      scale['DEFAULT'] = baseColor; // 添加默认值支持简写
    } else {
      const newL = Math.max(0, Math.min(100, l + lightnessAdjust));
      const newS = Math.max(0, Math.min(100, s + saturationAdjust));
      scale[key] = hslToHex(h, newS, newL);
    }
  });

  return scale;
}

export default {
  darkMode: 'class', // 启用深色模式，通过 class 控制
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色系 - 深蓝色传递专业科技感
        primary: generateColorScale('#0052CC'),
        
        // 强调色 - 橙色用于重点提示
        accent: generateColorScale('#FF8B00'),
        
        // 成功色 - 绿色
        success: generateColorScale('#36B37E'),
        
        // 警告色 - 黄色
        warning: generateColorScale('#FFAB00'),
        
        // 错误色 - 红色
        error: generateColorScale('#FF5630'),
        
        // 中性色 - 8阶灰度系统（保持原设计）
        neutral: {
          50: '#FAFBFC',  // 背景最浅
          100: '#F4F5F7', // 卡片背景
          200: '#EBECF0', // 浅色背景
          300: '#DFE1E6', // 分割线
          400: '#C1C7D0', // 禁用状态
          500: '#A5ADBA', // 占位符文字
          600: '#6B778C', // 次要文字
          700: '#505F79', // 正文文字
          800: '#253858', // 深色文字
          900: '#091E42', // 标题文字
          DEFAULT: '#6B778C', // 默认中性色
        },
        
        // 保留次要色系用于兼容
        secondary: generateColorScale('#6B46C1'),
        
        // 中国传统色彩
        chinese: {
          red: '#C73E3A',     // 朱红
          gold: '#D4A76A',    // 金黄
          jade: '#3EB370',    // 翡翠绿
          ink: '#2B2B2B',     // 墨黑
          purple: '#8B4789',  // 紫罗兰
          cyan: '#5DAC81',    // 青瓷色
          pearl: '#F8F4E6',   // 珍珠白
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      }
    },
  },
  plugins: [],
}