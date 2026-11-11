import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { LeonidaMap } from '@/components/LeonidaMap';
import { colors, fontSize } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { MapLocation } from '@/types';

export default function MapScreen() {
  const lang = useSettings((s) => s.lang);
  const locations = useContent((s) => s.bundle.locations);
  const [selected, setSelected] = useState<MapLocation | null>(null);

  return (
    <Screen>
      <Header title={STRINGS.tabs.map[lang]} subtitle={lang === 'tr' ? 'Leonida eyaleti. Bölgeler, şehirler ve ilerledikçe koleksiyonlar.' : 'The state of Leonida. Regions, cities and collectibles as we go.'} />
      <LeonidaMap locations={locations} selected={selected?.slug} onSelect={setSelected} />
      {selected ? (
        <Card meta={selected.type} title={t(selected.name, lang)} subtitle={t(selected.description, lang)} status={selected.status} />
      ) : (
        <Text style={styles.hint}>{lang === 'tr' ? 'Bir konuma dokun.' : 'Tap a location.'}</Text>
      )}
      <Text style={styles.note}>{STRINGS.common.mapNote[lang]}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, textAlign: 'center' },
  note: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center', lineHeight: 17 },
});
