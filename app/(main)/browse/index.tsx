import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image as RNImage,
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
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { ExpansionRegion, inferExpansionRegion } from '@/lib/collection/dexFeatures';
import { useBrowseStore } from '@/stores/browseStore';
import { SetInfo } from '@/types';

type GameFilter = 'all' | 'pokemon' | 'yugioh' | 'onepiece' | 'mtg' | 'lorcana' | 'naruto';
type RegionFilter = 'all' | ExpansionRegion;

const GAMES: { key: GameFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pokemon', label: 'Pokemon' },
  { key: 'yugioh', label: 'Yu-Gi-Oh!' },
  { key: 'onepiece', label: 'One Piece' },
  { key: 'mtg', label: 'MTG' },
  { key: 'lorcana', label: 'Lorcana' },
  { key: 'naruto', label: 'Naruto' },
];

export default function BrowseScreen() {
  const { sets, loading, loadSets } = useBrowseStore();
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<GameFilter>('pokemon');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const filtered = useMemo(() => {
    let result = sets;
    if (gameFilter !== 'all') result = result.filter((set) => set.game === gameFilter);
    if (regionFilter !== 'all') {
      result = result.filter((set) => inferExpansionRegion(set.name, set.series) === regionFilter);
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (set) =>
          set.name.toLowerCase().includes(query) ||
          set.series.toLowerCase().includes(query) ||
          set.id.toLowerCase().includes(query),
      );
    }
    return result;
  }, [sets, gameFilter, regionFilter, search]);

  const rows = useMemo(() => {
    const grouped = new Map<string, SetInfo[]>();
    for (const set of filtered) {
      const list = grouped.get(set.series) ?? [];
      list.push(set);
      grouped.set(set.series, list);
    }

    const flat: ({ type: 'header'; series: string } | { type: 'set'; set: SetInfo })[] = [];
    grouped.forEach((items, series) => {
      flat.push({ type: 'header', series });
      items.forEach((set) => flat.push({ type: 'set', set }));
    });
    return flat;
  }, [filtered]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>C</Text>
        </View>
        <Text style={styles.brand}>Cardory</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SR</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>SRCH</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search sets by name or code..."
            placeholderTextColor={colors.textFaint}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {GAMES.map((game) => (
            <Chip
              key={game.key}
              label={game.label}
              active={gameFilter === game.key}
              onPress={() => setGameFilter(game.key)}
            />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(
            [
              { key: 'all', label: 'Region: All' },
              { key: 'international', label: 'International' },
              { key: 'japan', label: 'Japan' },
              { key: 'china', label: 'China' },
            ] as { key: RegionFilter; label: string }[]
          ).map((region) => (
            <Chip
              key={region.key}
              label={region.label}
              active={regionFilter === region.key}
              onPress={() => setRegionFilter(region.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading && sets.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading sets...</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => (item.type === 'header' ? `h-${item.series}` : `s-${item.set.id}-${index}`)}
          renderItem={({ item }) => (item.type === 'header' ? <SeriesHeader title={item.series} /> : <SetRow set={item.set} />)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                useBrowseStore.setState({ sets: [] });
                loadSets();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No sets found</Text>
              <Text style={styles.emptyText}>Try a different game, region or search term.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SeriesHeader({ title }: { title: string }) {
  return (
    <View style={styles.seriesHeader}>
      <View style={styles.seriesAccent} />
      <Text style={styles.seriesText}>{title}</Text>
    </View>
  );
}

function SetRow({ set }: { set: SetInfo }) {
  const month = set.releaseDate ? set.releaseDate.replace(/\//g, '.') : 'Unknown';
  const code = set.id.toUpperCase();

  return (
    <Pressable style={({ pressed }) => [styles.setRow, pressed && styles.setPressed]} onPress={() => router.push(`/(main)/browse/${set.id}`)}>
      <View style={styles.logoBox}>
        {set.logoUrl ? (
          <RNImage source={{ uri: set.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>{code.slice(0, 3)}</Text>
          </View>
        )}
      </View>
      <View style={styles.setInfo}>
        <Text style={styles.setName} numberOfLines={1}>{set.name}</Text>
        <Text style={styles.setMeta} numberOfLines={1}>{code} - {month} - {set.total} cards</Text>
      </View>
      <View style={styles.progressBlock}>
        <Text style={styles.progressText}>0%</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
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
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { color: colors.textMuted, fontSize: 9, fontWeight: '900' },
  brand: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '900' },
  filters: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bg,
    gap: spacing.sm,
  },
  searchBox: {
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
  searchInput: { flex: 1, height: '100%', color: colors.text, fontSize: fontSize.sm },
  chipRow: { gap: spacing.sm, paddingRight: spacing.xl },
  chip: {
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900' },
  chipTextActive: { color: colors.primary },
  list: { paddingBottom: 112 },
  seriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  seriesAccent: { width: 3, height: 22, borderRadius: radius.full, backgroundColor: colors.primary },
  seriesText: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 78,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  setPressed: { backgroundColor: colors.surfaceHover },
  logoBox: {
    width: 58,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 52, height: 42 },
  logoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoPlaceholderText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900' },
  setInfo: { flex: 1, minWidth: 0 },
  setName: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  setMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  progressBlock: { width: 54, alignItems: 'flex-end', gap: 5 },
  progressText: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '900' },
  progressTrack: { width: 54, height: 4, backgroundColor: colors.surfaceHover, borderRadius: radius.full },
  progressFill: { width: 0, height: '100%', backgroundColor: colors.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { color: colors.textMuted, fontSize: fontSize.sm },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
});
