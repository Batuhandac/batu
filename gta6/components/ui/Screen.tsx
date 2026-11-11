import React from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  /** Full-bleed: no top inset and no padding, so a photo header can run under the status bar. */
  bleed?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scrollable = true, bleed = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = bleed ? { paddingBottom: spacing.xxxl } : { padding: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg };
  const inner = [pad, Platform.OS === 'web' && styles.webColumn, contentStyle];
  if (!scrollable) return <View style={[styles.container, Platform.OS === 'web' && styles.webColumn]}>{children}</View>;
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={inner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

/** Horizontal padding wrapper for sections inside a bleed screen. */
export function Section({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.section, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  webColumn: { maxWidth: 760, width: '100%', alignSelf: 'center' },
  section: { paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.xl },
});
