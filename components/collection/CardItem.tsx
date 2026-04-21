import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { UserCard } from '@/types';
import { usdToTry } from '@/lib/api/justtcg';

interface CardItemProps {
  userCard: UserCard;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CardItem({ userCard, onPress, style }: CardItemProps) {
  const { card, quantity, condition, foil, price } = userCard;
  const midValue = price?.mid ? usdToTry(price.mid * quantity) : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {foil && (
          <View style={styles.foilBadge}>
            <Text style={styles.foilText}>✦</Text>
          </View>
        )}
        {quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>×{quantity}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{card.name}</Text>
        <Text style={styles.set} numberOfLines={1}>{card.setName}</Text>

        <View style={styles.footer}>
          <Badge label={condition} variant="neutral" />
          {midValue !== null && (
            <Text style={styles.value}>₺{midValue.toLocaleString()}</Text>
          )}
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
  },
  pressed: { opacity: 0.85 },
  imageWrap: {
    position: 'relative',
    aspectRatio: 0.72,
    backgroundColor: colors.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  foilBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(255,203,5,0.9)',
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
  foilText: {
    fontSize: 10,
    color: '#000',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  quantityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: spacing.sm,
    gap: 3,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
    lineHeight: 15,
  },
  set: {
    color: colors.textMuted,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  value: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
});
