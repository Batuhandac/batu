export const colors = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#21262D',
  surfaceHover: '#2D333B',
  primary: '#2F81F7',
  primaryDark: '#1F6FEB',
  primaryMuted: 'rgba(47,129,247,0.15)',
  text: '#F0F6FC',
  textMuted: '#8B949E',
  textFaint: '#484F58',
  border: '#30363D',
  borderLight: '#21262D',
  error: '#F85149',
  errorMuted: 'rgba(248,81,73,0.15)',
  success: '#3FB950',
  successMuted: 'rgba(63,185,80,0.15)',
  warning: '#D29922',
  warningMuted: 'rgba(210,153,34,0.15)',
  overlay: 'rgba(0,0,0,0.75)',
  pokemon: '#FFCB05',
  yugioh: '#4A90D9',
  onepiece: '#E63946',
  mtg: '#7C3AED',
  lorcana: '#0EA5E9',
  naruto: '#FF6B35',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
