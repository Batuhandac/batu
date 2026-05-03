import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { UserCard } from '@/types';
import { usdToTry } from '@/lib/api/justtcg';

interface CardItemProps {
  userCard: UserCard;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CardItem({ userCard, onPress, style }: CardItemProps) {
  const { card, quantity, condition, foil, price } = userCard;
  const value = price?.mid ? usdToTry(price.mid * quantity) : null;

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed, style]} onPress={onPress}>
      <View style={styles.imageWrap}>
        {card.imageUrl ? (
          <Image source={{ uri: card.imageUrl }} style={styles.image} contentFit="cover" transition={180} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>NO IMG</Text>
          </View>
        )}
        <View style={[styles.statusDot, foil && styles.foilDot]} />
        {quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>x{quantity}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{card.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{card.setCode || card.setName || card.game}</Text>
        <View style={styles.footer}>
          <Text style={styles.condition}>{condition}</Text>
          <Text style={[styles.value, !value && styles.valueMuted]}>
            {value ? `TL ${Math.round(value).toLocaleString('tr-TR')}` : '--'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pressed: { opacity: 0.78 },
  imageWrap: {
    position: 'relative',
    aspectRatio: 2.5 / 3.5,
    backgroundColor: colors.surfaceLowest,
    padding: 4,
  },
  image: { width: '100%', height: '100%', borderRadius: radius.sm },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHover },
  placeholderText: { color: colors.textFaint, fontSize: 9, fontWeight: '900' },
  statusDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  foilDot: { backgroundColor: colors.accent, shadowColor: colors.accent },
  quantityBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(19,19,21,0.88)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  quantityText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  info: { padding: spacing.sm, gap: 3 },
  name: { color: colors.text, fontSize: fontSize.xs, fontWeight: '900' },
  meta: { color: colors.textFaint, fontSize: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  condition: { color: colors.textMuted, fontSize: 10, fontWeight: '900' },
  value: { color: colors.primary, fontSize: 10, fontWeight: '900', flexShrink: 1 },
  valueMuted: { color: colors.textFaint },
});
