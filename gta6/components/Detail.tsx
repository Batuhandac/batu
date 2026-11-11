import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
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
      <StatusBadge status={status} size="md" />
      <Text style={styles.hint}>{STRINGS.statusHint[status][lang]}</Text>
      {stamp ? <Text style={styles.stamp}>{STRINGS.common.updated[lang]}: {stamp}</Text> : null}
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
          <Text style={styles.dot}>•</Text>
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

export function Paragraphs({ items }: { items: string[] }) {
  return (
    <View style={styles.block}>
      {items.map((p, i) => (
        <Text key={i} style={styles.para}>{p}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  stamp: { color: colors.textFaint, fontSize: fontSize.xs },
  block: { gap: spacing.sm },
  blockTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800', marginTop: spacing.sm },
  bullet: { flexDirection: 'row', gap: spacing.sm },
  dot: { color: colors.primary, fontSize: fontSize.md, lineHeight: 22 },
  bulletText: { flex: 1, color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22 },
  para: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 23 },
});
