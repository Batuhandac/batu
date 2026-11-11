import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Section } from '@/components/ui/Screen';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Card, PhotoTile } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { GameSwitch } from '@/components/GameSwitch';
import { spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { GUIDE_PHOTO } from '@/content/media';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { GuideCategory } from '@/types';

const CATS: Array<GuideCategory | 'all'> = ['all', 'launch', 'money', 'weapons', 'vehicles', 'side', 'tricks'];

export default function Meta() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const game = useSettings((s) => s.game);
  const allGuides = useContent((s) => s.bundle.guides);
  const [cat, setCat] = useState<GuideCategory | 'all'>('all');
  const list = useMemo(() => allGuides.filter((g) => g.game === game && (cat === 'all' || g.category === cat)), [allGuides, game, cat]);
  const tr = lang === 'tr';

  return (
    <Screen bleed>
      <PhotoHeader photo="vc_gas" title={STRINGS.tabs.meta[lang]} eyebrow={tr ? 'Para · silah · araç · taktik' : 'Money · weapons · vehicles · tricks'} right={<GameSwitch />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATS.map((c) => <Chip key={c} label={c === 'all' ? STRINGS.common.all[lang] : STRINGS.guideCategory[c][lang]} active={cat === c} onPress={() => setCat(c)} />)}
      </ScrollView>
      <Section style={{ marginTop: spacing.md }}>
        <PhotoTile photo="sunset_tree" title={STRINGS.glossary.title[lang]} caption={tr ? 'İngilizce terimler, Türkçe açıklama' : 'Game terms explained'} onPress={() => router.push('/glossary')} height={130} />
        {list.map((g) => (
          <Card key={g.id} photo={GUIDE_PHOTO[g.category]} meta={STRINGS.guideCategory[g.category][lang]} title={t(g.title, lang)} subtitle={t(g.summary, lang)} status={g.status} onPress={() => router.push(`/guide/${g.slug}` as never)} />
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({ chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md } });
