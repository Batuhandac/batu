import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCollectionStore } from '@/stores/collectionStore';
import { usdToTry } from '@/lib/api/justtcg';
import { CONDITION_LABELS, VARIANT_LABELS, Condition, CardVariant } from '@/types';

const CONDITIONS: Condition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const VARIANTS: CardVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  'firstEditionHolofoil',
  'firstEditionNormal',
];

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, updateCard, removeCard } = useCollectionStore();
  const userCard = cards.find((c) => c.id === id);
  const [condition, setCondition] = useState<Condition>(userCard?.condition ?? 'NM');
  const [variant, setVariant] = useState<CardVariant>(userCard?.variant ?? 'normal');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (userCard) {
      setCondition(userCard.condition);
      setVariant(userCard.variant ?? 'normal');
    }
  }, [userCard]);

  if (!userCard) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Kart bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { card, quantity, foil, price, acquiredAt, purchasePrice } = userCard;
  const midTry = price ? usdToTry(price.mid) : null;
  const gainLoss =
    purchasePrice && price
      ? ((usdToTry(price.mid) - purchasePrice) / purchasePrice) * 100
      : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(id, { condition, variant });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Kartı Sil', `${card.name} koleksiyonundan silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setRemoving(true);
          try {
            await removeCard(id);
            router.back();
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <Pressable onPress={handleRemove}>
          <Text style={styles.deleteText}>Sil</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={{ uri: card.imageUrl }}
            style={styles.cardImage}
            contentFit="contain"
            transition={300}
          />
          <View style={styles.heroTags}>
            {foil && (
              <View style={styles.foilTag}>
                <Text style={styles.foilText}>✦ Foil</Text>
              </View>
            )}
            {variant !== 'normal' && (
              <View style={styles.variantTag}>
                <Text style={styles.variantTagText}>{VARIANT_LABELS[variant]}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.setInfo}>{card.setName} · #{card.number}</Text>
          <Text style={styles.rarity}>{card.rarity}</Text>

          {price && (
            <View style={styles.priceCard}>
              <View style={styles.priceMain}>
                <Text style={styles.priceTry}>₺{midTry?.toLocaleString('tr-TR')}</Text>
                <Text style={styles.priceUsd}>${price.mid.toFixed(2)} · {price.source.split(':')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.priceRange}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceRangeLabel}>Düşük</Text>
                  <Text style={styles.priceRangeVal}>${price.low.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceRangeLabel}>Orta</Text>
                  <Text style={[styles.priceRangeVal, styles.mid]}>${price.mid.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceRangeLabel}>Yüksek</Text>
                  <Text style={styles.priceRangeVal}>${price.high.toFixed(2)}</Text>
                </View>
                {price.market && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceRangeLabel}>Market</Text>
                    <Text style={styles.priceRangeVal}>${price.market.toFixed(2)}</Text>
                  </View>
                )}
              </View>
              {gainLoss !== null && (
                <View style={styles.gainRow}>
                  <Text style={styles.gainLabel}>Yatırım Getirisi</Text>
                  <Text
                    style={[
                      styles.gainValue,
                      gainLoss >= 0 ? styles.gainPos : styles.gainNeg,
                    ]}
                  >
                    {gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bilgiler</Text>
            <View style={styles.infoGrid}>
              <InfoRow label="Oyun" value={card.game.toUpperCase()} />
              <InfoRow label="Adet" value={quantity.toString()} />
              {card.hp && <InfoRow label="HP" value={card.hp.toString()} />}
              {card.artist && <InfoRow label="Sanatçı" value={card.artist} />}
              <InfoRow label="Eklenme" value={new Date(acquiredAt).toLocaleDateString('tr-TR')} />
              {purchasePrice && (
                <InfoRow label="Alış Fiyatı" value={`₺${purchasePrice.toLocaleString()}`} />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Varyant</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.variantRow}>
                {VARIANTS.map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.variantBtn, v === variant && styles.variantBtnActive]}
                    onPress={() => setVariant(v)}
                  >
                    <Text style={[styles.variantLabel, v === variant && styles.variantLabelActive]}>
                      {VARIANT_LABELS[v]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Durum</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.condBtn, c === condition && styles.condBtnActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text
                    style={[styles.condLabel, c === condition && styles.condLabelActive]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.condDesc}>{CONDITION_LABELS[condition]}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="Değişiklikleri Kaydet"
              variant="primary"
              loading={saving}
              onPress={handleSave}
              style={styles.actionBtn}
            />
            <Button
              label="Sat / Listele"
              variant="secondary"
              onPress={() => router.push('/(main)/trade')}
              style={styles.actionBtn}
            />
          </View>

          <View style={styles.bottomPad} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  back: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  backText: { color: colors.primary, fontSize: fontSize.md },
  deleteText: { color: colors.error, fontSize: fontSize.md, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: colors.textMuted, fontSize: fontSize.lg },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  cardImage: { width: 200, height: 280, borderRadius: radius.lg },
  heroTags: { flexDirection: 'row', gap: spacing.sm },
  foilTag: {
    backgroundColor: 'rgba(255,203,5,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  foilText: { color: '#FFCB05', fontSize: fontSize.sm, fontWeight: '700' },
  variantTag: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  variantTagText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  content: { padding: spacing.xl },
  cardName: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: 4 },
  setInfo: { color: colors.textMuted, fontSize: fontSize.md },
  rarity: { color: colors.textFaint, fontSize: fontSize.sm, marginBottom: spacing.xl },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  priceMain: { alignItems: 'center', gap: 4 },
  priceTry: { color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  priceUsd: { color: colors.textMuted, fontSize: fontSize.sm },
  priceRange: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  priceItem: { flex: 1, alignItems: 'center', gap: 4 },
  priceRangeLabel: { color: colors.textFaint, fontSize: fontSize.xs },
  priceRangeVal: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  mid: { color: colors.primary },
  gainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  gainLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  gainValue: { fontSize: fontSize.md, fontWeight: '700' },
  gainPos: { color: colors.success },
  gainNeg: { color: colors.error },
  section: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  infoGrid: { gap: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  infoLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  infoValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  variantRow: { flexDirection: 'row', gap: spacing.sm },
  variantBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  variantBtnActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  variantLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  variantLabelActive: { color: colors.primary },
  conditionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  condBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  condBtnActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  condLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  condLabelActive: { color: colors.primary },
  condDesc: { color: colors.textFaint, fontSize: fontSize.xs },
  actions: { gap: spacing.md },
  actionBtn: { width: '100%' },
  bottomPad: { height: spacing.xxxl },
});
