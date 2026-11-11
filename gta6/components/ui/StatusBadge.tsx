import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';
import type { ContentStatus } from '@/types';

const palette: Record<ContentStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  verified: { bg: colors.successMuted, fg: colors.success, icon: 'checkmark-circle' },
  unverified: { bg: colors.warningMuted, fg: colors.warning, icon: 'time' },
  rumor: { bg: colors.infoMuted, fg: colors.info, icon: 'chatbubble-ellipses' },
  debunked: { bg: colors.errorMuted, fg: colors.error, icon: 'close-circle' },
};

export function StatusBadge({ status, size = 'sm' }: { status: ContentStatus; size?: 'sm' | 'md' }) {
  const lang = useSettings((s) => s.lang);
  const p = palette[status];
  const md = size === 'md';
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }, md && styles.md]}>
      <Ionicons name={p.icon} size={md ? 15 : 12} color={p.fg} />
      <Text style={[styles.text, { color: p.fg }, md && styles.textMd]}>{STRINGS.status[status][lang]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  md: { paddingHorizontal: 12, paddingVertical: 6 },
  text: { fontFamily: fonts.black, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  textMd: { fontSize: 12 },
});
