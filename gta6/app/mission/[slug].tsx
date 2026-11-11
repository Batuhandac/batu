import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Bullets, Paragraphs, StatusBanner } from '@/components/Detail';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function MissionDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lang = useSettings((s) => s.lang);
  const m = useContent((s) => s.bundle.missions.find((x) => x.slug === slug));
  if (!m) return <Screen><Header title="404" back /></Screen>;

  return (
    <Screen>
      <Header title={`#${m.order} ${t(m.title, lang)}`} subtitle={`${STRINGS.protagonist[m.protagonist][lang]} · ${t(m.chapter, lang)}`} back />
      <StatusBanner status={m.status} updatedAt={m.updatedAt} />
      <Paragraphs items={[t(m.summary, lang)]} />
      <Bullets title={STRINGS.common.gold[lang]} items={m.goldRequirements.map((x) => t(x, lang))} />
      <Bullets title={STRINGS.common.skip[lang]} items={m.skipTips.map((x) => t(x, lang))} />
      <Bullets title={STRINGS.common.tips[lang]} items={m.tips.map((x) => t(x, lang))} />
    </Screen>
  );
}
