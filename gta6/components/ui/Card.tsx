import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ContentStatus } from '@/types';

interface CardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: ContentStatus;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Card({ title, subtitle, meta, status, onPress, style, children }: CardProps) {
  const body = (
    <>
      <View style={styles.top}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : <View />}
        {status ? <StatusBadge status={status} /> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </>
  );
  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      {body}
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  meta: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  section: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  action: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
});
