import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/ui/Chip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MapLabel, MapPoint, TileMap, TileMapHandle } from '@/components/TileMap';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { PHOTOS, PhotoKey } from '@/content/media';
import { REGIONS, regionForArea } from '@/content/regions';
import { TileStyle, toWorld } from '@/lib/mapgeo';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { MapLocation } from '@/types';

const GROUPS: Array<{ key: string; types: MapLocation['type'][]; tr: string; en: string; color: string }> = [
  { key: 'all', types: [], tr: 'Tümü', en: 'All', color: colors.accent },
  { key: 'places', types: ['commercial', 'hotel', 'restaurant', 'entertainment', 'leisure', 'shop'], tr: 'Mekanlar', en: 'Places', color: colors.primary },
  { key: 'transport', types: ['transport', 'infrastructure'], tr: 'Ulaşım', en: 'Transport', color: colors.info },
  { key: 'civic', types: ['government', 'public', 'industrial', 'safehouse', 'service'], tr: 'Kamu & Sanayi', en: 'Civic & Industry', color: colors.yellow },
  { key: 'nature', types: ['nature', 'landmark', 'region', 'city'], tr: 'Doğa & Simge', en: 'Nature & Landmarks', color: colors.success },
  { key: 'homes', types: ['residential'], tr: 'Konut', en: 'Residential', color: colors.purple },
];
const colorFor = (type: MapLocation['type']) => GROUPS.find((g) => g.types.includes(type))?.color ?? colors.accent;

