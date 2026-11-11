import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';
import type { MapLocation } from '@/types';

const W = 100;

export interface MapArea { name: string; x: number; y: number; count: number }

/**
 * Point-cloud map of Leonida drawn from the community catalogue. The land shape emerges from
 * the points themselves; nothing here is copied from the game. Pins are percent coordinates.
 * Tap resolution is done on our side (nearest pin) so it works identically on web and native.
 */
export function LeonidaMap({
  locations, areas, selected, onSelect,
}: { locations: MapLocation[]; areas: MapArea[]; selected?: string; onSelect: (l: MapLocation) => void }) {
  const lang = useSettings((s) => s.lang);
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 720);
  const [zoom, setZoom] = useState<{ cx: number; cy: number; k: number }>({ cx: 50, cy: 50, k: 1 });
  const layout = useRef({ x: 0, y: 0 });

  const typeColor = (type: MapLocation['type']) => {
    switch (type) {
      case 'transport': case 'infrastructure': return colors.info;
      case 'commercial': case 'hotel': case 'restaurant': case 'entertainment': case 'leisure': return colors.primary;
      case 'industrial': case 'government': case 'public': return colors.warning;
      case 'nature': return colors.success;
      default: return colors.accent;
    }
  };

  // Current viewport in percent space.
  const vb = useMemo(() => {
    const span = W / zoom.k;
    const x = Math.min(Math.max(zoom.cx - span / 2, 0), W - span);
    const y = Math.min(Math.max(zoom.cy - span / 2, 0), W - span);
    return { x, y, span };
  }, [zoom]);

  const toPercent = (px: number, py: number) => ({
    x: vb.x + (px / size) * vb.span,
    y: vb.y + (py / size) * vb.span,
  });

  const handlePress = (px: number, py: number) => {
    const p = toPercent(px, py);
    let best: MapLocation | null = null;
    let bestD = Infinity;
    const tolerance = (vb.span / size) * 18; // 18px hit radius in percent units
    for (const l of locations) {
      const d = Math.hypot(l.x - p.x, l.y - p.y);
      if (d < bestD) { bestD = d; best = l; }
    }
    if (best && bestD <= tolerance) onSelect(best);
    else if (zoom.k === 1) setZoom({ cx: p.x, cy: p.y, k: 3 });
  };

  const r = zoom.k === 1 ? 0.55 : 0.9;
  const sel = selected ? locations.find((l) => l.slug === selected) : undefined;

  return (
    <View style={{ width: size, alignSelf: 'center', gap: 8 }}>
      <View
        style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden' }}
        onLayout={(e) => { layout.current = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y }; }}
      >
        <Svg width={size} height={size} viewBox={`${vb.x} ${vb.y} ${vb.span} ${vb.span}`}>
          <Rect x={0} y={0} width={W} height={W} fill={colors.surfaceLow} />
          <G>
            {locations.map((l) => (
              <Circle key={l.id} cx={l.x} cy={l.y} r={r} fill={typeColor(l.type)} opacity={l.status === 'verified' ? 0.95 : 0.35} />
            ))}
          </G>
          {areas.filter((a) => (zoom.k === 1 ? a.count >= 25 && !a.name.includes(',') : zoom.k >= 2)).map((a) => (
            <SvgText key={a.name} x={a.x} y={a.y} fontSize={zoom.k === 1 ? 2.6 : 1.4} fontWeight="700" fill={colors.text} opacity={0.9} textAnchor="middle" fontFamily="system-ui, -apple-system, Roboto, sans-serif">
              {a.name.replace(/, Vice City$/, '')}
            </SvgText>
          ))}
          {sel && (
            <>
              <Circle cx={sel.x} cy={sel.y} r={r * 4} fill={colors.text} opacity={0.2} />
              <Circle cx={sel.x} cy={sel.y} r={r * 1.8} fill={colors.text} stroke={colors.bg} strokeWidth={0.3} />
              <SvgText x={sel.x} y={sel.y - r * 3} fontSize={zoom.k === 1 ? 2.6 : 1.6} fontWeight="800" fill={colors.text} textAnchor="middle" fontFamily="system-ui, -apple-system, Roboto, sans-serif">
                {t(sel.name, lang)}
              </SvgText>
            </>
          )}
        </Svg>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(e) => handlePress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
          accessibilityLabel="map"
        />
      </View>
      <View style={styles.zoomRow}>
        <ZoomBtn label="−" onPress={() => setZoom((z) => ({ ...z, k: Math.max(1, z.k / 1.6) }))} />
        <ZoomBtn label="⌂" onPress={() => setZoom({ cx: 50, cy: 50, k: 1 })} />
        <ZoomBtn label="+" onPress={() => setZoom((z) => ({ ...z, k: Math.min(8, z.k * 1.6) }))} />
      </View>
    </View>
  );
}

function ZoomBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.zoomBtn} accessibilityLabel={`zoom ${label}`}>
      <SvgLabel label={label} />
    </Pressable>
  );
}

function SvgLabel({ label }: { label: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <SvgText x={10} y={14.5} fontSize={14} fontWeight="700" fill={colors.text} textAnchor="middle">{label}</SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  zoomRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  zoomBtn: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
