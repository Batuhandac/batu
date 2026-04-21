import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  style,
  contentStyle,
}: ScreenProps) {
  const inner = padded
    ? [styles.content, contentStyle]
    : [contentStyle];

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.container, style]} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={['top']}>
      <View style={inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
});
