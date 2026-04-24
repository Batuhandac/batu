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
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Condition, CONDITION_LABELS, ScanResult } from '@/types';
import { usdToTry } from '@/lib/api/justtcg';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.78;

interface ScanResultSheetProps {
  results: ScanResult[];
  activeIndex: number;
  onSelectIndex: (i: number) => void;
  visible: boolean;
  onClose: () => void;
  onAddToCollection: (condition: Condition, quantity: number, foil: boolean) => void;
  adding?: boolean;
}

const CONDITIONS: Condition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];

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
      damping: 20,
      stiffness: 200,
    }).start();
  }, [visible, translateY]);

  // Reset state when a new scan result appears
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
  const qty = Math.max(1, parseInt(quantity) || 1);
  const hasAlternatives = results.length > 1;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* ── Alternatives strip ── */}
          {hasAlternatives && (
            <View style={styles.altSection}>
              <Text style={styles.altLabel}>Alternatifler</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.altRow}>
                {results.map((r, i) => (
                  <Pressable
                    key={i}
                    onPress={() => onSelectIndex(i)}
                    style={[styles.altThumb, i === activeIndex && styles.altThumbActive]}
                  >
                    {r.card.imageUrl ? (
                      <Image source={{ uri: r.card.imageUrl }} style={styles.altImg} contentFit="contain" />
                    ) : (
                      <View style={[styles.altImg, styles.altImgPlaceholder]}>
                        <Text style={styles.altImgPlaceholderText}>{r.card.name.slice(0, 2)}</Text>
                      </View>
                    )}
                    {i === activeIndex && <View style={styles.altActiveDot} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Main card header ── */}
          <View style={styles.header}>
            <View style={styles.cardImageWrap}>
              {card.imageUrl ? (
                <Image source={{ uri: card.imageUrl }} style={styles.cardImage} contentFit="contain" transition={300} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Text style={styles.placeholderIcon}>🃏</Text>
                  <Text style={styles.placeholderText}>Görsel{'\n'}Bulunamadı</Text>
                </View>
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
              {card.setName ? <Text style={styles.setName}>{card.setName}</Text> : null}
              {card.number ? <Text style={styles.cardNumber}>#{card.number}</Text> : null}
              <Text style={styles.rarity}>{card.rarity}</Text>
              <View style={styles.badges}>
                <Badge
                  label={`${Math.round(confidence * 100)}% eşleşme`}
                  variant={confidence >= 0.9 ? 'success' : confidence >= 0.75 ? 'warning' : 'error'}
                />
              </View>
            </View>
          </View>

          {/* ── Price ── */}
          {price ? (
            <View style={styles.priceBox}>
              <Text style={styles.priceTitle}>Piyasa Değeri</Text>
              <View style={styles.priceRow}>
                <PriceCol label="Düşük" usd={price.low} />
                <PriceCol label="Piyasa" usd={price.market ?? price.mid} highlight />
                <PriceCol label="Yüksek" usd={price.high} />
              </View>
              <Text style={styles.priceSource}>{price.source}</Text>
            </View>
          ) : (
            <View style={styles.noPriceBox}>
              <Text style={styles.noPriceText}>Fiyat bilgisi bulunamadı</Text>
            </View>
          )}

          {/* ── Bilgiler ── */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Bilgiler</Text>
            <InfoRow label="Oyun" value={card.game.toUpperCase()} />
            {card.setName ? <InfoRow label="Set" value={card.setName} /> : null}
            {card.number ? <InfoRow label="Numara" value={`#${card.number}`} /> : null}
            {card.supertype ? <InfoRow label="Tür" value={card.supertype} /> : null}
          </View>

          {/* ── Condition ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Durum</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.conditionBtn, c === condition && styles.conditionBtnActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.conditionLabel, c === condition && styles.conditionLabelActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.conditionDesc}>{CONDITION_LABELS[condition]}</Text>
          </View>

          {/* ── Quantity + Foil ── */}
          <View style={styles.row}>
            <View style={styles.quantityWrap}>
              <Text style={styles.sectionTitle}>Adet</Text>
              <View style={styles.quantityRow}>
                <Pressable style={styles.qBtn} onPress={() => setQuantity(String(Math.max(1, qty - 1)))}>
                  <Text style={styles.qBtnLabel}>−</Text>
                </Pressable>
                <TextInput
                  style={styles.qInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Pressable style={styles.qBtn} onPress={() => setQuantity(String(qty + 1))}>
                  <Text style={styles.qBtnLabel}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={[styles.foilBtn, foil && styles.foilBtnActive]}
              onPress={() => setFoil(!foil)}
            >
              <Text style={[styles.foilLabel, foil && styles.foilLabelActive]}>✦ Foil</Text>
            </Pressable>
          </View>

          <Button
            label="Koleksiyona Ekle"
            variant="primary"
            size="lg"
            loading={adding}
            style={styles.addBtn}
            onPress={() => onAddToCollection(condition, qty, foil)}
          />
          <View style={styles.bottomPad} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PriceCol({ label, usd, highlight }: { label: string; usd: number; highlight?: boolean }) {
  return (
    <View style={[styles.priceCol, highlight && styles.priceColHighlight]}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceUsd, highlight && styles.priceUsdHighlight]}>${usd.toFixed(2)}</Text>
      <Text style={styles.priceTry}>₺{usdToTry(usd).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.md,
  },

  // Alternatives
  altSection: { marginBottom: spacing.lg },
  altLabel: {
    color: colors.textMuted, fontSize: fontSize.xs,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  altRow: { gap: spacing.sm, paddingVertical: 2 },
  altThumb: {
    width: 52, height: 72, borderRadius: radius.sm,
    borderWidth: 2, borderColor: 'transparent',
    overflow: 'hidden', position: 'relative',
  },
  altThumbActive: { borderColor: colors.primary },
  altImg: { width: '100%', height: '100%', borderRadius: radius.sm - 2 },
  altImgPlaceholder: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  altImgPlaceholderText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' },
  altActiveDot: {
    position: 'absolute', bottom: 2, alignSelf: 'center',
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary,
  },

  // Header
  header: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  cardImageWrap: {},
  cardImage: { width: 100, height: 140, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  cardImagePlaceholder: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  placeholderIcon: { fontSize: 28 },
  placeholderText: { color: colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 14 },
  cardInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  cardName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', lineHeight: 26 },
  setName: { color: colors.textMuted, fontSize: fontSize.sm },
  cardNumber: { color: colors.textMuted, fontSize: fontSize.xs },
  rarity: { color: colors.textMuted, fontSize: fontSize.xs },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },

  // Price
  priceBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.sm,
  },
  priceTitle: {
    color: colors.textMuted, fontSize: fontSize.sm,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  priceRow: { flexDirection: 'row' },
  priceCol: { flex: 1, alignItems: 'center', gap: 2 },
  priceColHighlight: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  priceLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  priceUsd: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  priceUsdHighlight: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  priceTry: { color: colors.textMuted, fontSize: fontSize.xs },
  priceSource: { color: colors.textFaint, fontSize: 10, textAlign: 'right' },
  noPriceBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
    alignItems: 'center',
  },
  noPriceText: { color: colors.textMuted, fontSize: fontSize.sm },

  // Info rows
  infoSection: { marginBottom: spacing.lg, gap: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  infoLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  infoValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },

  // Condition
  section: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted, fontSize: fontSize.sm,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  conditionRow: { flexDirection: 'row', gap: spacing.sm },
  conditionBtn: {
    flex: 1, paddingVertical: spacing.sm, backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: 'transparent',
  },
  conditionBtnActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  conditionLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  conditionLabelActive: { color: colors.primary },
  conditionDesc: { color: colors.textFaint, fontSize: fontSize.xs },

  // Quantity
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, alignItems: 'flex-end' },
  quantityWrap: { flex: 1, gap: spacing.sm },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qBtn: {
    width: 40, height: 40, backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
  },
  qBtnLabel: { color: colors.text, fontSize: 20, fontWeight: '400', lineHeight: 24 },
  qInput: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    color: colors.text, textAlign: 'center',
    fontSize: fontSize.lg, fontWeight: '600', height: 40,
  },
  foilBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    borderWidth: 1, borderColor: 'transparent', height: 40, justifyContent: 'center',
  },
  foilBtnActive: { backgroundColor: 'rgba(255,203,5,0.12)', borderColor: '#FFCB05' },
  foilLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  foilLabelActive: { color: '#FFCB05' },
  addBtn: { marginBottom: spacing.sm },
  bottomPad: { height: spacing.xl },
});
