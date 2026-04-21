import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
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
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useBrowseStore } from '@/stores/browseStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useAuthStore } from '@/stores/authStore';
import { TCGCard, Condition, CONDITION_LABELS, VARIANT_LABELS, CardVariant } from '@/types';
import { extractBestPrice, tcgCardToCard } from '@/lib/api/pokemontcg';
import { usdToTry } from '@/lib/api/justtcg';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - spacing.xl * 2 - spacing.sm * 2) / 3;

const CONDITIONS: Condition[] = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const VARIANTS: CardVariant[] = ['normal', 'holofoil', 'reverseHolofoil', 'firstEditionHolofoil', 'firstEditionNormal'];

export default function SetDetailScreen() {
  const { setCode } = useLocalSearchParams<{ setCode: string }>();
  const { sets, currentSetCards, currentSetTotal, loading, loadSetCards, search, searchResults, searchLoading, clearSearch } = useBrowseStore();
  const { addCard } = useCollectionStore();
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<TCGCard | null>(null);
  const [condition, setCondition] = useState<Condition>('NM');
  const [variant, setVariant] = useState<CardVariant>('normal');
  const [quantity, setQuantity] = useState('1');
  const [foil, setFoil] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const set = sets.find((s) => s.id === setCode);

  useEffect(() => {
    if (setCode) loadSetCards(setCode, 1);
  }, [setCode]);

  const handleLoadMore = () => {
    if (loading) return;
    const loaded = currentSetCards.length;
    if (loaded >= currentSetTotal) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadSetCards(setCode!, nextPage);
  };

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (q.trim()) {
        search(q);
      } else {
        clearSearch();
      }
    },
    [search, clearSearch],
  );

  const displayCards = searchQuery.trim() ? searchResults : currentSetCards;
  const isLoading = searchQuery.trim() ? searchLoading : loading;

  const handleAddToCollection = async () => {
    if (!selectedCard || !user) return;
    setAdding(true);
    try {
      const card = tcgCardToCard(selectedCard);
      await addCard(user.id, card, {
        quantity: Math.max(1, parseInt(quantity) || 1),
        condition,
        foil,
      });
      setAddedId(selectedCard.id);
      setTimeout(() => setAddedId(null), 2000);
      setSelectedCard(null);
    } finally {
      setAdding(false);
    }
  };

  const price = selectedCard
    ? (() => {
        const raw = {
          id: selectedCard.id,
          name: selectedCard.name,
          supertype: selectedCard.supertype,
          set: { id: selectedCard.setId, name: selectedCard.setName } as any,
          number: selectedCard.number,
          rarity: selectedCard.rarity,
          images: { small: selectedCard.imageSmall, large: selectedCard.imageLarge },
          tcgplayer: selectedCard.prices?.tcgplayer
            ? { url: '', updatedAt: new Date().toISOString(), prices: selectedCard.prices.tcgplayer as any }
            : undefined,
          cardmarket: selectedCard.prices?.cardmarket
            ? { url: '', updatedAt: new Date().toISOString(), prices: selectedCard.prices.cardmarket as any }
            : undefined,
        };
        return extractBestPrice(raw as any);
      })()
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{set?.name ?? setCode}</Text>
          <Text style={styles.subtitle}>
            {currentSetCards.length}/{currentSetTotal} kart
          </Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Set içinde ara..."
          placeholderTextColor={colors.textFaint}
        />
        {searchQuery ? (
          <Pressable onPress={() => handleSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading && displayCards.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={displayCards}
          keyExtractor={(item) => item.id}
          numColumns={3}
          onEndReached={!searchQuery ? handleLoadMore : undefined}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading && displayCards.length > 0 ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.cardWrap, addedId === item.id && styles.cardAdded]}
              onPress={() => setSelectedCard(item)}
            >
              <Image
                source={{ uri: item.imageSmall }}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
              />
              {addedId === item.id && (
                <View style={styles.addedOverlay}>
                  <Text style={styles.addedCheck}>✓</Text>
                </View>
              )}
              <Text style={styles.cardNumber}>#{item.number}</Text>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={!!selectedCard}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCard(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedCard(null)} />
        {selectedCard && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.sheetHeader}>
                <Image
                  source={{ uri: selectedCard.imageLarge }}
                  style={styles.sheetImage}
                  contentFit="contain"
                  transition={300}
                />
                <View style={styles.sheetCardInfo}>
                  <Text style={styles.sheetCardName}>{selectedCard.name}</Text>
                  <Text style={styles.sheetCardSet}>{selectedCard.setName} · #{selectedCard.number}</Text>
                  <Text style={styles.sheetRarity}>{selectedCard.rarity}</Text>
                  {selectedCard.artist && (
                    <Text style={styles.sheetArtist}>🎨 {selectedCard.artist}</Text>
                  )}
                </View>
              </View>

              {price && (
                <View style={styles.priceBox}>
                  <Text style={styles.priceBoxTitle}>Piyasa Değeri</Text>
                  <View style={styles.priceRow}>
                    <PriceCol label="Düşük" value={price.low} />
                    <PriceCol label="Orta" value={price.mid} highlight />
                    <PriceCol label="Yüksek" value={price.high} />
                  </View>
                  <Text style={styles.priceSource}>
                    Kaynak: {price.source.split(':')[0].toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Varyant</Text>
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

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Durum</Text>
                <View style={styles.condRow}>
                  {CONDITIONS.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.condBtn, c === condition && styles.condBtnActive]}
                      onPress={() => setCondition(c)}
                    >
                      <Text style={[styles.condLabel, c === condition && styles.condLabelActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.condDesc}>{CONDITION_LABELS[condition]}</Text>
              </View>

              <View style={styles.sheetRow}>
                <View style={styles.qtyWrap}>
                  <Text style={styles.sheetSectionTitle}>Adet</Text>
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={styles.qBtn}
                      onPress={() => setQuantity(String(Math.max(1, (parseInt(quantity) || 1) - 1)))}
                    >
                      <Text style={styles.qBtnLabel}>−</Text>
                    </Pressable>
                    <TextInput
                      style={styles.qInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Pressable
                      style={styles.qBtn}
                      onPress={() => setQuantity(String((parseInt(quantity) || 1) + 1))}
                    >
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

              <Pressable
                style={[styles.addBtn, adding && styles.addBtnDisabled]}
                onPress={handleAddToCollection}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addBtnText}>Koleksiyona Ekle</Text>
                )}
              </Pressable>
              <View style={{ height: spacing.xxxl }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function PriceCol({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={[priceColStyles.wrap, highlight && priceColStyles.highlight]}>
      <Text style={priceColStyles.label}>{label}</Text>
      <Text style={[priceColStyles.usd, highlight && priceColStyles.usdHighlight]}>
        ${value.toFixed(2)}
      </Text>
      <Text style={priceColStyles.try}>₺{usdToTry(value).toLocaleString()}</Text>
    </View>
  );
}

const priceColStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 2 },
  highlight: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  label: { color: colors.textMuted, fontSize: fontSize.xs },
  usd: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  usdHighlight: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  try: { color: colors.textMuted, fontSize: fontSize.xs },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  backBtn: { paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontSize: fontSize.md },
  titleWrap: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.md },
  clearSearch: { color: colors.textMuted, fontSize: 16, padding: spacing.xs },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  cardWrap: {
    width: CARD_SIZE,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  cardAdded: { borderWidth: 2, borderColor: colors.success },
  cardImage: { width: CARD_SIZE, height: CARD_SIZE / 0.72 },
  addedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(63,185,80,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedCheck: { color: colors.success, fontSize: 32, fontWeight: '800' },
  cardNumber: { color: colors.textFaint, fontSize: 9, paddingHorizontal: 4, paddingTop: 2 },
  cardName: { color: colors.text, fontSize: 10, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 4 },
  footerLoader: { paddingVertical: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetHeader: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  sheetImage: { width: 100, height: 140, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  sheetCardInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  sheetCardName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  sheetCardSet: { color: colors.textMuted, fontSize: fontSize.sm },
  sheetRarity: { color: colors.textMuted, fontSize: fontSize.xs },
  sheetArtist: { color: colors.textFaint, fontSize: fontSize.xs },
  priceBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  priceBoxTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: { flexDirection: 'row' },
  priceSource: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center' },
  sheetSection: { marginBottom: spacing.xl, gap: spacing.sm },
  sheetSectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  condRow: { flexDirection: 'row', gap: spacing.sm },
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
  sheetRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, alignItems: 'flex-end' },
  qtyWrap: { flex: 1, gap: spacing.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBtnLabel: { color: colors.text, fontSize: 20, fontWeight: '400', lineHeight: 24 },
  qInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    color: colors.text,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '600',
    height: 40,
  },
  foilBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 40,
    justifyContent: 'center',
  },
  foilBtnActive: { backgroundColor: 'rgba(255,203,5,0.12)', borderColor: '#FFCB05' },
  foilLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  foilLabelActive: { color: '#FFCB05' },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
