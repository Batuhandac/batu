import React from 'react';
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/** Dark safe-area wrapper. On web the content column is capped so it reads well on desktop. */
export function Screen({ children, scrollable = true, style, contentStyle }: ScreenProps) {
  const inner = [styles.content, Platform.OS === 'web' && styles.webColumn, contentStyle];
  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.container, style]} edges={['top']}>
        <View style={inner}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.container, style]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={inner} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  webColumn: { maxWidth: 760, width: '100%', alignSelf: 'center' },
});
