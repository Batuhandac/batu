import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image as RNImage,
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
import { useBrowseStore } from '@/stores/browseStore';
import { SetInfo } from '@/types';

type GameFilter = 'all' | 'pokemon' | 'yugioh' | 'onepiece' | 'mtg' | 'lorcana';

export default function BrowseScreen() {
  const { sets, loading, loadSets } = useBrowseStore();
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<GameFilter>('pokemon');
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const filtered = useMemo(() => {
    let result = sets;
    if (gameFilter !== 'all') result = result.filter((s) => s.game === gameFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.series.toLowerCase().includes(q),
      );
    }
    return result;
  }, [sets, gameFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, SetInfo[]>();
    filtered.forEach((s) => {
      const list = map.get(s.series) ?? [];
      list.push(s);
      map.set(s.series, list);
    });
    return Array.from(map.entries()).map(([series, items]) => ({ series, items }));
  }, [filtered]);

  const flat = useMemo(() => {
    const rows: ({ type: 'header'; series: string } | { type: 'set'; set: SetInfo })[] = [];
    grouped.forEach(({ series, items }) => {
      rows.push({ type: 'header', series });
      items.forEach((set) => rows.push({ type: 'set', set }));
    });
    return rows;
  }, [grouped]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Keşfet</Text>
        <Pressable
          style={styles.searchToggle}
          onPress={() => {
            setSearchMode(!searchMode);
            setSearch('');
          }}
        >
          <Text style={styles.searchToggleText}>{searchMode ? '✕' : '🔍'}</Text>
        </Pressable>
      </View>

      {searchMode && (
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Set ara..."
            placeholderTextColor={colors.textFaint}
            autoFocus
          />
        </View>
      )}

      <View style={styles.gameFilters}>
        {(
          [
            { key: 'pokemon', emoji: '⚡', label: 'Pokémon' },
            { key: 'yugioh', emoji: '⭐', label: 'Yu-Gi-Oh!' },
            { key: 'onepiece', emoji: '🏴‍☠️', label: 'One Piece' },
            { key: 'mtg', emoji: '🔮', label: 'MTG' },
            { key: 'lorcana', emoji: '🌙', label: 'Lorcana' },
          ] as { key: GameFilter; emoji: string; label: string }[]
        ).map(({ key, emoji, label }) => (
          <Pressable
            key={key}
            style={[styles.gameChip, gameFilter === key && styles.gameChipActive]}
            onPress={() => setGameFilter(key)}
          >
            <Text style={styles.gameChipEmoji}>{emoji}</Text>
            <Text style={[styles.gameChipLabel, gameFilter === key && styles.gameChipLabelActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && sets.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Setler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={flat}
          keyExtractor={(item, i) =>
            item.type === 'header' ? `h-${item.series}` : `s-${item.set.id}-${i}`
          }
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
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.seriesHeader}>{item.series}</Text>;
            }
            return <SetRow set={item.set} />;
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Set bulunamadı</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SetRow({ set }: { set: SetInfo }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.setRow, pressed && styles.setRowPressed]}
      onPress={() => router.push(`/(main)/browse/${set.id}`)}
    >
      {set.logoUrl ? (
        <RNImage source={{ uri: set.logoUrl }} style={styles.setLogo} resizeMode="contain" />
      ) : (
        <View style={[styles.setLogo, styles.setLogoPlaceholder]}>
          <Text style={styles.setLogoEmoji}>🃏</Text>
        </View>
      )}
      <View style={styles.setInfo}>
        <Text style={styles.setName}>{set.name}</Text>
        <Text style={styles.setMeta}>
          {set.releaseDate?.replace(/\//g, '.')} · {set.total} kart
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

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
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  searchToggle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchToggleText: { fontSize: 16 },
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
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  gameFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gameChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  gameChipEmoji: { fontSize: 13 },
  gameChipLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  gameChipLabelActive: { color: colors.primary },
  list: { paddingBottom: 100 },
  seriesHeader: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    paddingTop: spacing.lg,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  setRowPressed: { backgroundColor: colors.surfaceHover },
  setLogo: { width: 80, height: 40 },
  setLogoPlaceholder: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLogoEmoji: { fontSize: 20 },
  setInfo: { flex: 1 },
  setName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  setMeta: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  chevron: { color: colors.textFaint, fontSize: 20 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl * 2,
    gap: spacing.md,
  },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
