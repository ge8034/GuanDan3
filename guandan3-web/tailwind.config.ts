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
            hoverLight: '#1e5634',
            hoverDark: '#153020',
            activeLight: '#153020',
            activeDark: '#0d1f14',
            hoverBorder: '#3a7a4f',
          },
          card: {
            bg: '#ffffff',
            bgGradientStart: '#ffffff',
            bgGradientEnd: '#e5e7eb',
            textBlack: '#1f2937',
            textRed: '#dc2626',
          },
        },
        // 装饰色
        accent: {
          gold: '#d4af37',
          goldLight: '#e5c158',
        },
        // 状态色
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
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
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-selected': '0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 3px #d4af37, 0 0 20px rgba(212, 175, 55, 0.5)',
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
      },
      screens: {
        '2xl': '1536px',
        '3xl': '1920px', // 适配 1080P 全屏
        '4xl': '2560px', // 适配 2K/4K
      },
    },
  },
  plugins: [],
}
export default config
