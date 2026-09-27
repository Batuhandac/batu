import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import { useTheme, palette } from '@/lib/theme';
import { Text } from './Text';

// Marka işareti: konum iğnesi (yakındaki veteriner) + kalp patili pati (sevgi).
// Kaynak: brand/logo-mark.svg
const PIN = 'M50 96 C44 88 17 64 17 41 C17 22.8 31.8 8 50 8 C68.2 8 83 22.8 83 41 C83 64 56 88 50 96 Z';
const HEART =
  'M50 61.5 C41 55.2 37.2 50.6 37.2 46.3 C37.2 42.4 40 39.6 43.6 39.6 C46.4 39.6 48.6 41.2 50 43.6 C51.4 41.2 53.6 39.6 56.4 39.6 C60 39.6 62.8 42.4 62.8 46.3 C62.8 50.6 59 55.2 50 61.5 Z';

export function LogoMark({ size = 40, inverse = false }: { size?: number; inverse?: boolean }) {
  const t = useTheme();
  const pin = inverse ? '#FFFFFF' : t.primary;
  const toes = inverse ? palette.teal[700] : t.dark ? palette.night[900] : palette.cream[100];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Pati SOS logosu">
      <Path d={PIN} fill={pin} />
      <G fill={toes}>
        <Ellipse cx={36.8} cy={33.6} rx={4.6} ry={5.8} transform="rotate(-22 36.8 33.6)" />
        <Ellipse cx={45.4} cy={27.2} rx={4.8} ry={6.1} transform="rotate(-7 45.4 27.2)" />
        <Ellipse cx={54.6} cy={27.2} rx={4.8} ry={6.1} transform="rotate(7 54.6 27.2)" />
        <Ellipse cx={63.2} cy={33.6} rx={4.6} ry={5.8} transform="rotate(22 63.2 33.6)" />
      </G>
      <Path d={HEART} fill={palette.coral[500]} />
    </Svg>
  );
}

export function Wordmark({ size = 24, inverse = false }: { size?: number; inverse?: boolean }) {
  const t = useTheme();
  return (
    <Text variant="display" style={{ fontSize: size, lineHeight: size * 1.2, letterSpacing: -size * 0.03 }} accessibilityLabel="Pati SOS">
      <Text variant="display" color={inverse ? '#FFFFFF' : t.primary} style={{ fontSize: size, lineHeight: size * 1.2 }}>
        pati
      </Text>
      <Text variant="display" color={inverse ? '#FFD9CF' : t.sos} style={{ fontSize: size, lineHeight: size * 1.2 }}>
        sos
      </Text>
    </Text>
  );
}

export function Logo({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.25 }}>
      <LogoMark size={size * 1.3} inverse={inverse} />
      <Wordmark size={size} inverse={inverse} />
    </View>
  );
}
