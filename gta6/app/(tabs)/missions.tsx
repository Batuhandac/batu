import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function Missions() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const missions = useContent((s) => s.bundle.missions);

  return (
    <Screen>
      <Header title={STRINGS.tabs.missions[lang]} subtitle={lang === 'tr' ? 'Altın madalya şartları, görev atlama ve taktikler.' : 'Gold requirements, skipping and tactics.'} />
      {missions.length === 0 && (
        <>
          <Text style={styles.empty}>{STRINGS.common.emptyMissions[lang]}</Text>
          <Card title={lang === 'tr' ? 'Görev atlama nasıl çalışır?' : 'How mission skipping works'} subtitle={lang === 'tr' ? 'GTA V sistemi ve GTA VI beklentisi.' : 'The GTA V system and what to expect.'} onPress={() => router.push('/guide/mission-skip-explained')} />
        </>
      )}
      {[...missions].sort((a, b) => a.order - b.order).map((m) => (
        <Card
          key={m.id}
          meta={`#${m.order} · ${STRINGS.protagonist[m.protagonist][lang]} · ${t(m.chapter, lang)}`}
          title={t(m.title, lang)}
          subtitle={t(m.summary, lang)}
          status={m.status}
          onPress={() => router.push(`/mission/${m.slug}` as never)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg, lineHeight: 21 },
});
