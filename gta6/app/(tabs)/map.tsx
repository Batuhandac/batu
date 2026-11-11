import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { LeonidaMap } from '@/components/LeonidaMap';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { SEED_AREAS } from '@/content/seed';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { MapLocation } from '@/types';

const GROUPS: Array<{ key: string; types: MapLocation['type'][]; tr: string; en: string }> = [
  { key: 'all', types: [], tr: 'Tümü', en: 'All' },
  { key: 'places', types: ['commercial', 'hotel', 'restaurant', 'entertainment', 'leisure', 'shop'], tr: 'Mekanlar', en: 'Places' },
  { key: 'transport', types: ['transport', 'infrastructure'], tr: 'Ulaşım', en: 'Transport' },
  { key: 'civic', types: ['government', 'public', 'industrial', 'safehouse', 'service'], tr: 'Kamu & Sanayi', en: 'Civic & Industry' },
  { key: 'nature', types: ['nature', 'landmark', 'region', 'city'], tr: 'Doğa & Simge', en: 'Nature & Landmarks' },
  { key: 'homes', types: ['residential'], tr: 'Konut', en: 'Residential' },
];

export default function MapScreen() {
  const lang = useSettings((s) => s.lang);
  const locations = useContent((s) => s.bundle.locations);
  const [selected, setSelected] = useState<MapLocation | null>(null);
  const [group, setGroup] = useState('all');
  const [namedOnly, setNamedOnly] = useState(true);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group);
    const types = g && g.types.length ? new Set(g.types) : null;
    const needle = q.trim().toLowerCase();
    return locations.filter((l) =>
      (!namedOnly || l.status === 'verified') &&
      (!types || types.has(l.type)) &&
      (!needle || t(l.name, lang).toLowerCase().includes(needle) || (l.area ?? '').toLowerCase().includes(needle)),
    );
  }, [locations, group, namedOnly, q, lang]);

  const results = q.trim() ? filtered.slice(0, 12) : [];

  return (
    <Screen>
      <Header title={STRINGS.tabs.map[lang]} subtitle={`${filtered.length} ${STRINGS.map.count[lang]} · Leonida`} />
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={STRINGS.map.search[lang]}
        placeholderTextColor={colors.textFaint}
        style={styles.search}
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={STRINGS.map.namedOnly[lang]} active={namedOnly} onPress={() => setNamedOnly(!namedOnly)} />
        {GROUPS.map((g) => (
          <Chip key={g.key} label={lang === 'tr' ? g.tr : g.en} active={group === g.key} onPress={() => setGroup(g.key)} />
        ))}
      </ScrollView>
      {results.length > 0 && (
        <View style={styles.results}>
          {results.map((l) => (
            <Text key={l.id} style={styles.result} onPress={() => { setSelected(l); setQ(''); }}>
              {t(l.name, lang)} <Text style={styles.resultArea}>· {l.area}</Text>
            </Text>
          ))}
        </View>
      )}
      <LeonidaMap locations={filtered} areas={SEED_AREAS} selected={selected?.slug} onSelect={setSelected} />
      {selected ? (
        <Card meta={`${selected.area ?? ''} · ${selected.type}`} title={t(selected.name, lang)} subtitle={t(selected.description, lang)} status={selected.status} />
      ) : (
        <Text style={styles.hint}>{lang === 'tr' ? 'Bir noktaya dokun. Boş yere dokununca yakınlaşır.' : 'Tap a point. Tapping empty space zooms in.'}</Text>
      )}
      <Text style={styles.note}>{STRINGS.map.attribution[lang]}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  results: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 4 },
  result: { color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 8, fontSize: fontSize.sm },
  resultArea: { color: colors.textFaint },
  hint: { color: colors.textMuted, textAlign: 'center' },
  note: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center', lineHeight: 17 },
});
