import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Section } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/Card';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { PhotoKey } from '@/content/media';
import { REGIONS } from '@/content/regions';
import { toWorld } from '@/lib/mapgeo';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function RegionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const locations = useContent((s) => s.bundle.locations);
  const region = REGIONS.find((r) => r.id === id);
  const inRegion = useMemo(() => (region ? locations.filter((l) => l.area && region.match.includes(l.area)) : []), [locations, region]);
  const named = useMemo(() => inRegion.filter((l) => l.status === 'verified').sort((a, b) => t(a.name, lang).localeCompare(t(b.name, lang))), [inRegion, lang]);
  if (!region) return <Screen><Header title="404" back /></Screen>;

  const openMap = (extra?: { x: number; y: number; z: number; sel?: string }) => {
    const v = extra ?? region.view;
    router.push({ pathname: '/map', params: { x: String(v.x), y: String(v.y), z: String(v.z), ...(extra?.sel ? { sel: extra.sel } : {}) } } as never);
  };

  return (
    <Screen bleed>
      <PhotoHeader photo={region.photo as PhotoKey} title={region.name} eyebrow={t(region.tagline, lang)} height={340} back />
      <Section>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNum}>{inRegion.length}</Text><Text style={styles.statLabel}>{STRINGS.map.count[lang]}</Text></View>
          <View style={styles.stat}><Text style={[styles.statNum, { color: colors.success }]}>{named.length}</Text><Text style={styles.statLabel}>{STRINGS.status.verified[lang]}</Text></View>
        </View>
        <Text style={styles.desc}>{t(region.description, lang)}</Text>
        <Button label={STRINGS.map.openMap[lang]} icon="map" onPress={() => openMap()} />
      </Section>
      {named.length > 0 ? (
        <Section>
          <SectionTitle title={STRINGS.map.places[lang]} />
          <View style={styles.list}>
            {named.slice(0, 60).map((l) => {
              const w = toWorld(l);
              return (
                <Pressable key={l.id} onPress={() => openMap({ x: w.wx, y: w.wy, z: 4.6, sel: l.id })} style={styles.row}>
                  <Ionicons name="location" size={15} color={colors.primary} />
                  <Text style={styles.rowName} numberOfLines={1}>{t(l.name, lang)}</Text>
                  <Text style={styles.rowType} numberOfLines={1}>{l.type}</Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.textFaint} />
                </Pressable>
              );
            })}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statNum: { color: colors.text, fontFamily: fonts.display, fontSize: 40, lineHeight: 46 },
  statLabel: { color: colors.textFaint, fontFamily: fonts.black, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  desc: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowName: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  rowType: { color: colors.textFaint, fontFamily: fonts.semi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
});
