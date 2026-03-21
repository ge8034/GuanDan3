export const fuchunTheme = {
  colors: {
    primary: {
      main: '#6BA539',
      light: '#8BC34A',
      lighter: '#A8C8A8',
      dark: '#4A7A2A',
      darker: '#2D4A1A',
    },
    secondary: {
      main: '#A8C8A8',
      light: '#C5DBD5',
      lighter: '#E2EDE8',
      dark: '#7BA878',
      darker: '#5E8A5B',
    },
    neutral: {
      beige: '#F5F5DC',
      light: '#FAFAF8',
      medium: '#D3D3D3',
      dark: '#A0A0A0',
      darker: '#707070',
    },
    ink: {
      light: '#4A4A4A',
      medium: '#2D2D2D',
      dark: '#1A1A1A',
    },
    landscape: {
      mountain: '#5D8A3A',
      water: '#7FB3A8',
      sky: '#E8F4F0',
      mist: '#F0F5F2',
    },
  },
  
  typography: {
    fontFamily: {
      serif: "'Source Han Serif SC', 'Noto Serif SC', '思源宋体', 'SimSun', serif",
      sans: "'Source Han Sans SC', 'Noto Sans SC', '思源黑体', 'Microsoft YaHei', sans-serif",
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
    },
    lineHeight: {
      tight: '1.4',
      normal: '1.6',
      relaxed: '1.8',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '8px',
    md: '10px',
    lg: '12px',
    xl: '16px',
  },
  
  shadows: {
    sm: '0 2px 4px rgba(45, 45, 45, 0.08)',
    md: '0 4px 8px rgba(45, 45, 45, 0.12)',
    lg: '0 8px 16px rgba(45, 45, 45, 0.15)',
    xl: '0 12px 24px rgba(45, 45, 45, 0.18)',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ripple: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
  },
  
  opacity: {
    background: 0.15,
    overlay: 0.08,
    border: 0.3,
  },
  
  icon: {
    sm: '24px',
    md: '32px',
    lg: '48px',
  },
};

export const cssVariables = {
  '--color-primary-main': fuchunTheme.colors.primary.main,
  '--color-primary-light': fuchunTheme.colors.primary.light,
  '--color-primary-lighter': fuchunTheme.colors.primary.lighter,
  '--color-primary-dark': fuchunTheme.colors.primary.dark,
  '--color-secondary-main': fuchunTheme.colors.secondary.main,
  '--color-secondary-light': fuchunTheme.colors.secondary.light,
  '--color-neutral-beige': fuchunTheme.colors.neutral.beige,
  '--color-neutral-medium': fuchunTheme.colors.neutral.medium,
  '--color-ink-medium': fuchunTheme.colors.ink.medium,
  '--color-landscape-mountain': fuchunTheme.colors.landscape.mountain,
  '--color-landscape-water': fuchunTheme.colors.landscape.water,
  '--color-landscape-sky': fuchunTheme.colors.landscape.sky,
  '--font-family-serif': fuchunTheme.typography.fontFamily.serif,
  '--font-family-sans': fuchunTheme.typography.fontFamily.sans,
  '--border-radius-sm': fuchunTheme.borderRadius.sm,
  '--border-radius-md': fuchunTheme.borderRadius.md,
  '--border-radius-lg': fuchunTheme.borderRadius.lg,
  '--animation-duration': fuchunTheme.animation.duration.normal,
  '--animation-easing': fuchunTheme.animation.easing.ripple,
};

export const lessVariables = `
@color-primary-main: #6BA539;
@color-primary-light: #8BC34A;
@color-primary-lighter: #A8C8A8;
@color-primary-dark: #4A7A2A;
@color-secondary-main: #A8C8A8;
@color-secondary-light: #C5DBD5;
@color-neutral-beige: #F5F5DC;
@color-neutral-medium: #D3D3D3;
@color-ink-medium: #2D2D2D;
@color-landscape-mountain: #5D8A3A;
@color-landscape-water: #7FB3A8;
@color-landscape-sky: #E8F4F0;
@font-family-serif: 'Source Han Serif SC', 'Noto Serif SC', '思源宋体', 'SimSun', serif;
@font-family-sans: 'Source Han Sans SC', 'Noto Sans SC', '思源黑体', 'Microsoft YaHei', sans-serif;
@border-radius-sm: 8px;
@border-radius-md: 10px;
@border-radius-lg: 12px;
@animation-duration: 300ms;
@animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
@opacity-background: 0.15;
@opacity-overlay: 0.08;
@opacity-border: 0.3;
`;

export default fuchunTheme;
