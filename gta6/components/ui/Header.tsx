import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, back, right }: HeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back && (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surface },
  backText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  title: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: -0.3 },
  right: { marginLeft: 'auto' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 21 },
});
