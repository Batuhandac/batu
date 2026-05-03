import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { buildMarketRows } from '@/lib/collection/dexFeatures';
import { usdToTry } from '@/lib/api/justtcg';
import { useCollectionStore } from '@/stores/collectionStore';
import { CardVariant, Condition, CONDITION_LABELS } from '@/types';

const CONDITIONS: Condition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const VARIANTS: CardVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  'firstEditionHolofoil',
  'firstEditionNormal',
];

const VARIANT_COPY: Record<CardVariant, string> = {
  normal: 'Normal',
  holofoil: 'Holo',
  reverseHolofoil: 'Reverse Holo',
  firstEditionHolofoil: '1st Edition Holo',
  firstEditionNormal: '1st Edition',
  unlimitedHolofoil: 'Unlimited Holo',
};

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, updateCard, removeCard } = useCollectionStore();
  const userCard = cards.find((item) => item.id === id);
  const [condition, setCondition] = useState<Condition>(userCard?.condition ?? 'NM');
  const [variant, setVariant] = useState<CardVariant>(userCard?.variant ?? 'normal');
  const [quantity, setQuantity] = useState(String(userCard?.quantity ?? 1));
  const [foil, setFoil] = useState(userCard?.foil ?? false);
  const [notes, setNotes] = useState(userCard?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userCard) return;
    setCondition(userCard.condition);
    setVariant(userCard.variant ?? 'normal');
    setQuantity(String(userCard.quantity));
    setFoil(userCard.foil);
    setNotes(userCard.notes ?? '');
  }, [userCard]);

  if (!userCard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.iconButtonText}>BACK</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Card not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { card, price, acquiredAt, purchasePrice } = userCard;
  const marketRows = buildMarketRows(userCard as any);
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const midTry = price ? usdToTry(price.market ?? price.mid) : null;
  const gainLoss =
    purchasePrice && price
      ? ((usdToTry(price.market ?? price.mid) - purchasePrice) / purchasePrice) * 100
      : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(id, { condition, variant, quantity: qty, foil, notes });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove card', `Remove ${card.name} from your collection?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeCard(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Text style={styles.iconButtonText}>BACK</Text>
        </Pressable>
        <Text style={styles.brand}>Cardory</Text>
        <Pressable style={styles.iconButton} onPress={handleRemove}>
          <Text style={[styles.iconButtonText, styles.dangerText]}>DEL</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.imageWrap}>
            {card.imageUrl ? (
              <Image source={{ uri: card.imageUrl }} style={styles.cardImage} contentFit="cover" transition={250} />
            ) : (
              <View style={[styles.cardImage, styles.placeholder]}>
                <Text style={styles.placeholderText}>NO IMAGE</Text>
              </View>
            )}
            <View style={styles.heroBadges}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
              {foil && (
                <View style={styles.foilBadge}>
                  <Text style={styles.foilBadgeText}>FOIL</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.subTitle}>{card.setName} - #{card.number}</Text>
            <View style={styles.infoGrid}>
              <Info label="Set" value={card.setCode || card.setName} />
              <Info label="Rarity" value={card.rarity || 'Unknown'} accent />
              <Info label="Game" value={card.game.toUpperCase()} />
              <Info label="Added" value={new Date(acquiredAt).toLocaleDateString('tr-TR')} />
            </View>
          </View>
        </View>

        <View style={styles.valuation}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>Market Valuation</Text>
            <Text style={styles.moduleLink}>UPDATED</Text>
          </View>
          {price ? (
            <>
              <View style={styles.marketMain}>
                <Text style={styles.tryValue}>TL {Math.round(midTry ?? 0).toLocaleString('tr-TR')}</Text>
                <Text style={styles.usdValue}>
                  ${(price.market ?? price.mid).toFixed(2)} - {price.source.split(':')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.priceGrid}>
                <Price label="Low" value={`$${price.low.toFixed(2)}`} />
                <Price label="Mid" value={`$${price.mid.toFixed(2)}`} accent />
                <Price label="High" value={`$${price.high.toFixed(2)}`} />
              </View>
            </>
          ) : (
            <Text style={styles.emptyModuleText}>No market price yet.</Text>
          )}
          {gainLoss !== null && (
            <View style={styles.gainRow}>
              <Text style={styles.gainLabel}>Inventory ROI</Text>
              <Text style={[styles.gainValue, gainLoss >= 0 ? styles.positive : styles.negative]}>
                {gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Sources</Text>
          <View style={styles.sourceBox}>
            {marketRows.map((row) => (
              <View key={row.source} style={styles.sourceRow}>
                <View>
                  <Text style={styles.sourceName}>{row.label}</Text>
                  <Text style={styles.sourceStatus}>{row.status}</Text>
                </View>
                <Text style={styles.sourceValue}>
                  {row.market ?? row.mid
                    ? `${row.currency === 'TRY' ? 'TL ' : row.currency === 'EUR' ? 'EUR ' : '$'}${Math.round(row.market ?? row.mid ?? 0).toLocaleString('tr-TR')}`
                    : 'Waiting'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.riskGrid}>
          <View style={[styles.riskCard, styles.fraudCard]}>
            <Text style={styles.riskTitle}>Fraud Risk</Text>
            <Text style={styles.riskCopy}>High-value cards should require reference comparison and provenance before sale.</Text>
          </View>
          <View style={[styles.riskCard, styles.roiCard]}>
            <Text style={styles.riskTitle}>Grading ROI</Text>
            <Text style={styles.riskCopy}>Raw-to-graded upside can be calculated once condition photos are attached.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Details</Text>
          <View style={styles.formGrid}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Condition</Text>
              <View style={styles.segmentRow}>
                {CONDITIONS.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.segment, condition === item && styles.segmentActive]}
                    onPress={() => setCondition(item)}
                  >
                    <Text style={[styles.segmentText, condition === item && styles.segmentTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldHint}>{CONDITION_LABELS[condition]}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Variant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantRow}>
                {VARIANTS.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.variantChip, variant === item && styles.variantChipActive]}
                    onPress={() => setVariant(item)}
                  >
                    <Text style={[styles.variantChipText, variant === item && styles.variantChipTextActive]}>
                      {VARIANT_COPY[item]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Pressable style={[styles.foilToggle, foil && styles.foilToggleActive]} onPress={() => setFoil(!foil)}>
              <Text style={[styles.foilToggleText, foil && styles.foilToggleTextActive]}>Foil Status</Text>
              <Text style={styles.foilToggleState}>{foil ? 'Enabled' : 'Normal'}</Text>
            </Pressable>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Private notes, provenance, grading or trade plan..."
                placeholderTextColor={colors.textFaint}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Save Changes" variant="primary" size="lg" loading={saving} onPress={handleSave} />
          <Button label="List / Trade" variant="secondary" size="lg" onPress={() => router.push('/(main)/trade')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent && styles.infoAccent]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Price({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.priceCell}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceValue, accent && styles.priceAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconButton: {
    minWidth: 46,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconButtonText: { color: colors.textMuted, fontSize: 9, fontWeight: '900' },
  dangerText: { color: colors.error },
  brand: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '900' },
  content: { padding: spacing.xl, paddingBottom: 120, gap: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: colors.textMuted, fontSize: fontSize.lg },
  hero: { gap: spacing.lg },
  imageWrap: {
    alignSelf: 'center',
    width: 220,
    height: 308,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHover },
  placeholderText: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '900' },
  heroBadges: { position: 'absolute', top: spacing.sm, left: spacing.sm, gap: spacing.xs },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  verifiedText: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  foilBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  foilBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  heroInfo: { gap: spacing.sm },
  cardName: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '900', letterSpacing: -0.4 },
  subTitle: { color: colors.textMuted, fontSize: fontSize.md },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoCell: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  infoLabel: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '900', marginBottom: 4 },
  infoValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  infoAccent: { color: colors.accent },
  valuation: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surfaceLow,
  },
  moduleTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  moduleLink: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  marketMain: { alignItems: 'center', padding: spacing.xl, gap: 3 },
  tryValue: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.6 },
  usdValue: { color: colors.textMuted, fontSize: fontSize.sm },
  priceGrid: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceCell: { flex: 1, alignItems: 'center', gap: 4 },
  priceLabel: { color: colors.textFaint, fontSize: fontSize.xs },
  priceValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  priceAccent: { color: colors.primary },
  emptyModuleText: { color: colors.textMuted, padding: spacing.xl, textAlign: 'center' },
  gainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  gainLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  gainValue: { fontSize: fontSize.sm, fontWeight: '900' },
  positive: { color: colors.success },
  negative: { color: colors.error },
  section: { gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sourceBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sourceName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  sourceStatus: { color: colors.textFaint, fontSize: fontSize.xs, marginTop: 2 },
  sourceValue: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900' },
  riskGrid: { flexDirection: 'row', gap: spacing.md },
  riskCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fraudCard: { backgroundColor: colors.errorMuted, borderColor: colors.error },
  roiCard: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  riskTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  riskCopy: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 17 },
  formGrid: { gap: spacing.md },
  field: { gap: spacing.sm },
  fieldLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900', textTransform: 'uppercase' },
  fieldHint: { color: colors.textFaint, fontSize: fontSize.xs },
  input: {
    minHeight: 44,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  notesInput: { minHeight: 104, paddingVertical: spacing.md, lineHeight: 21 },
  segmentRow: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900' },
  segmentTextActive: { color: colors.primary },
  variantRow: { gap: spacing.sm },
  variantChip: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  variantChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  variantChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900' },
  variantChipTextActive: { color: colors.primary },
  foilToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  foilToggleActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  foilToggleText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  foilToggleTextActive: { color: colors.accent },
  foilToggleState: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '800' },
  actions: { gap: spacing.md },
});
