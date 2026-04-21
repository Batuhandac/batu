import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { CardItem } from '@/components/collection/CardItem';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { usdToTry } from '@/lib/api/justtcg';

type SortKey = 'recent' | 'name' | 'value';

export default function CollectionScreen() {
  const { user } = useAuthStore();
  const { cards, loading, totalValue, fetchCollection, refreshPrices } = useCollectionStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  useEffect(() => {
    if (user) fetchCollection(user.id);
  }, [user, fetchCollection]);

  const filtered = useMemo(() => {
    let result = cards;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.card.name.toLowerCase().includes(q) ||
          c.card.setName.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      if (sort === 'name') return a.card.name.localeCompare(b.card.name);
      if (sort === 'value') return (b.price?.mid ?? 0) - (a.price?.mid ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [cards, search, sort]);

  const numColumns = 3;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Koleksiyon</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            {cards.length} kart · ₺{usdToTry(totalValue).toLocaleString('tr-TR')}
          </Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Kart ara..."
          placeholderTextColor={colors.textFaint}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sortRow}>
        {(['recent', 'name', 'value'] as SortKey[]).map((s) => (
          <Pressable
            key={s}
            style={[styles.sortBtn, s === sort && styles.sortBtnActive]}
            onPress={() => setSort(s)}
          >
            <Text style={[styles.sortLabel, s === sort && styles.sortLabelActive]}>
              {s === 'recent' ? 'Son Eklenen' : s === 'name' ? 'İsim' : 'Değer'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <CardItem
              userCard={item}
              onPress={() => router.push(`/(main)/collection/${item.id}`)}
            />
          </View>
        )}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              if (user) {
                await fetchCollection(user.id);
                await refreshPrices();
              }
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? null : (
              <>
                <Text style={styles.emptyEmoji}>🗂</Text>
                <Text style={styles.emptyTitle}>
                  {search ? 'Kart bulunamadı' : 'Koleksiyonun boş'}
                </Text>
                <Text style={styles.emptyText}>
                  {search
                    ? 'Farklı bir arama deneyin'
                    : 'Tarama yaparak ilk kartını ekle'}
                </Text>
              </>
            )}
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(main)/scan')}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const CARD_GAP = spacing.sm;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  headerStats: {},
  statsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
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
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  clearSearch: {
    color: colors.textMuted,
    fontSize: 16,
    padding: spacing.xs,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortBtnActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  sortLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  sortLabelActive: { color: colors.primary },
  grid: {
    paddingHorizontal: spacing.xl - CARD_GAP / 2,
    paddingBottom: 100,
  },
  cardWrap: {
    flex: 1 / 3,
    padding: CARD_GAP / 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { fontSize: 24 },
});
