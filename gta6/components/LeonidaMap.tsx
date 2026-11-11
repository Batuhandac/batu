import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';
import type { MapLocation } from '@/types';

const W = 100;
const H = 100;

/**
 * Our own stylised silhouette of the state of Leonida. Hand-drawn, deliberately abstract.
 * Pins use percent coordinates so content editors never deal with pixels.
 */
export function LeonidaMap({ locations, selected, onSelect }: { locations: MapLocation[]; selected?: string; onSelect: (l: MapLocation) => void }) {
  const lang = useSettings((s) => s.lang);
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 720);
  const typeColor = (type: MapLocation['type']) =>
    type === 'city' ? colors.primary : type === 'region' ? colors.accent : type === 'landmark' ? colors.warning : colors.info;

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={4} fill={colors.surfaceLow} />
        {/* water texture */}
        {[12, 28, 44, 60, 76, 92].map((y) => (
          <Path key={y} d={`M2 ${y} q6 -2 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0`} stroke={colors.border} strokeWidth={0.4} fill="none" opacity={0.5} />
        ))}
        {/* mainland peninsula */}
        <Path
          d="M18 8 L62 6 Q74 8 70 20 L68 34 Q76 44 78 56 L80 72 Q78 82 70 84 L62 82 Q52 86 46 80 L36 66 Q26 56 24 44 L16 30 Q12 18 18 8 Z"
          fill={colors.surfaceAlt}
          stroke={colors.border}
          strokeWidth={0.8}
        />
        {/* keys */}
        {[[52, 90, 6], [60, 93, 5], [67, 95, 4], [73, 96, 3]].map(([cx, cy, r]) => (
          <Circle key={cx} cx={cx} cy={cy} r={r} fill={colors.surfaceAlt} stroke={colors.border} strokeWidth={0.6} />
        ))}
        {/* mountain hint */}
        <Path d="M54 18 L60 9 L66 18 Z" fill={colors.surface} stroke={colors.border} strokeWidth={0.5} />
        {locations.map((l) => {
          const active = l.slug === selected;
          const c = typeColor(l.type);
          return (
            <React.Fragment key={l.id}>
              {active && <Circle cx={l.x} cy={l.y} r={5} fill={c} opacity={0.25} />}
              <Circle cx={l.x} cy={l.y} r={active ? 2.6 : 2} fill={c} stroke={colors.bg} strokeWidth={0.6} onPress={() => onSelect(l)} />
              <SvgText x={l.x} y={l.y - 3.6} fontSize={3.2} fontWeight="700" fontFamily="system-ui, -apple-system, Roboto, sans-serif" fill={active ? colors.text : colors.textMuted} textAnchor="middle" onPress={() => onSelect(l)}>
                {t(l.name, lang)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      {/* transparent hit targets so taps work reliably on web and native */}
      {locations.map((l) => (
        <Pressable
          key={`hit-${l.id}`}
          onPress={() => onSelect(l)}
          style={[styles.hit, { left: (l.x / W) * size - 16, top: (l.y / H) * size - 20 }]}
          accessibilityLabel={t(l.name, lang)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', width: 32, height: 36 },
});
