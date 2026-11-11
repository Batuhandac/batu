import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradients, radius } from '@/constants/theme';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function Button({ label, variant = 'primary', icon, style, ...rest }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable {...rest} style={({ pressed }) => [styles.base, !primary && styles.secondary, pressed && { opacity: 0.85 }, style]}>
      {primary ? <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
      {icon ? <Ionicons name={icon} size={18} color={primary ? colors.onPrimary : colors.text} /> : null}
      <Text style={[styles.label, { color: primary ? colors.onPrimary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 14, overflow: 'hidden' },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong },
  label: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' },
});
