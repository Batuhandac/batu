import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Countdown } from '@/components/Countdown';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function Home() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const bundle = useContent((s) => s.bundle);

  const verified = bundle.cheats.filter((c) => c.status === 'verified').length;
  const stats: Array<[number, string, string]> = [
    [verified, lang === 'tr' ? 'doğrulanmış hile' : 'verified cheats', '/cheats'],
    [bundle.missions.length, lang === 'tr' ? 'görev rehberi' : 'mission guides', '/missions'],
    [bundle.guides.length, lang === 'tr' ? 'meta rehber' : 'meta guides', '/meta'],
  ];

  return (
    <Screen>
      <Header
        title={STRINGS.appName[lang]}
        subtitle={STRINGS.tagline[lang]}
        right={
          <Pressable onPress={() => router.push('/settings')} style={styles.gear} hitSlop={8}>
            <Text style={styles.gearText}>{lang.toUpperCase()}</Text>
          </Pressable>
        }
      />
      <Countdown />

      <View style={styles.statsRow}>
        {stats.map(([n, label, href]) => (
          <Pressable key={label} style={styles.stat} onPress={() => router.push(href as never)}>
            <Text style={styles.statNum}>{n}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Card title={STRINGS.common.howVerify[lang]} subtitle={STRINGS.common.howVerifyBody[lang]} onPress={() => router.push('/guide/how-we-verify')} />

      <SectionTitle title={STRINGS.common.latest[lang]} />
      {bundle.updates.map((u) => (
        <Card
          key={u.id}
          meta={u.kind}
          title={t(u.title, lang)}
          subtitle={t(u.body, lang)}
          onPress={u.href ? () => router.push(u.href as never) : undefined}
        />
      ))}

      {bundle.source !== 'remote' && <Text style={styles.offline}>{STRINGS.common.offline[lang]}</Text>}
      <Pressable onPress={() => router.push('/legal')}>
        <Text style={styles.legal}>{STRINGS.common.legal[lang]}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gear: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  gearText: { color: colors.text, fontWeight: '800', fontSize: fontSize.xs, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 2 },
  statNum: { color: colors.accent, fontSize: fontSize.xxl, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  offline: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center' },
  legal: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center', textDecorationLine: 'underline' },
});
