export const colors = {
  primary: {
    50: '#F5F9F0',
    100: '#E8F3E0',
    200: '#D4E7C5',
    300: '#B8D6A0',
    400: '#9BC27B',
    500: '#6BA539',
    600: '#4A7A2A',
    700: '#3D6322',
    800: '#2D4A1A',
    900: '#1F3312',
  },
  secondary: {
    50: '#F5F9F8',
    100: '#E8F3F0',
    200: '#D4E7E2',
    300: '#B8D6D0',
    400: '#9BC2B8',
    500: '#A8C8A8',
    600: '#7BA878',
    700: '#5E8A5B',
    800: '#4A6B48',
    900: '#3A4D38',
  },
  neutral: {
    50: '#FAFAF8',
    100: '#F5F5DC',
    200: '#E8E8E0',
    300: '#D3D3D3',
    400: '#A0A0A0',
    500: '#707070',
    600: '#525252',
    700: '#404040',
    800: '#2D2D2D',
    900: '#1A1A1A',
  },
  landscape: {
    mountain: '#5D8A3A',
    water: '#7FB3A8',
    sky: '#E8F4F0',
    mist: '#F0F5F2',
    ink: '#4A4A4A',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  game: {
    cardBack: '#6BA539',
    cardFront: '#FFFFFF',
    tableGreen: '#5D8A3A',
    tableBorder: '#4A7A2A',
    tableLight: '#8BC34A',
    highlight: '#F59E0B',
    shadow: 'rgba(45, 45, 45, 0.1)',
  },
} as const

export const typography = {
  fontFamily: {
    serif: "'Noto Serif SC', 'Source Han Serif SC', '思源宋体', 'SimSun', serif",
    sans: "'Noto Sans SC', 'Source Han Sans SC', '思源黑体', 'Microsoft YaHei', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    none: '1',
    tight: '1.4',
    normal: '1.6',
    relaxed: '1.8',
    loose: '2',
  },
} as const

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const

export const borderRadius = {
  none: '0',
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
} as const

export const animation = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ripple: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

export type ColorKey = keyof typeof colors
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
export type FontSize = keyof typeof typography.fontSize
export type FontWeight = keyof typeof typography.fontWeight
export type Spacing = keyof typeof spacing
export type BorderRadius = keyof typeof borderRadius
export type Shadow = keyof typeof shadows
