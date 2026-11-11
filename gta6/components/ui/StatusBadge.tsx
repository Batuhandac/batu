import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';
import type { ContentStatus } from '@/types';

const palette: Record<ContentStatus, { bg: string; fg: string }> = {
  verified: { bg: colors.successMuted, fg: colors.success },
  unverified: { bg: colors.warningMuted, fg: colors.warning },
  rumor: { bg: colors.infoMuted, fg: colors.info },
  debunked: { bg: colors.errorMuted, fg: colors.error },
};

export function StatusBadge({ status, size = 'sm' }: { status: ContentStatus; size?: 'sm' | 'md' }) {
  const lang = useSettings((s) => s.lang);
  const p = palette[status];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }, size === 'md' && styles.md]}>
      <View style={[styles.dot, { backgroundColor: p.fg }]} />
      <Text style={[styles.text, { color: p.fg }, size === 'md' && styles.textMd]}>{STRINGS.status[status][lang]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  md: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  textMd: { fontSize: fontSize.sm },
});
