// Pati SOS tasarım dili: renk, tipografi, köşe değerleri.
// Sade ama sıcak: sistem yazı tipi, sıcak açık zemin, beyaz yumuşak gruplar ve tek
// marka rengi. Sevimlilik maskotlar ve pastel zeminlerden gelir (lib/art/faces.ts).
// Kırmızı yalnızca acil durum ve silme için. Açık/koyu tema cihaz ayarını izler.
// Gerekçeler: docs/ARASTIRMA.md
import { useColorScheme, StyleSheet, type TextStyle } from 'react-native';

export const palette = {
  pine: { 800: '#1A6649', 700: '#23845E', 600: '#2E9A6E', 400: '#5CC79C', 100: '#E0F2E9' },
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
  bg: '#F5F3EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE9E3',
  border: '#DEDAD2',
  borderStrong: '#BDB7AD',
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

// Koyu tema: gece açıldığında göz yormasın ama "simsiyah" da olmasın; sıcak kakao-gri tonlar.
export const darkTheme: Theme = {
  dark: true,
  bg: '#1F1C19',
  surface: '#2A2622',
  surfaceAlt: '#36312C',
  border: '#433D37',
  borderStrong: '#5A534B',
  text: '#F7F2EB',
  textMuted: '#C9C0B4',
  textSubtle: '#9A9084',
  primary: palette.pine[400],
  primaryPressed: '#4AB388',
  primarySoft: 'rgba(92,199,156,0.18)',
  onPrimary: '#06201A',
  sos: '#E5483B',
  sosPressed: palette.red[600],
  sosSoft: 'rgba(229,72,59,0.2)',
  onSos: '#FFFFFF',
  honey: palette.amber[400],
  honeySoft: 'rgba(245,165,36,0.18)',
  open: palette.pine[400],
  openSoft: 'rgba(92,199,156,0.18)',
  closed: '#9A9084',
  closedSoft: '#36312C',
  unknown: palette.amber[400],
  unknownSoft: 'rgba(245,165,36,0.18)',
  danger: palette.red[400],
  dangerSoft: 'rgba(255,107,94,0.18)',
  overlay: 'rgba(12,10,8,0.55)',
  shadow: '#000000',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

// Yazı tipleri: başlıklarda tombul ve samimi Baloo 2, metinde yumuşak ve okunaklı Nunito.
// İkisi de Türkçe karakterleri tam destekler. Kalınlık (fontWeight) verilen metinlerde
// Text bileşeni aynı ailenin doğru kesimini seçer (bkz. fontFor).
export const fonts = {
  head: 'Baloo2_600SemiBold',
  headBold: 'Baloo2_700Bold',
  body: 'Nunito_500Medium',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: fonts.headBold, fontSize: 34, lineHeight: 42 },
  title: { fontFamily: fonts.headBold, fontSize: 28, lineHeight: 36 },
  headline: { fontFamily: fonts.head, fontSize: 21, lineHeight: 28 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyHeavy, fontSize: 17, lineHeight: 24 },
  callout: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  // Büyük harfe Text bileşeni Türkçe kurallarla çevirir (i → İ); textTransform 'I' üretir
  overline: { fontFamily: fonts.bodyHeavy, fontSize: 12.5, lineHeight: 18, letterSpacing: 0.4 },
  button: { fontFamily: fonts.head, fontSize: 18, lineHeight: 24 },
} as const satisfies Record<string, TextStyle>;

/** Satır içi kalınlığı (fontWeight) aynı ailenin kesimine çevirir; özel yazı tipinde fontWeight güvenilir değildir. */
export function fontFor(family: string | undefined, weight: TextStyle['fontWeight']): string | undefined {
  if (!family || weight == null) return family;
  const w = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
  if (family.startsWith('Baloo2')) return w >= 700 ? fonts.headBold : fonts.head;
  if (family.startsWith('Nunito')) return w >= 700 ? fonts.bodyHeavy : w >= 600 ? fonts.bodyBold : w >= 500 ? fonts.bodySemi : fonts.body;
  return family;
}

export type TypeVariant = keyof typeof type;

export const radius = { sm: 12, md: 14, lg: 20, xl: 28, pill: 999 } as const;

/** Yalnızca zeminden ayrılması gereken yüzen öğeler için (bildirim, harita kartı). */
export function shadow(t: Theme, level: 1 | 2 = 1) {
  if (t.dark || level === 1) return {};
  return { shadowColor: t.shadow, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 };
}

export const hairline = StyleSheet.hairlineWidth;
