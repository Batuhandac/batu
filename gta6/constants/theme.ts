export const colors = {
  bg: '#07050D',
  surface: '#120E1C',
  surfaceAlt: '#1B1529',
  surfaceLow: '#0C0914',
  primary: '#FF2D8A',
  primaryMuted: 'rgba(255,45,138,0.16)',
  onPrimary: '#1A0010',
  accent: '#22E3D0',
  accentMuted: 'rgba(34,227,208,0.14)',
  orange: '#FF7A3C',
  yellow: '#FFC83D',
  purple: '#8B5CFF',
  text: '#F6F2FA',
  textMuted: '#B9B0C9',
  textFaint: '#7A7090',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.18)',
  success: '#4DF5A6',
  successMuted: 'rgba(77,245,166,0.14)',
  warning: '#FFC83D',
  warningMuted: 'rgba(255,200,61,0.14)',
  error: '#FF5C6C',
  errorMuted: 'rgba(255,92,108,0.14)',
  info: '#7AA7FF',
  infoMuted: 'rgba(122,167,255,0.14)',
} as const;

/** Vice City sunset. Used for accents, bars and primary buttons. */
export const gradients = {
  sunset: ['#FF2D8A', '#FF7A3C', '#FFC83D'] as const,
  vice: ['#8B5CFF', '#FF2D8A'] as const,
  scrim: ['rgba(7,5,13,0)', 'rgba(7,5,13,0.55)', '#07050D'] as const,
  scrimTop: ['rgba(7,5,13,0.75)', 'rgba(7,5,13,0)'] as const,
  card: ['rgba(7,5,13,0)', 'rgba(7,5,13,0.2)', 'rgba(7,5,13,0.92)'] as const,
};

export const fonts = {
  display: 'Anton_400Regular',
  body: 'Inter_400Regular',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_800ExtraBold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16, xl: 22, full: 9999 } as const;
export const fontSize = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 34 } as const;

export const RELEASE_DATE_ISO = '2026-11-19T00:00:00Z';
