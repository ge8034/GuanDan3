export type ThemeMode = 'light' | 'dark' | 'auto';

export type GameTheme = 'classic' | 'modern' | 'retro' | 'nature' | 'ocean' | 'sunset' | `custom_${string}`;

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  card: string;
  cardHover: string;
}

export interface ThemeConfig {
  id: GameTheme;
  name: string;
  description: string;
  colors: ThemeColors;
  gradients: {
    primary: string;
    secondary: string;
    background: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const themeConfigs: Record<GameTheme, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: '雅致经典',
    description: '新中式水墨风格，沉稳大气',
    colors: {
      primary: '#2C5F2D', // 深墨绿，更沉稳
      secondary: '#97A97C', // 灰绿色，低饱和
      accent: '#D4AF37', // 香槟金，点缀
      background: '#F2F0E6', // 米宣纸色，温暖有质感
      surface: '#FFFFFF',
      text: '#1F2623', // 近黑的深绿
      textSecondary: '#637069',
      success: '#4A7C59',
      warning: '#C8963E',
      error: '#B45454', // 胭脂红，不刺眼
      border: '#E3E5D8',
      card: '#FFFFFF',
      cardHover: '#FDFDF9'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2C5F2D 0%, #4A7C59 100%)',
      secondary: 'linear-gradient(135deg, #97A97C 0%, #B5C99A 100%)',
      background: 'linear-gradient(180deg, #F2F0E6 0%, #EBE8DE 100%)'
    },
    shadows: {
      sm: '0 2px 8px -2px rgba(44, 95, 45, 0.08)',
      md: '0 8px 24px -4px rgba(44, 95, 45, 0.12)',
      lg: '0 12px 48px -6px rgba(44, 95, 45, 0.15)'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem' // 减小圆角，更显干练
    }
  },
  modern: {
    id: 'modern',
    name: '现代主题',
    description: '简洁现代风格，清新明亮',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#F3F4F6',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      border: '#E5E7EB',
      card: '#FFFFFF',
      cardHover: '#F9FAFB'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      background: 'linear-gradient(180deg, #F3F4F6 0%, #E5E7EB 100%)'
    },
    shadows: {
      sm: '0 1px 3px 0 rgba(59, 130, 246, 0.1)',
      md: '0 4px 6px -1px rgba(59, 130, 246, 0.15)',
      lg: '0 10px 15px -3px rgba(59, 130, 246, 0.2)'
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem'
    }
  },
  retro: {
    id: 'retro',
    name: '复古主题',
    description: '怀旧像素风格，复古怀旧',
    colors: {
      primary: '#DC2626',
      secondary: '#7C2D12',
      accent: '#FBBF24',
      background: '#FEF2F2',
      surface: '#FFFBEB',
      text: '#1C1917',
      textSecondary: '#78350F',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#FCD34D',
      card: '#FFFBEB',
      cardHover: '#FEF3C7'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #DC2626 0%, #7C2D12 100%)',
      secondary: 'linear-gradient(135deg, #7C2D12 0%, #FBBF24 100%)',
      background: 'linear-gradient(180deg, #FEF2F2 0%, #FED7AA 100%)'
    },
    shadows: {
      sm: '2px 2px 0px rgba(0, 0, 0, 0.2)',
      md: '4px 4px 0px rgba(0, 0, 0, 0.3)',
      lg: '8px 8px 0px rgba(0, 0, 0, 0.4)'
    },
    borderRadius: {
      sm: '0rem',
      md: '0.25rem',
      lg: '0.5rem'
    }
  },
  nature: {
    id: 'nature',
    name: '自然主题',
    description: '清新自然风格，绿色环保',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#34D399',
      background: '#ECFDF5',
      surface: '#FFFFFF',
      text: '#064E3B',
      textSecondary: '#6B7280',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#D1FAE5',
      card: '#FFFFFF',
      cardHover: '#F0FDFA'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      secondary: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      background: 'linear-gradient(180deg, #ECFDF5 0%, #D1FAE5 100%)'
    },
    shadows: {
      sm: '0 2px 8px -2px rgba(5, 150, 105, 0.1)',
      md: '0 8px 24px -4px rgba(5, 150, 105, 0.15)',
      lg: '0 12px 48px -6px rgba(5, 150, 105, 0.2)'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.625rem',
      lg: '0.875rem'
    }
  },
  ocean: {
    id: 'ocean',
    name: '海洋主题',
    description: '深海蓝色风格，宁静深邃',
    colors: {
      primary: '#0284C7',
      secondary: '#0369A1',
      accent: '#0EA5E9',
      background: '#F0F9FF',
      surface: '#FFFFFF',
      text: '#0C4A6E',
      textSecondary: '#6B7280',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#7DD3FC',
      card: '#FFFFFF',
      cardHover: '#E0F2FE'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      secondary: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
      background: 'linear-gradient(180deg, #F0F9FF 0%, #BAE6FD 100%)'
    },
    shadows: {
      sm: '0 2px 8px -2px rgba(2, 132, 199, 0.1)',
      md: '0 8px 24px -4px rgba(2, 132, 199, 0.15)',
      lg: '0 12px 48px -6px rgba(2, 132, 199, 0.2)'
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem'
    }
  },
  sunset: {
    id: 'sunset',
    name: '日落主题',
    description: '温暖橙色风格，活力四射',
    colors: {
      primary: '#EA580C',
      secondary: '#C2410C',
      accent: '#F97316',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#7C2D12',
      textSecondary: '#6B7280',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      border: '#FDBA74',
      card: '#FFFFFF',
      cardHover: '#FFEDD5'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
      secondary: 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)',
      background: 'linear-gradient(180deg, #FFF7ED 0%, #FED7AA 100%)'
    },
    shadows: {
      sm: '0 2px 8px -2px rgba(234, 88, 12, 0.1)',
      md: '0 8px 24px -4px rgba(234, 88, 12, 0.15)',
      lg: '0 12px 48px -6px rgba(234, 88, 12, 0.2)'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.625rem',
      lg: '0.875rem'
    }
  }
};