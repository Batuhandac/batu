import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Section } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Paragraphs, StatusBanner } from '@/components/Detail';
import { STRINGS, t } from '@/constants/i18n';
import { GUIDE_PHOTO } from '@/content/media';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function GuideDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lang = useSettings((s) => s.lang);
  const g = useContent((s) => s.bundle.guides.find((x) => x.slug === slug));
  if (!g) return <Screen><Header title="404" back /></Screen>;
  return (
    <Screen bleed>
      <PhotoHeader photo={GUIDE_PHOTO[g.category]} title={t(g.title, lang)} eyebrow={STRINGS.guideCategory[g.category][lang]} subtitle={t(g.summary, lang)} height={300} back />
      <Section>
        <StatusBanner status={g.status} updatedAt={g.updatedAt} />
        <Paragraphs items={g.body.map((p) => t(p, lang))} />
      </Section>
    </Screen>
  );
}
