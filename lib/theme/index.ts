// Pati SOS tasarım dili — renk, tipografi, köşe ve gölge değerleri.
// Tüm ekranlar renkleri buradan alır; açık/koyu tema cihaz ayarını izler
// (gece 03:00'te göz yormayan koyu tema, gündüz sıcak krem zemin).
import { useColorScheme } from 'react-native';

export const palette = {
  teal: { 900: '#0B3F38', 800: '#0E5249', 700: '#13695E', 600: '#1C8272', 500: '#2A9D8A', 400: '#3FB8A5', 100: '#DCEFEA', 50: '#EDF7F4' },
  coral: { 700: '#C9432E', 600: '#E8543C', 500: '#F2644B', 400: '#FF7A62', 100: '#FCE1DA', 50: '#FEF2EF' },
  honey: { 600: '#B7791A', 500: '#E9A93A', 100: '#FBEFD6' },
  cream: { 50: '#FFFDF9', 100: '#FBF7F1', 200: '#F4EEE5', 300: '#E9E0D4', 400: '#D8CCBD' },
  ink: { 900: '#1E2A28', 700: '#3B4845', 500: '#5E6A67', 400: '#87918D', 300: '#B0B8B4' },
  night: { 900: '#0E1413', 800: '#151D1B', 700: '#1C2624', 600: '#26322F', 500: '#33413D' },
} as const;

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  sos: string;
  sosPressed: string;
  sosSoft: string;
  onSos: string;
  honey: string;
  honeySoft: string;
  open: string;
  openSoft: string;
  closed: string;
  closedSoft: string;
  unknown: string;
  unknownSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  shadow: string;
}

export const lightTheme: Theme = {
  dark: false,
  bg: palette.cream[100],
  surface: '#FFFFFF',
  surfaceAlt: palette.cream[200],
  border: palette.cream[300],
  borderStrong: palette.cream[400],
  text: palette.ink[900],
  textMuted: palette.ink[500],
  textSubtle: palette.ink[400],
  primary: palette.teal[700],
  primaryPressed: palette.teal[800],
  primarySoft: palette.teal[50],
  onPrimary: '#FFFFFF',
  sos: palette.coral[600],
  sosPressed: palette.coral[700],
  sosSoft: palette.coral[50],
  onSos: '#FFFFFF',
  honey: palette.honey[600],
  honeySoft: palette.honey[100],
  open: '#1E8A5A',
  openSoft: '#E2F3E9',
  closed: palette.ink[400],
  closedSoft: palette.cream[200],
  unknown: palette.honey[600],
  unknownSoft: palette.honey[100],
  danger: '#C23B2B',
  dangerSoft: '#FBE6E2',
  overlay: 'rgba(20,28,26,0.45)',
  shadow: '#3B2F22',
};

export const darkTheme: Theme = {
  dark: true,
  bg: palette.night[900],
  surface: palette.night[800],
  surfaceAlt: palette.night[700],
  border: palette.night[600],
  borderStrong: palette.night[500],
  text: '#F3F0EA',
  textMuted: '#B4BDB9',
  textSubtle: '#808B87',
  primary: palette.teal[400],
  primaryPressed: palette.teal[500],
  primarySoft: 'rgba(63,184,165,0.14)',
  onPrimary: palette.night[900],
  sos: palette.coral[600],
  sosPressed: palette.coral[700],
  sosSoft: 'rgba(242,100,75,0.16)',
  onSos: '#FFFFFF',
  honey: palette.honey[500],
  honeySoft: 'rgba(233,169,58,0.15)',
  open: '#4CC38A',
  openSoft: 'rgba(76,195,138,0.15)',
  closed: '#808B87',
  closedSoft: palette.night[700],
  unknown: palette.honey[500],
  unknownSoft: 'rgba(233,169,58,0.14)',
  danger: '#FF8A7A',
  dangerSoft: 'rgba(255,138,122,0.14)',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

// Nunito: yuvarlak hatlı, sıcak ama ciddi; Türkçe karakterleri tam destekler.
export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const type = {
  display: { fontFamily: fonts.black, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  headline: { fontFamily: fonts.extrabold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 23 },
  callout: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  // Büyük harfe Text bileşeni Türkçe kurallarla çevirir (i → İ); textTransform 'I' üretir
  overline: { fontFamily: fonts.extrabold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8 },
  button: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20 },
} as const;

export type TypeVariant = keyof typeof type;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export function shadow(t: Theme, level: 1 | 2 = 1) {
  if (t.dark) return {};
  return level === 1
    ? { shadowColor: t.shadow, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 }
    : { shadowColor: t.shadow, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 };
}
