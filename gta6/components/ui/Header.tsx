import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

interface HeaderProps { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode }

export function Header({ title, subtitle, back, right }: HeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back && (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={styles.back} accessibilityLabel="back">
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rule} />
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  title: { flex: 1, color: colors.text, fontFamily: fonts.display, fontSize: 38, lineHeight: 44, textTransform: 'uppercase', letterSpacing: 0.5 },
  right: { marginLeft: 'auto' },
  rule: { height: 4, width: 64, borderRadius: 2 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
});
