import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardItem } from '@/components/collection/CardItem';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { usdToTry } from '@/lib/api/justtcg';
import {
  buildSmartFolders,
  CollectionFilters,
  CollectionSortKey,
  filterCollection,
  filterSmartFolder,
} from '@/lib/collection/dexFeatures';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { Condition, Game } from '@/types';

type SortKey = CollectionSortKey;
type GameFilter = Game | 'all';
type ConditionFilter = Condition | 'all';

const GAME_FILTERS: { value: GameFilter; label: string }[] = [
  { value: 'all', label: 'GAME' },
  { value: 'pokemon', label: 'Pokemon' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'mtg', label: 'MTG' },
  { value: 'lorcana', label: 'Lorcana' },
  { value: 'naruto', label: 'Naruto' },
];

export default function CollectionScreen() {
  const { user } = useAuthStore();
  const { cards, loading, totalValue, fetchCollection, refreshPrices } = useCollectionStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [game, setGame] = useState<GameFilter>('all');
  const [condition, setCondition] = useState<ConditionFilter>('all');
  const [foil, setFoil] = useState<CollectionFilters['foil']>('all');
  const [smartFolderId, setSmartFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCollection(user.id);
  }, [user, fetchCollection]);

  const smartFolders = useMemo(() => buildSmartFolders(cards as any), [cards]);
  const filtered = useMemo(
    () =>
      filterCollection(filterSmartFolder(cards as any, smartFolderId), {
        query: search,
        sort,
        game,
        condition,
        foil,
      }),
    [cards, search, sort, game, condition, foil, smartFolderId],
  );

  const totalQuantity = cards.reduce((sum, item) => sum + item.quantity, 0);
  const pricedCount = cards.filter((item) => item.price).length;
  const uniqueCount = cards.length;

  const refresh = async () => {
    if (!user) return;
    await fetchCollection(user.id);
    await refreshPrices();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.mobileHeader}>
        <Text style={styles.title}>Collection</Text>
        <Pressable style={styles.headerButton} onPress={() => router.push('/(main)/scan')}>
          <Text style={styles.headerButtonText}>SCAN</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <CardItem userCard={item} onPress={() => router.push(`/(main)/collection/${item.id}`)} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.statsRow}>
              <Summary label="Total Cards" value={String(totalQuantity)} />
              <Summary label="Unique" value={String(uniqueCount)} />
              <Summary label="TRY Value" value={`TL ${Math.round(usdToTry(totalValue)).toLocaleString('tr-TR')}`} accent />
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>SRCH</Text>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search collection..."
                  placeholderTextColor={colors.textFaint}
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')}>
                    <Text style={styles.clearText}>X</Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable style={styles.tuneButton}>
                <Text style={styles.tuneText}>TUNE</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {GAME_FILTERS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={game === item.value}
                  onPress={() => setGame(item.value)}
                />
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {(['all', 'NM', 'LP', 'MP', 'HP', 'DMG'] as ConditionFilter[]).map((item) => (
                <Chip
                  key={item}
                  label={item === 'all' ? 'CONDITION' : item}
                  active={condition === item}
                  onPress={() => setCondition(item)}
                />
              ))}
              <Chip label="FOIL" active={foil === 'foil'} onPress={() => setFoil(foil === 'foil' ? 'all' : 'foil')} />
              <Chip label="NORMAL" active={foil === 'normal'} onPress={() => setFoil(foil === 'normal' ? 'all' : 'normal')} />
            </ScrollView>

            <View style={styles.sortRow}>
              {(['recent', 'name', 'value'] as SortKey[]).map((item) => (
                <Chip
                  key={item}
                  label={item === 'recent' ? 'RECENT' : item === 'name' ? 'NAME' : 'VALUE'}
                  active={sort === item}
                  onPress={() => setSort(item)}
                />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Smart Folders</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartRow}>
              {smartFolders.map((folder, index) => (
                <Pressable
                  key={folder.id}
                  style={[styles.smartCard, smartFolderId === folder.id && styles.smartCardActive]}
                  onPress={() => {
                    const active = smartFolderId === folder.id;
                    setSmartFolderId(active ? null : folder.id);
                    if (!active) {
                      setSort(folder.filter.sort ?? 'recent');
                      setFoil(folder.filter.foil ?? 'all');
                      setGame(folder.filter.game ?? 'all');
                      setCondition(folder.filter.condition ?? 'all');
                    }
                  }}
                >
                  <View style={[styles.smartIcon, index === 1 && styles.smartIconAlt, index === 2 && styles.smartIconWarn]}>
                    <Text style={styles.smartIconText}>{index === 0 ? 'HV' : index === 1 ? 'DP' : 'MP'}</Text>
                  </View>
                  <Text style={styles.smartName} numberOfLines={1}>{folder.name}</Text>
                  <Text style={styles.smartMeta}>{folder.count} cards</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Cards</Text>
              <Text style={styles.showingText}>Showing {filtered.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {!loading && (
              <>
                <View style={styles.emptyMark}>
                  <Text style={styles.emptyMarkText}>CARD</Text>
                </View>
                <Text style={styles.emptyTitle}>{search ? 'No cards found' : 'Your collection is empty'}</Text>
                <Text style={styles.emptyText}>
                  {search ? 'Try another filter or search term.' : 'Scan your first card to build inventory.'}
                </Text>
                <Pressable style={styles.emptyButton} onPress={() => router.push('/(main)/scan')}>
                  <Text style={styles.emptyButtonText}>Scan card</Text>
                </Pressable>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.summaryValueAccent]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const CARD_GAP = spacing.sm;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  mobileHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bg,
  },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.3 },
  headerButton: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  headerButtonText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  grid: {
    paddingHorizontal: spacing.xl - CARD_GAP / 2,
    paddingBottom: 112,
  },
  headerContent: { paddingTop: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: CARD_GAP / 2 },
  summary: {
    flex: 1,
    minHeight: 72,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  summaryLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', marginBottom: 4 },
  summaryValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  summaryValueAccent: { color: colors.primary, fontSize: fontSize.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: CARD_GAP / 2 },
  searchBox: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { color: colors.textFaint, fontSize: 9, fontWeight: '900' },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.sm, height: '100%' },
  clearText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '900' },
  tuneButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tuneText: { color: colors.textMuted, fontSize: 8, fontWeight: '900' },
  chipRow: { gap: spacing.sm, paddingHorizontal: CARD_GAP / 2, paddingTop: spacing.md },
  sortRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: CARD_GAP / 2, paddingTop: spacing.md },
  chip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900' },
  chipTextActive: { color: colors.primary },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_GAP / 2,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  showingText: { color: colors.textMuted, fontSize: fontSize.sm },
  smartRow: { gap: spacing.md, paddingHorizontal: CARD_GAP / 2 },
  smartCard: {
    width: 142,
    minHeight: 112,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.xs,
  },
  smartCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  smartIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentMuted,
  },
  smartIconAlt: { backgroundColor: colors.successMuted },
  smartIconWarn: { backgroundColor: colors.errorMuted },
  smartIconText: { color: colors.text, fontSize: 9, fontWeight: '900' },
  smartName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900', marginTop: spacing.xs },
  smartMeta: { color: colors.textMuted, fontSize: fontSize.xs },
  cardWrap: { width: '33.3333%', padding: CARD_GAP / 2 },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMarkText: { color: colors.textFaint, fontSize: 9, fontWeight: '900' },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyButtonText: { color: colors.onPrimary, fontSize: fontSize.sm, fontWeight: '900' },
});
