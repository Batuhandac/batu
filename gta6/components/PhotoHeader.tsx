import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients, spacing } from '@/constants/theme';
import { PHOTOS, PhotoKey } from '@/content/media';

interface Props {
  photo: PhotoKey;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  height?: number;
  back?: boolean;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

/** Full-bleed photo band with a sunset rule, condensed title and optional controls. */
export function PhotoHeader({ photo, title, eyebrow, subtitle, height = 230, back, right, children }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ height: height + insets.top }}>
      <Image source={PHOTOS[photo]} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <LinearGradient colors={gradients.scrimTop} style={[styles.top, { height: insets.top + 70 }]} />
      <LinearGradient colors={gradients.scrim} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.bar, { top: insets.top + 8 }]}>
        {back ? (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.round} hitSlop={10} accessibilityLabel="back">
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
        ) : <View />}
        {right ?? <View />}
      </View>
      <View style={styles.bottom}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{title}</Text>
        <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rule} />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0 },
  bar: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  round: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(7,5,13,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  bottom: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.md, gap: 6 },
  eyebrow: { color: colors.yellow, fontFamily: fonts.black, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 46, lineHeight: 52, letterSpacing: 0.5, textTransform: 'uppercase' },
  rule: { height: 4, width: 64, borderRadius: 2 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.semi, fontSize: 14, lineHeight: 20 },
});
