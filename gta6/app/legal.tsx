import React from 'react';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Paragraphs } from '@/components/Detail';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';

export default function Legal() {
  const lang = useSettings((s) => s.lang);
  return (
    <Screen>
      <Header title={STRINGS.common.legal[lang]} back />
      <Paragraphs items={[STRINGS.common.legalBody[lang]]} />
    </Screen>
  );
}
