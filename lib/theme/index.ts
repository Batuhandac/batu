// Pati SOS tasarım dili: renk, tipografi, köşe değerleri.
// Telefonun kendi uygulamaları gibi sade: sistem yazı tipi, nötr gri zemin,
// beyaz gruplar ve tek marka rengi. Kırmızı yalnızca acil durum ve silme için.
// Açık/koyu tema cihaz ayarını izler. Gerekçeler: docs/ARASTIRMA.md
import { useColorScheme, StyleSheet, type TextStyle } from 'react-native';

export const palette = {
  pine: { 800: '#154C3A', 700: '#1F6B52', 600: '#2A7F62', 400: '#52B891', 100: '#E3EFEA' },
  red: { 700: '#B42318', 600: '#D92D20', 400: '#FF6B5E' },
  amber: { 700: '#A15C07', 400: '#F5A524' },
  gray: { 50: '#F2F2F7', 100: '#E8E8ED', 200: '#D1D1D6', 300: '#AEAEB2', 500: '#8E8E93', 600: '#636366', 700: '#48484A', 800: '#2C2C2E', 850: '#1C1C1E', 900: '#111214' },
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
  bg: palette.gray[50],
  surface: '#FFFFFF',
  surfaceAlt: palette.gray[100],
  border: palette.gray[200],
  borderStrong: palette.gray[300],
  text: palette.gray[900],
  textMuted: '#5E5E63',
  textSubtle: palette.gray[500],
  primary: palette.pine[700],
  primaryPressed: palette.pine[800],
  primarySoft: palette.pine[100],
  onPrimary: '#FFFFFF',
  sos: palette.red[600],
  sosPressed: palette.red[700],
  sosSoft: '#FDECEA',
  onSos: '#FFFFFF',
  honey: palette.amber[700],
  honeySoft: '#FBF0E1',
  open: palette.pine[700],
  openSoft: palette.pine[100],
  closed: palette.gray[500],
  closedSoft: palette.gray[100],
  unknown: palette.amber[700],
  unknownSoft: '#FBF0E1',
  danger: palette.red[600],
  dangerSoft: '#FDECEA',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: '#000000',
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#000000',
  surface: palette.gray[850],
  surfaceAlt: palette.gray[800],
  border: '#38383A',
  borderStrong: palette.gray[700],
  text: '#F5F5F7',
  textMuted: palette.gray[300],
  textSubtle: palette.gray[500],
  primary: palette.pine[400],
  primaryPressed: '#43A07C',
  primarySoft: 'rgba(82,184,145,0.16)',
  onPrimary: '#06201A',
  sos: '#E5483B',
  sosPressed: palette.red[600],
  sosSoft: 'rgba(229,72,59,0.18)',
  onSos: '#FFFFFF',
  honey: palette.amber[400],
  honeySoft: 'rgba(245,165,36,0.16)',
  open: palette.pine[400],
  openSoft: 'rgba(82,184,145,0.16)',
  closed: palette.gray[500],
  closedSoft: palette.gray[800],
  unknown: palette.amber[400],
  unknownSoft: 'rgba(245,165,36,0.16)',
  danger: palette.red[400],
  dangerSoft: 'rgba(255,107,94,0.16)',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

// Sistem yazı tipi (iOS'ta SF Pro, Android'de Roboto): okunaklı, Türkçe karakterleri
// tam destekler, kullanıcının "büyük yazı" ayarına uyar. Ölçüler iOS metin stillerinden.
export const type = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  headline: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 23 },
  bodyStrong: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  callout: { fontSize: 16, lineHeight: 21 },
  caption: { fontSize: 13, lineHeight: 18 },
  // Büyük harfe Text bileşeni Türkçe kurallarla çevirir (i → İ); textTransform 'I' üretir
  overline: { fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const radius = { sm: 8, md: 10, lg: 12, xl: 16, pill: 999 } as const;

/** Yalnızca zeminden ayrılması gereken yüzen öğeler için (bildirim, harita kartı). */
export function shadow(t: Theme, level: 1 | 2 = 1) {
  if (t.dark || level === 1) return {};
  return { shadowColor: t.shadow, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 };
}

export const hairline = StyleSheet.hairlineWidth;
