import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius } from '@/constants/theme';

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.active, pressed && { opacity: 0.8 }]}>
      {active ? <LinearGradient colors={gradients.vice} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill} /> : null}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  active: { borderColor: 'transparent' },
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  label: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  labelActive: { color: '#fff' },
});