const LABELS: MapLabel[] = REGIONS.map((r) => ({ name: r.name, x: r.view.x, y: r.view.y, minZ: ['hamlet', 'airport'].includes(r.id) ? 1.5 : undefined }));

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const lang = useSettings((s) => s.lang);
  const locations = useContent((s) => s.bundle.locations);
  const params = useLocalSearchParams<{ x?: string; y?: string; z?: string; sel?: string }>();
  const map = useRef<TileMapHandle>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [group, setGroup] = useState('all');
  const [namedOnly, setNamedOnly] = useState(true);
  const [tileStyle, setTileStyle] = useState<TileStyle>('yanis');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    const types = g && g.types.length ? new Set(g.types) : null;
    return locations.filter((l) => (!namedOnly || l.status === 'verified') && (!types || types.has(l.type)));
  }, [locations, group, namedOnly]);

  const points: MapPoint[] = useMemo(() => filtered.map((l) => {
    const w = toWorld(l);
    return { id: l.id, wx: w.wx, wy: w.wy, name: t(l.name, lang), verified: l.status === 'verified', color: colorFor(l.type) };
  }), [filtered, lang]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return locations.filter((l) => l.status === 'verified' && (t(l.name, lang).toLowerCase().includes(needle) || (l.area ?? '').toLowerCase().includes(needle))).slice(0, 8);
  }, [q, locations, lang]);

  const selected = selectedId ? locations.find((l) => l.id === selectedId) ?? null : null;
  const region = regionForArea(selected?.area);

  const focus = (l: MapLocation, z = 4.6) => {
    const w = toWorld(l);
    setSelectedId(l.id); setQ('');
    map.current?.flyTo({ x: w.wx, y: w.wy, z });
  };

  // Deep link from a region page: /map?x=..&y=..&z=..[&sel=id]
  useEffect(() => {
    if (!params.x || !params.y) return;
    const id = setTimeout(() => {
      map.current?.flyTo({ x: Number(params.x), y: Number(params.y), z: Number(params.z ?? 3) });
      if (params.sel) setSelectedId(String(params.sel));
    }, 60);
    return () => clearTimeout(id);
  }, [params.x, params.y, params.z, params.sel]);

  return (
    <View style={styles.root}>
      <TileMap ref={map} points={points} labels={LABELS} tileStyle={tileStyle} selectedId={selectedId} onSelect={setSelectedId} />

      <View style={[styles.top, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={colors.textFaint} />
            <TextInput value={q} onChangeText={setQ} placeholder={STRINGS.map.search[lang]} placeholderTextColor={colors.textFaint} style={styles.input} autoCorrect={false} />
            {q ? <Pressable onPress={() => setQ('')} hitSlop={8}><Ionicons name="close-circle" size={16} color={colors.textFaint} /></Pressable> : null}
          </View>
          <Pressable onPress={() => setTileStyle(tileStyle === 'yanis' ? 'dupzor' : 'yanis')} style={styles.iconBtn} accessibilityLabel="map style">
            <Ionicons name={tileStyle === 'yanis' ? 'color-palette-outline' : 'moon-outline'} size={19} color={colors.text} />
          </Pressable>
        </View>
        {results.length > 0 ? (
          <View style={styles.results}>
            {results.map((l) => (
              <Pressable key={l.id} onPress={() => focus(l)} style={styles.result}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.resultName} numberOfLines={1}>{t(l.name, lang)}</Text>
                <Text style={styles.resultArea} numberOfLines={1}>{l.area}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label={`${STRINGS.map.namedOnly[lang]} · ${filtered.length}`} active={namedOnly} onPress={() => setNamedOnly(!namedOnly)} />
            {GROUPS.map((g) => <Chip key={g.key} label={lang === 'tr' ? g.tr : g.en} active={group === g.key} onPress={() => setGroup(g.key)} />)}
          </ScrollView>
        )}
      </View>

      <View style={[styles.zoom, { bottom: selected ? 132 : 28 }]}>
        <Pressable style={styles.iconBtn} onPress={() => map.current?.zoomBy(1)} accessibilityLabel="zoom in"><Ionicons name="add" size={22} color={colors.text} /></Pressable>
        <Pressable style={styles.iconBtn} onPress={() => map.current?.zoomBy(-1)} accessibilityLabel="zoom out"><Ionicons name="remove" size={22} color={colors.text} /></Pressable>
        <Pressable style={styles.iconBtn} onPress={() => { setSelectedId(null); map.current?.reset(); }} accessibilityLabel="reset view"><Ionicons name="scan-outline" size={19} color={colors.text} /></Pressable>
      </View>

      <Text style={[styles.credit, { bottom: selected ? 126 : 8 }]}>{STRINGS.map.attribution[lang]}</Text>

      {selected ? (
        <View style={styles.sheet}>
          {region ? <Image source={PHOTOS[region.photo as PhotoKey]} style={styles.sheetImg} contentFit="cover" /> : <View style={[styles.sheetImg, styles.sheetImgEmpty]}><Ionicons name="location" size={26} color={colors.primary} /></View>}
          <View style={styles.sheetBody}>
            <Text style={styles.sheetMeta} numberOfLines={1}>{selected.area} · {selected.type}</Text>
            <Text style={styles.sheetTitle} numberOfLines={2}>{t(selected.name, lang)}</Text>
            <StatusBadge status={selected.status} />
          </View>
          <Pressable onPress={() => setSelectedId(null)} hitSlop={10} style={styles.sheetClose} accessibilityLabel="close"><Ionicons name="close" size={18} color={colors.textMuted} /></Pressable>
        </View>
      ) : null}
    </View>
  );
}

const glass = { backgroundColor: 'rgba(11,8,19,0.88)', borderWidth: 1, borderColor: colors.borderStrong } as const;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 44, borderRadius: radius.full, ...glass },
  input: { flex: 1, color: colors.text, fontFamily: fonts.semi, fontSize: 15, paddingVertical: 0, outlineStyle: 'none' } as object,
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...glass },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  results: { marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', ...glass },
  result: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  resultName: { flexShrink: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  resultArea: { flex: 1, textAlign: 'right', color: colors.textFaint, fontFamily: fonts.semi, fontSize: 12 },
  zoom: { position: 'absolute', right: spacing.lg, gap: 8 },
  credit: { position: 'absolute', left: spacing.lg, color: 'rgba(255,255,255,0.55)', fontFamily: fonts.semi, fontSize: 9.5 },
  sheet: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, flexDirection: 'row', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: 'rgba(18,14,28,0.97)', borderWidth: 1, borderColor: colors.borderStrong, minHeight: 104 },
  sheetImg: { width: 104 },
  sheetImgEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  sheetBody: { flex: 1, padding: 12, gap: 5, justifyContent: 'center' },
  sheetMeta: { color: colors.textFaint, fontFamily: fonts.black, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  sheetTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 22, lineHeight: 26, textTransform: 'uppercase' },
  sheetClose: { position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
});
