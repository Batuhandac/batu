import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Paragraphs, StatusBanner } from '@/components/Detail';
import { t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function GuideDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lang = useSettings((s) => s.lang);
  const g = useContent((s) => s.bundle.guides.find((x) => x.slug === slug));
  if (!g) return <Screen><Header title="404" back /></Screen>;

  return (
    <Screen>
      <Header title={t(g.title, lang)} subtitle={t(g.summary, lang)} back />
      <StatusBanner status={g.status} updatedAt={g.updatedAt} />
      <Paragraphs items={g.body.map((p) => t(p, lang))} />
    </Screen>
  );
}
