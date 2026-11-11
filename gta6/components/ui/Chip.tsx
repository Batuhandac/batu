import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.active, pressed && styles.pressed]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  labelActive: { color: colors.primary },
});
