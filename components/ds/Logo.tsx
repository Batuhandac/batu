import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import { useTheme } from '@/lib/theme';
import { Text } from './Text';

// Marka işareti: konum iğnesi (yakındaki veteriner) içinde pati. Tek renk.
// Kaynak: brand/logo-mark.svg
export const PIN_PATH = 'M50 96 C44 88 17 64 17 41 C17 22.8 31.8 8 50 8 C68.2 8 83 22.8 83 41 C83 64 56 88 50 96 Z';
export const PAD_PATH = 'M50 41.5 C57.6 41.5 64.5 47.6 64.5 54.6 C64.5 59.4 61.2 62 57.2 62 C54 62 52.4 60.2 50 60.2 C47.6 60.2 46 62 42.8 62 C38.8 62 35.5 59.4 35.5 54.6 C35.5 47.6 42.4 41.5 50 41.5 Z';
export const TOES = [
  { cx: 36.2, cy: 35.5, rx: 4.6, ry: 5.8, r: -22 },
  { cx: 44.8, cy: 28.6, rx: 4.8, ry: 6.1, r: -7 },
  { cx: 55.2, cy: 28.6, rx: 4.8, ry: 6.1, r: 7 },
  { cx: 63.8, cy: 35.5, rx: 4.6, ry: 5.8, r: 22 },
];

export function LogoMark({ size = 40, inverse = false }: { size?: number; inverse?: boolean }) {
  const t = useTheme();
  const pin = inverse ? '#FFFFFF' : t.primary;
  const paw = inverse ? t.primary : t.dark ? t.bg : '#FFFFFF';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Pati SOS logosu">
      <Path d={PIN_PATH} fill={pin} />
      <G fill={paw}>
        {TOES.map((e) => (
          <Ellipse key={e.cx} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} transform={`rotate(${e.r} ${e.cx} ${e.cy})`} />
        ))}
        <Path d={PAD_PATH} />
      </G>
    </Svg>
  );
}

export function Wordmark({ size = 22, inverse = false }: { size?: number; inverse?: boolean }) {
  const t = useTheme();
  return (
    <Text
      variant="title"
      color={inverse ? '#FFFFFF' : t.text}
      style={{ fontSize: size, lineHeight: size * 1.2, letterSpacing: -size * 0.02 }}
      accessibilityLabel="Pati SOS"
    >
      Pati SOS
    </Text>
  );
}

export function Logo({ size = 22, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <LogoMark size={size * 1.4} inverse={inverse} />
      <Wordmark size={size} inverse={inverse} />
    </View>
  );
}
