export const colors = {
  bg: '#131315',
  surface: '#201F21',
  surfaceAlt: '#2A2A2C',
  surfaceHover: '#353437',
  surfaceLow: '#1B1B1D',
  surfaceLowest: '#0E0E10',
  primary: '#47EAED',
  primaryDark: '#00CED1',
  primaryMuted: 'rgba(71,234,237,0.12)',
  onPrimary: '#003738',
  accent: '#FFCB9E',
  accentMuted: 'rgba(255,203,158,0.14)',
  text: '#E5E1E4',
  textMuted: '#BAC9C9',
  textFaint: '#859493',
  border: '#3B4949',
  borderLight: 'rgba(255,255,255,0.08)',
  error: '#FFB4AB',
  errorMuted: 'rgba(255,180,171,0.14)',
  success: '#6FD7D6',
  successMuted: 'rgba(111,215,214,0.14)',
  warning: '#FFA54A',
  warningMuted: 'rgba(255,165,74,0.14)',
  overlay: 'rgba(0,0,0,0.75)',
  pokemon: '#F4B860',
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
  md: 8,
  lg: 8,
  xl: 8,
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
