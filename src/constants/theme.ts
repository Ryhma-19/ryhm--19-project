export type ThemeType = 'normal' | 'dark' | 'light';

const NORMAL_COLORS = {
  primary: '#4A90E2',      
  secondary: '#50C878',    
  accent: '#FF6B6B',       
  background: '#F5F5F5',   
  surface: '#FFFFFF',      
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
  },
  border: '#E0E0E0',
  error: '#E74C3C',
  warning: '#F39C12',
  success: '#27AE60',
};

const DARK_COLORS = {
  primary: '#5B9FFF',      
  secondary: '#62E89B',    
  accent: '#FF8A8A',       
  background: '#1A1A1A',   
  surface: '#2D2D2D',      
  text: {
    primary: '#E8E8E8',
    secondary: '#A8A8A8',
    light: '#6B6B6B',
  },
  border: '#404040',
  error: '#FF6B6B',
  warning: '#FFB84D',
  success: '#52D47A',
};

const LIGHT_COLORS = {
  primary: '#2962FF',      
  secondary: '#2ECC71',    
  accent: '#FF4757',       
  background: '#FFFFFF',   
  surface: '#F8F8F8',      
  text: {
    primary: '#1A1A1A',
    secondary: '#5A5A5A',
    light: '#A0A0A0',
  },
  border: '#EBEBEB',
  error: '#E74C3C',
  warning: '#E67E22',
  success: '#27AE60',
};

export const getColors = (theme: ThemeType = 'normal') => {
  switch (theme) {
    case 'dark':
      return DARK_COLORS;
    case 'light':
      return LIGHT_COLORS;
    default:
      return NORMAL_COLORS;
  }
};

export const COLORS = NORMAL_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
};