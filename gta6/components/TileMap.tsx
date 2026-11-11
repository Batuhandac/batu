import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, fonts } from '@/constants/theme';
import { BUNDLED_MAX_Z, HALF, MAX_Z, TileStyle, WORLD, pxPerMeter, tileSource } from '@/lib/mapgeo';

export interface MapPoint { id: string; wx: number; wy: number; name: string; verified: boolean; color: string }
export interface MapLabel { name: string; x: number; y: number; minZ?: number }
export interface MapViewState { x: number; y: number; z: number }
export interface TileMapHandle { flyTo: (v: MapViewState) => void; zoomBy: (dz: number) => void; reset: () => void }

interface Props {
  points: MapPoint[];
  labels?: MapLabel[];
  tileStyle: TileStyle;
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
}

const MAX_VIEW_Z = 6.5;
/** Painted extent of the tile pyramid in metres (west edge trimmed to skip most of the legend panel). */
const COVER = { minX: -11200, maxX: 3584, minY: -8064, maxY: 12032 };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Slippy map over the community Leonida tiles. Pan and pinch move an Animated layer without
 * re-rendering; the view state commits when the gesture ends and the layer snaps back to identity.
 */
export const TileMap = forwardRef<TileMapHandle, Props>(function TileMap({ points, labels = [], tileStyle, selectedId, onSelect }, ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<MapViewState | null>(null);
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;
  const hostRef = useRef<View>(null);

  // The tiles only paint a rectangle of the world; keep the viewport inside it so no empty canvas shows.
  const fit = useMemo(() => {
    if (!size.w) return { x: -2350, y: 1984, z: 0 };
    const z = Math.log2(32 * Math.max(size.h / (COVER.maxY - COVER.minY), size.w / (COVER.maxX - COVER.minX)));
    return { x: -2350, y: (COVER.minY + COVER.maxY) / 2, z };
  }, [size]);
  const minZ = fit.z;

  const normalize = useCallback((v: MapViewState): MapViewState => {
    const z = clamp(v.z, minZ, MAX_VIEW_Z); const s = pxPerMeter(z);
    const hw = size.w / 2 / s; const hh = size.h / 2 / s;
    const within = (val: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : clamp(val, lo, hi));
    return { x: within(v.x, COVER.minX + hw, COVER.maxX - hw), y: within(v.y, COVER.minY + hh, COVER.maxY - hh), z };
  }, [minZ, size]);

  useEffect(() => { if (size.w && !view) setView(normalize(fit)); }, [size, fit, view, normalize]);

  useImperativeHandle(ref, () => ({
    flyTo: (v) => setView(normalize(v)),
    zoomBy: (dz) => setView((v) => (v ? normalize({ ...v, z: v.z + dz }) : v)),
    reset: () => setView(normalize(fit)),
  }), [normalize, fit]);

  // After a committed view renders, drop the gesture transform back to identity.
  useLayoutEffect(() => { tx.setValue(0); ty.setValue(0); sc.setValue(1); }, [view, tx, ty, sc]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) > 1 || Math.abs(height - size.h) > 1) setSize({ w: width, h: height });
  };

  const viewRef = useRef(view); viewRef.current = view;
  const pointsRef = useRef(points); pointsRef.current = points;

  const handleTap = useCallback((px: number, py: number) => {
    const v = viewRef.current; if (!v) return;
    const s = pxPerMeter(v.z);
    let best: MapPoint | null = null; let bestD = 26;
    for (const p of pointsRef.current) {
      const d = Math.hypot(size.w / 2 + (p.wx - v.x) * s - px, size.h / 2 - (p.wy - v.y) * s - py);
      if (d < bestD) { bestD = d; best = p; }
    }
    onSelect(best ? best.id : null);
  }, [size, onSelect]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan().minDistance(3).runOnJS(true)
      .onUpdate((e) => { tx.setValue(e.translationX); ty.setValue(e.translationY); })
      .onEnd((e) => setView((v) => { if (!v) return v; const s = pxPerMeter(v.z); return normalize({ ...v, x: v.x - e.translationX / s, y: v.y + e.translationY / s }); }));
    const pinch = Gesture.Pinch().runOnJS(true)
      .onUpdate((e) => sc.setValue(e.scale))
      .onEnd((e) => setView((v) => (v ? normalize({ ...v, z: v.z + Math.log2(Math.max(0.1, e.scale)) }) : v)));
    const tap = Gesture.Tap().maxDistance(8).runOnJS(true).onEnd((e, ok) => { if (ok) handleTap(e.x, e.y); });
    return Gesture.Simultaneous(pan, pinch, tap);
  }, [tx, ty, sc, normalize, handleTap]);

  // Mouse wheel zoom on web, anchored at the cursor.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = hostRef.current as unknown as HTMLElement | null;
    if (!el || !el.addEventListener) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = ev.clientX - rect.left - rect.width / 2; const py = ev.clientY - rect.top - rect.height / 2;
      setView((v) => {
        if (!v) return v;
        const z2 = clamp(v.z - ev.deltaY * 0.0025, minZ, MAX_VIEW_Z);
        const s1 = pxPerMeter(v.z); const s2 = pxPerMeter(z2);
        return normalize({ x: v.x + px / s1 - px / s2, y: v.y - py / s1 + py / s2, z: z2 });
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [minZ, normalize]);

  const layer = useMemo(() => {
    if (!view || !size.w) return null;
    const { w, h } = size; const s = pxPerMeter(view.z);
    const zi = clamp(Math.ceil(view.z - 0.15), 0, MAX_Z);
    const zBase = Math.min(zi, BUNDLED_MAX_Z[tileStyle]);
    const tiles: React.ReactNode[] = [];
    const addLayer = (z: number, margin: number, keyPrefix: string) => {
      const tw = WORLD / Math.pow(2, z);
      const left = view.x - (w * (0.5 + margin)) / s; const right = view.x + (w * (0.5 + margin)) / s;
      const top = view.y + (h * (0.5 + margin)) / s; const bottom = view.y - (h * (0.5 + margin)) / s;
      const x0 = Math.floor((left + HALF) / tw); const x1 = Math.floor((right + HALF) / tw);
      const y0 = Math.floor((HALF - top) / tw); const y1 = Math.floor((HALF - bottom) / tw);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const src = tileSource(tileStyle, z, x, y); if (!src) continue;
        tiles.push(
          <Image key={`${keyPrefix}${z}_${y}_${x}`} source={src} contentFit="fill" cachePolicy="memory-disk"
            style={{ position: 'absolute', left: w / 2 + (x * tw - HALF - view.x) * s, top: h / 2 + (y * tw - (HALF - view.y)) * s, width: tw * s + 0.6, height: tw * s + 0.6 }} />,
        );
      }
    };
    addLayer(zBase, 0.5, `${tileStyle}b`);
    if (zi > zBase) addLayer(zi, 0.15, `${tileStyle}r`);

    const dot = view.z < 1 ? 5 : view.z < 2.5 ? 7 : view.z < 4 ? 10 : 13;
    const visible = points.filter((p) => {
      const sx = w / 2 + (p.wx - view.x) * s; const sy = h / 2 - (p.wy - view.y) * s;
      return sx > -w * 0.4 && sx < w * 1.4 && sy > -h * 0.4 && sy < h * 1.4;
    });
    const showNames = view.z >= 3.4;
    // Greedy label placement: selected first, then verified; skip any label that would overlap one already placed.
    const placed: Array<[number, number, number, number]> = [];
    const canPlace = (cx: number, top: number, name: string, fs: number) => {
      const wLabel = Math.min(160, name.length * fs * 0.58 + 10); const box: [number, number, number, number] = [cx - wLabel / 2, top, cx + wLabel / 2, top + fs + 5];
      if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return false;
      placed.push(box); return true;
    };
    for (const p of visible) { const sx = w / 2 + (p.wx - view.x) * s; const sy = h / 2 - (p.wy - view.y) * s; placed.push([sx - dot / 2, sy - dot / 2, sx + dot / 2, sy + dot / 2]); }
    const ordered = [...visible.slice(0, 700)].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || Number(b.verified) - Number(a.verified));
    const dots = ordered.map((p) => {
      const sx = w / 2 + (p.wx - view.x) * s; const sy = h / 2 - (p.wy - view.y) * s;
      const sel = p.id === selectedId;
      const d = sel ? dot + 8 : dot;
      const label = (sel || showNames) && canPlace(sx, sy + d / 2 + 2, p.name, sel ? 13 : 10.5);
      return (
        <React.Fragment key={p.id}>
          {sel ? <View style={[styles.halo, { left: sx - 22, top: sy - 22 }]} /> : null}
          <View style={{ position: 'absolute', left: sx - d / 2, top: sy - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: sel ? '#fff' : p.color, opacity: p.verified || sel ? 1 : 0.5, borderWidth: d > 6 ? 1.5 : 0, borderColor: sel ? colors.primary : 'rgba(7,5,13,0.85)', zIndex: sel ? 3 : 1 }} />
          {label ? <Text numberOfLines={1} style={[styles.pointName, sel && styles.pointNameSel, { left: sx - 80, top: sy + d / 2 + 2 }]}>{p.name}</Text> : null}
        </React.Fragment>
      );
    });
    const regionLabels = view.z < 2.7 ? labels.filter((l) => view.z >= (l.minZ ?? -9)).map((l) => {
      const sx = w / 2 + (l.x - view.x) * s; const sy = h / 2 - (l.y - view.y) * s;
      return <Text key={l.name} style={[styles.region, { left: sx - 90, top: sy - 10, fontSize: view.z < 0.8 ? 12 : 15 }]} numberOfLines={1}>{l.name}</Text>;
    }) : null;
    return <>{tiles}{dots}{regionLabels}</>;
  }, [view, size, points, labels, tileStyle, selectedId]);

  return (
    <GestureDetector gesture={gesture}>
      <View ref={hostRef} style={[styles.host, { backgroundColor: tileStyle === 'yanis' ? '#37484F' : '#445A84' }]} onLayout={onLayout} collapsable={false}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }]} pointerEvents="none">
          {layer}
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

const shadow = { textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } };
const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: '#000', overflow: 'hidden', ...(Platform.OS === 'web' ? ({ cursor: 'grab', touchAction: 'none', userSelect: 'none' } as object) : null) },
  halo: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,45,138,0.28)', borderWidth: 1.5, borderColor: colors.primary },
  pointName: { position: 'absolute', width: 160, textAlign: 'center', color: colors.text, fontFamily: fonts.bold, fontSize: 10.5, ...shadow },
  pointNameSel: { fontSize: 13, fontFamily: fonts.black, color: '#fff' },
  region: { position: 'absolute', zIndex: 5, width: 180, textAlign: 'center', color: '#fff', fontFamily: fonts.display, letterSpacing: 1.6, textTransform: 'uppercase', ...shadow },
});
