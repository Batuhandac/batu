import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

interface InfoBannerProps {
  title: string;
  message: string;
  onAction?: () => void;
}

export function InfoBanner({ title, message, onAction }: InfoBannerProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      onPress={onAction}
    >
      <Text style={styles.icon}>ℹ</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onAction && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(47,129,247,0.25)',
  },
  pressed: { opacity: 0.8 },
  icon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  chevron: {
    color: colors.primary,
    fontSize: 22,
    lineHeight: 22,
  },
});
