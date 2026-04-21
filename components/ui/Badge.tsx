import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'ghost';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  primary: { backgroundColor: colors.primaryMuted },
  success: { backgroundColor: colors.successMuted },
  warning: { backgroundColor: colors.warningMuted },
  error: { backgroundColor: colors.errorMuted },
  neutral: { backgroundColor: colors.surfaceAlt },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  text_primary: { color: colors.primary },
  text_success: { color: colors.success },
  text_warning: { color: colors.warning },
  text_error: { color: colors.error },
  text_neutral: { color: colors.textMuted },
  text_ghost: { color: colors.textMuted },
});
