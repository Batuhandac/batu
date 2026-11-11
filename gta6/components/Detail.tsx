import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';
import type { ContentStatus } from '@/types';

export function StatusBanner({ status, updatedAt }: { status: ContentStatus; updatedAt: string }) {
  const lang = useSettings((s) => s.lang);
  const d = new Date(updatedAt);
  const stamp = isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB');
  return (
    <View style={styles.banner}>
      <View style={styles.bannerTop}>
        <StatusBadge status={status} size="md" />
        {stamp ? <Text style={styles.stamp}>{stamp}</Text> : null}
      </View>
      <Text style={styles.hint}>{STRINGS.statusHint[status][lang]}</Text>
    </View>
  );
}

export function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {items.map((it, i) => (
        <View key={i} style={styles.bullet}>
          <View style={styles.dot} />
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

export function Paragraphs({ items }: { items: string[] }) {
  return <View style={styles.block}>{items.map((p, i) => <Text key={i} style={styles.para}>{p}</Text>)}</View>;
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  stamp: { color: colors.textFaint, fontFamily: fonts.semi, fontSize: 12 },
  block: { gap: spacing.md },
  blockTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 22, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  bullet: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginTop: 8 },
  bulletText: { flex: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  para: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
});
