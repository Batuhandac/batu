import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PHOTOS, PhotoKey } from '@/content/media';
import type { ContentStatus } from '@/types';

interface CardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: ContentStatus;
  photo?: PhotoKey;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/** Dark card with a sunset edge. With `photo`, a thumbnail sits on the left. */
export function Card({ title, subtitle, meta, status, photo, onPress, style, children }: CardProps) {
  const body = (
    <>
      <LinearGradient colors={gradients.sunset} style={styles.edge} />
      {photo ? <Image source={PHOTOS[photo]} style={styles.thumb} contentFit="cover" transition={120} /> : null}
      <View style={styles.body}>
        {(meta || status) ? (
          <View style={styles.top}>
            {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : <View />}
            {status ? <StatusBadge status={status} /> : null}
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={styles.chev} /> : null}
    </>
  );
  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>{body}</Pressable>;
}

/** Photo tile with the label set over the image. Used for hubs and regions. */
export function PhotoTile({ photo, title, caption, onPress, style, height = 150 }: { photo: PhotoKey; title: string; caption?: string; onPress?: () => void; style?: ViewStyle; height?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, { height }, pressed && { opacity: 0.88 }, style]}>
      <Image source={PHOTOS[photo]} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <LinearGradient colors={gradients.card} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.tileText}>
        <Text style={styles.tileTitle} numberOfLines={2}>{title}</Text>
        {caption ? <Text style={styles.tileCaption} numberOfLines={1}>{caption}</Text> : null}
      </View>
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        <LinearGradient colors={gradients.sunset} style={styles.sectionBar} />
        <Text style={styles.section}>{title}</Text>
      </View>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={styles.action}>{action}</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', alignItems: 'stretch' },
  edge: { width: 4 },
  thumb: { width: 92 },
  body: { flex: 1, padding: spacing.lg, gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  meta: { flexShrink: 1, color: colors.textFaint, fontFamily: fonts.black, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: fonts.black, fontSize: 17, lineHeight: 22 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  chev: { alignSelf: 'center', marginRight: 10 },
  tile: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tileText: { position: 'absolute', left: 12, right: 12, bottom: 10, gap: 2 },
  tileTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 24, lineHeight: 28, textTransform: 'uppercase', letterSpacing: 0.4 },
  tileCaption: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionBar: { width: 4, height: 22, borderRadius: 2 },
  section: { color: colors.text, fontFamily: fonts.display, fontSize: 24, textTransform: 'uppercase', letterSpacing: 0.6 },
  action: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
});
