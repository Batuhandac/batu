import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { Condition, CONDITION_LABELS, ScanResult } from '@/types';
import { usdToTry } from '@/lib/api/justtcg';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = Math.min(SCREEN_H * 0.82, 720);
const CONDITIONS: Condition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];

interface ScanResultSheetProps {
  results: ScanResult[];
  activeIndex: number;
  onSelectIndex: (i: number) => void;
  visible: boolean;
  onClose: () => void;
  onAddToCollection: (condition: Condition, quantity: number, foil: boolean) => void;
  adding?: boolean;
}

export function ScanResultSheet({
  results,
  activeIndex,
  onSelectIndex,
  visible,
  onClose,
  onAddToCollection,
  adding = false,
}: ScanResultSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const [condition, setCondition] = useState<Condition>('NM');
  const [quantity, setQuantity] = useState('1');
  const [foil, setFoil] = useState(false);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_H,
      useNativeDriver: true,
      damping: 22,
      stiffness: 210,
    }).start();
  }, [visible, translateY]);

  useEffect(() => {
    if (visible) {
      setCondition('NM');
      setQuantity('1');
      setFoil(false);
    }
  }, [visible, activeIndex]);

  if (!results.length) return null;

  const result = results[activeIndex];
  const { card, price, confidence } = result;
  const verification = result.verification;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const canAdd = verification?.status === 'verified';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.scanStripe} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.content}>
          {results.length > 1 && (
            <View style={styles.altBlock}>
              <Text style={styles.labelCaps}>Candidates</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.altRow}>
                {results.map((candidate, index) => (
                  <Pressable
                    key={`${candidate.card.apiId}-${index}`}
                    onPress={() => onSelectIndex(index)}
                    style={[styles.altThumb, index === activeIndex && styles.altThumbActive]}
                  >
                    {candidate.card.imageUrl ? (
                      <Image source={{ uri: candidate.card.imageUrl }} style={styles.altImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.altImage, styles.placeholder]}>
                        <Text style={styles.placeholderText}>NA</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.header}>
            <View style={styles.imageFrame}>
              {card.imageUrl ? (
                <Image source={{ uri: card.imageUrl }} style={styles.cardImage} contentFit="cover" transition={250} />
              ) : (
                <View style={[styles.cardImage, styles.placeholder]}>
                  <Text style={styles.placeholderText}>NO IMAGE</Text>
                </View>
              )}
              <View style={styles.imageBorder} />
            </View>

            <View style={styles.meta}>
              <StatusBadge verified={canAdd} />
              <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
              <Text style={styles.metaLine} numberOfLines={1}>{card.game.toUpperCase()}</Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {card.setName || 'Unknown set'} {card.number ? `- #${card.number}` : ''}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>{card.rarity || 'Unknown rarity'}</Text>
              <Text style={styles.confidence}>{Math.round(confidence * 100)}% visual match</Text>
            </View>
          </View>

          <View style={[styles.verificationBox, canAdd ? styles.verifiedBox : styles.reviewBox]}>
            <Text style={styles.verificationTitle}>
              {canAdd ? 'Exact print verified' : 'Manual review required'}
            </Text>
            <Text style={styles.verificationText}>
              {canAdd
                ? `${verification?.provider ?? 'Provider'} matched ${verification?.reasons.join(', ') || 'set and print data'}.`
                : 'The app blocks collection add until game, set, card number and rarity are clear enough to prevent wrong-card inventory.'}
            </Text>
          </View>

          {canAdd && price ? (
            <View style={styles.priceBox}>
              <View style={styles.priceHeader}>
                <Text style={styles.sectionTitle}>Market valuation</Text>
                <Text style={styles.sourceText}>{price.source}</Text>
              </View>
              <View style={styles.priceRow}>
                <PriceCol label="Low" usd={price.low} />
                <PriceCol label="Market" usd={price.market ?? price.mid} highlight />
                <PriceCol label="High" usd={price.high} />
              </View>
            </View>
          ) : (
            <View style={styles.noPriceBox}>
              <Text style={styles.noPriceText}>
                {canAdd ? 'Price data not found yet.' : 'Pricing unlocks after exact-print verification.'}
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Manual Correct</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Compare Ref</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.conditionButton, condition === item && styles.conditionButtonActive]}
                  onPress={() => setCondition(item)}
                >
                  <Text style={[styles.conditionText, condition === item && styles.conditionTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.conditionHint}>{CONDITION_LABELS[condition]}</Text>
          </View>

          <View style={styles.inventoryRow}>
            <View style={styles.quantityBlock}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityRow}>
                <Pressable style={styles.stepper} onPress={() => setQuantity(String(Math.max(1, qty - 1)))}>
                  <Text style={styles.stepperText}>-</Text>
                </Pressable>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Pressable style={styles.stepper} onPress={() => setQuantity(String(qty + 1))}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable style={[styles.foilButton, foil && styles.foilButtonActive]} onPress={() => setFoil(!foil)}>
              <Text style={[styles.foilText, foil && styles.foilTextActive]}>Foil</Text>
            </Pressable>
          </View>

          <Button
            label={canAdd ? 'Add to Collection' : 'Verification Required'}
            variant="primary"
            size="lg"
            loading={adding}
            disabled={!canAdd}
            style={styles.addButton}
            onPress={() => onAddToCollection(condition, qty, foil)}
          />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <View style={[styles.statusBadge, verified ? styles.statusVerified : styles.statusReview]}>
      <Text style={[styles.statusBadgeText, verified ? styles.statusVerifiedText : styles.statusReviewText]}>
        {verified ? 'VERIFIED' : 'REVIEW'}
      </Text>
    </View>
  );
}

function PriceCol({ label, usd, highlight }: { label: string; usd: number; highlight?: boolean }) {
  return (
    <View style={[styles.priceCol, highlight && styles.priceColHighlight]}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceUsd, highlight && styles.priceUsdHighlight]}>${usd.toFixed(2)}</Text>
      <Text style={styles.priceTry}>TL {usdToTry(usd).toLocaleString('tr-TR')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_H,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  scanStripe: {
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  altBlock: { gap: spacing.sm },
  labelCaps: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  altRow: { gap: spacing.sm },
  altThumb: {
    width: 48,
    height: 68,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  altThumbActive: { borderColor: colors.primary },
  altImage: { width: '100%', height: '100%' },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  imageFrame: {
    width: 106,
    height: 148,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLowest,
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  imageBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: radius.sm,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHover },
  placeholderText: { color: colors.textFaint, fontSize: 9, fontWeight: '900', textAlign: 'center' },
  meta: { flex: 1, paddingTop: 2, gap: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusVerified: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  statusReview: { backgroundColor: colors.warningMuted, borderColor: colors.warning },
  statusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  statusVerifiedText: { color: colors.primary },
  statusReviewText: { color: colors.warning },
  cardName: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', lineHeight: 30 },
  metaLine: { color: colors.textMuted, fontSize: fontSize.sm },
  confidence: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', marginTop: 2 },
  verificationBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 4,
  },
  verifiedBox: { backgroundColor: colors.successMuted, borderColor: colors.success },
  reviewBox: { backgroundColor: colors.warningMuted, borderColor: colors.warning },
  verificationTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  verificationText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  priceBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.md,
  },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sourceText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  priceRow: { flexDirection: 'row' },
  priceCol: { flex: 1, alignItems: 'center', gap: 3 },
  priceColHighlight: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderLight,
  },
  priceLabel: { color: colors.textFaint, fontSize: fontSize.xs },
  priceUsd: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  priceUsdHighlight: { color: colors.primary, fontSize: fontSize.xl },
  priceTry: { color: colors.textMuted, fontSize: fontSize.xs },
  noPriceBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noPriceText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryAction: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLowest,
  },
  secondaryActionText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '900' },
  section: { gap: spacing.sm },
  conditionRow: { flexDirection: 'row', gap: spacing.sm },
  conditionButton: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  conditionButtonActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  conditionText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '900' },
  conditionTextActive: { color: colors.primary },
  conditionHint: { color: colors.textFaint, fontSize: fontSize.xs },
  inventoryRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  quantityBlock: { flex: 1, gap: spacing.sm },
  quantityRow: { flexDirection: 'row', gap: spacing.sm },
  stepper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  quantityInput: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.text,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '900',
  },
  foilButton: {
    height: 42,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceLow,
  },
  foilButtonActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  foilText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '900' },
  foilTextActive: { color: colors.accent },
  addButton: { marginTop: spacing.sm },
});
