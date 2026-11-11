import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { GuideCategory } from '@/types';

const CATS: Array<GuideCategory | 'all'> = ['all', 'launch', 'money', 'weapons', 'vehicles', 'side', 'tricks'];

export default function Meta() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const guides = useContent((s) => s.bundle.guides);
  const [cat, setCat] = useState<GuideCategory | 'all'>('all');
  const list = useMemo(() => guides.filter((g) => cat === 'all' || g.category === cat), [guides, cat]);

  return (
    <Screen>
      <Header title={STRINGS.tabs.meta[lang]} subtitle={lang === 'tr' ? 'Para, silah, araç ve en hızlı ilerleme yolları.' : 'Money, weapons, vehicles and the fastest ways to progress.'} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATS.map((c) => (
          <Chip key={c} label={c === 'all' ? STRINGS.common.all[lang] : STRINGS.guideCategory[c][lang]} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>
      {list.map((g) => (
        <Card key={g.id} meta={STRINGS.guideCategory[g.category][lang]} title={t(g.title, lang)} subtitle={t(g.summary, lang)} status={g.status} onPress={() => router.push(`/guide/${g.slug}` as never)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ chips: { gap: spacing.sm, paddingRight: spacing.lg } });
