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
const SHEET_H = SCREEN_H * 0.72;

interface ScanResultSheetProps {
  result: ScanResult | null;
  visible: boolean;
  onClose: () => void;
  onAddToCollection: (condition: Condition, quantity: number, foil: boolean) => void;
  adding?: boolean;
}

const CONDITIONS: Condition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];

export function ScanResultSheet({
  result,
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

  if (!result) return null;

  const { card, price, confidence } = result;
  const qty = Math.max(1, parseInt(quantity) || 1);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.header}>
            <Image source={{ uri: card.imageUrl }} style={styles.cardImage} contentFit="contain" transition={300} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
              <Text style={styles.setName}>{card.setName} · #{card.number}</Text>
              <Text style={styles.rarity}>{card.rarity}</Text>
              <View style={styles.confidence}>
                <Badge label={`${Math.round(confidence * 100)}% eşleşme`} variant={confidence >= 0.9 ? 'success' : 'warning'} />
              </View>
            </View>
          </View>

          {price && (
            <View style={styles.priceBox}>
              <Text style={styles.priceTitle}>Piyasa Değeri</Text>
              <View style={styles.priceRow}>
                <PriceCol label="Düşük" usd={price.low} />
                <PriceCol label="Piyasa" usd={price.market ?? price.mid} highlight />
                <PriceCol label="Yüksek" usd={price.high} />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Durum</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((c) => (
                <Pressable key={c} style={[styles.conditionBtn, c === condition && styles.conditionBtnActive]} onPress={() => setCondition(c)}>
                  <Text style={[styles.conditionLabel, c === condition && styles.conditionLabelActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.conditionDesc}>{CONDITION_LABELS[condition]}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.quantityWrap}>
              <Text style={styles.sectionTitle}>Adet</Text>
              <View style={styles.quantityRow}>
                <Pressable style={styles.qBtn} onPress={() => setQuantity(String(Math.max(1, qty - 1)))}>
                  <Text style={styles.qBtnLabel}>−</Text>
                </Pressable>
                <TextInput style={styles.qInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" maxLength={3} />
                <Pressable style={styles.qBtn} onPress={() => setQuantity(String(qty + 1))}>
                  <Text style={styles.qBtnLabel}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable style={[styles.foilBtn, foil && styles.foilBtnActive]} onPress={() => setFoil(!foil)}>
              <Text style={[styles.foilLabel, foil && styles.foilLabelActive]}>✦ Foil</Text>
            </Pressable>
          </View>

          <Button label="Koleksiyona Ekle" variant="primary" size="lg" loading={adding} style={styles.addBtn} onPress={() => onAddToCollection(condition, qty, foil)} />
          <View style={styles.bottomPad} />
        </ScrollView>
      </Animated.View>
    </Modal>
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
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: radius.full, alignSelf: 'center', marginBottom: spacing.lg },
  header: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  cardImage: { width: 100, height: 140, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  cardInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  cardName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', lineHeight: 26 },
  setName: { color: colors.textMuted, fontSize: fontSize.sm },
  rarity: { color: colors.textMuted, fontSize: fontSize.xs },
  confidence: { marginTop: spacing.xs },
  priceBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl, gap: spacing.sm },
  priceTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row' },
  priceCol: { flex: 1, alignItems: 'center', gap: 2 },
  priceColHighlight: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  priceLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  priceUsd: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  priceUsdHighlight: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  priceTry: { color: colors.textMuted, fontSize: fontSize.xs },
  section: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  conditionRow: { flexDirection: 'row', gap: spacing.sm },
  conditionBtn: { flex: 1, paddingVertical: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  conditionBtnActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  conditionLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  conditionLabelActive: { color: colors.primary },
  conditionDesc: { color: colors.textFaint, fontSize: fontSize.xs },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, alignItems: 'flex-end' },
  quantityWrap: { flex: 1, gap: spacing.sm },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qBtn: { width: 40, height: 40, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  qBtnLabel: { color: colors.text, fontSize: 20, fontWeight: '400', lineHeight: 24 },
  qInput: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, color: colors.text, textAlign: 'center', fontSize: fontSize.lg, fontWeight: '600', height: 40 },
  foilBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent', height: 40, justifyContent: 'center' },
  foilBtnActive: { backgroundColor: 'rgba(255,203,5,0.12)', borderColor: '#FFCB05' },
  foilLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  foilLabelActive: { color: '#FFCB05' },
  addBtn: { marginBottom: spacing.sm },
  bottomPad: { height: spacing.xl },
});
