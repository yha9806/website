/** @type {import('tailwindcss').Config} */

// iOS Color Scale Generation - Simplified and clean
function generateColorScale(baseColor) {
  const hexToHSL = (hex) => {
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
  };

  const hslToHex = (h, s, l) => {
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
  };

  const { h, s, l } = hexToHSL(baseColor);
  const scale = {};
  
  const scaleConfig = [
    { key: 50, lightnessAdjust: 40, saturationAdjust: -20 },
    { key: 100, lightnessAdjust: 30, saturationAdjust: -15 },
    { key: 200, lightnessAdjust: 20, saturationAdjust: -10 },
    { key: 300, lightnessAdjust: 10, saturationAdjust: -5 },
    { key: 400, lightnessAdjust: 5, saturationAdjust: 0 },
    { key: 500, lightnessAdjust: 0, saturationAdjust: 0 }, // Main color
    { key: 600, lightnessAdjust: -5, saturationAdjust: 5 },
    { key: 700, lightnessAdjust: -12, saturationAdjust: 5 },
    { key: 800, lightnessAdjust: -20, saturationAdjust: 5 },
    { key: 900, lightnessAdjust: -30, saturationAdjust: 5 },
  ];

  scaleConfig.forEach(({ key, lightnessAdjust, saturationAdjust }) => {
    if (key === 500) {
      scale[key] = baseColor;
      scale['DEFAULT'] = baseColor;
    } else {
      const newL = Math.max(0, Math.min(100, l + lightnessAdjust));
      const newS = Math.max(0, Math.min(100, s + saturationAdjust));
      scale[key] = hslToHex(h, newS, newL);
    }
  });

  return scale;
}

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // iOS System Colors
        blue: generateColorScale('#007AFF'),    // iOS Blue
        green: generateColorScale('#34C759'),   // iOS Green  
        orange: generateColorScale('#FF9500'),  // iOS Orange
        red: generateColorScale('#FF3B30'),     // iOS Red
        purple: generateColorScale('#AF52DE'),  // iOS Purple
        
        // Legacy support - map to iOS colors
        primary: generateColorScale('#007AFF'), 
        secondary: generateColorScale('#AF52DE'),
        accent: generateColorScale('#FF9500'),
        success: generateColorScale('#34C759'),
        warning: generateColorScale('#FF9500'),
        error: generateColorScale('#FF3B30'),
        
        // iOS Gray Scale
        gray: {
          50: '#F2F2F7',   // iOS Light Gray 6
          100: '#E5E5EA',  // iOS Light Gray 5  
          200: '#D1D1D6',  // iOS Light Gray 4
          300: '#C7C7CC',  // iOS Light Gray 3
          400: '#AEAEB2',  // iOS Light Gray 2
          500: '#8E8E93',  // iOS Light Gray
          600: '#636366',  // iOS Dark Gray
          700: '#48484A',  // iOS Dark Gray 2
          800: '#3A3A3C',  // iOS Dark Gray 3
          900: '#1C1C1E',  // iOS Dark Gray 4
          950: '#000000',  // iOS Dark Gray 6
        },
        
        // Neutral mapping for compatibility
        neutral: {
          50: '#F2F2F7',
          100: '#E5E5EA', 
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#1C1C1E',
          DEFAULT: '#8E8E93',
        },
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Roboto', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
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
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
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
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}