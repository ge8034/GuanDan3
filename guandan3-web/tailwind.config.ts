import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-noto-serif-sc)', 'Noto Serif SC', 'Source Han Serif SC', '思源宋体', 'SimSun', 'serif'],
        card: ['Georgia', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-background': 'var(--gradient-background)',
      },
      colors: {
        // Poker主题颜色
        poker: {
          table: {
            DEFAULT: '#1a472a',
            light: '#1e5634',
            dark: '#0d2818',
            border: '#2d5a3d',
            accent: '#3a7a4f',
            mid: '#15301f',
            hoverLight: '#1e5634',
            hoverDark: '#153020',
            activeLight: '#153020',
            activeDark: '#0d1f14',
            hoverBorder: '#3a7a4f',
          },
          // 简写形式
          DEFAULT: '#1a472a',
        },
        // 中性色系统（Impeccable Design）
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // 卡片颜色
        card: {
          bg: '#ffffff',
          bgGradientStart: '#ffffff',
          bgGradientMid: '#fafafa',
          bgGradientEnd: '#e8e8e8',
          textBlack: '#1f2937',
          textRed: '#dc2626',
          borderInner: '#d1d5db',
        },
        // 木质边框色
        wood: {
          DEFAULT: '#6b4423',
          dark: '#4a3728',
          light: '#8b5a2b',
          grain: '#3d2817',
        },
        // 装饰色 (增强金色)
        accent: {
          gold: '#d4af37',
          goldLight: '#e5c158',
          goldShimmer: '#f5d778',
          goldDark: '#b8962e',
        },
        // 状态色
        success: '#4ade80',
        warning: '#fbbf24',
        error: {
          DEFAULT: '#ef4444',
          500: '#ef4444',
        },
        info: '#60a5fa',
        // 原有颜色（保持兼容）
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: '#e8f3e0',
          100: '#d4e7c0',
          200: '#b8d6a0',
          300: '#9bc27b',
          400: '#6ba539',
          500: '#4a7a2a',
          600: '#2d5a1d',
          700: '#1a4a0a',
          foreground: '#0d2818',
        },
        secondary: {
          DEFAULT: '#2d5a3d',
          foreground: '#ffffff',
        },
        background: {
          primary: '#0d2818',
          secondary: '#1a472a',
        },
        surface: '#1a472a',
        beige: {
          DEFAULT: '#f5f5dc',
          light: '#fef3c7',
          dark: '#e8e8e0',
        },
        muted: {
          DEFAULT: '#6b7280',
          foreground: '#9ca3af',
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
          foreground: '#1f2937',
          muted: '#9ca3af',
        },
        border: '#2d5a3d',
        card: {
          DEFAULT: '#ffffff',
          hover: '#f5f5f5',
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-selected': 'var(--shadow-card-selected)',
        button: 'var(--shadow-button)',
        'button-hover': 'var(--shadow-button-hover)',
        inner: 'var(--shadow-inner)',
        'gold-glow': 'var(--shadow-gold-glow)',
        // 自定义阴影组合
        'layer-1': '0 1px 2px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)',
        'layer-2': '0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)',
        'layer-3': '0 4px 8px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.15)',
        'floating': '0 8px 16px rgba(0, 0, 0, 0.4), 0 16px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        'gold-border': '0 0 0 1px rgba(212, 175, 55, 0.4), 0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-strong': '0 0 0 2px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.5)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: '12px',
        '2xl': '16px',
      },
      screens: {
        '2xl': '1536px',
        '3xl': '1920px', // 适配 1080P 全屏
        '4xl': '2560px', // 适配 2K/4K
      },
      zIndex: {
        modal: '50',
        dropdown: '40',
      },
    },
  },
  plugins: [],
}
export default config
