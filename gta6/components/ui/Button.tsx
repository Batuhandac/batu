import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
}

export function Button({ label, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable {...rest} disabled={disabled} style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled, style]}>
      <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  label: { fontWeight: '700', fontSize: fontSize.md },
  label_primary: { color: colors.onPrimary },
  label_secondary: { color: colors.text },
  label_ghost: { color: colors.primary },
});
