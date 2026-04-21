import React, { useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useCollectionStore } from '@/stores/collectionStore';
import { GEN1, GEN2, PokemonEntry } from '@/constants/pokemon';

const { width } = Dimensions.get('window');
const COLS = 5;
const CELL = (width - spacing.xl * 2 - spacing.sm * (COLS - 1)) / COLS;

type GenFilter = 'gen1' | 'gen2' | 'all';

export default function PokedexScreen() {
  const { cards } = useCollectionStore();
  const [genFilter, setGenFilter] = React.useState<GenFilter>('gen1');

  const ownedNames = useMemo(() => {
    const set = new Set<string>();
    const allPokemon = [...GEN1, ...GEN2];
    for (const uc of cards) {
      for (const p of allPokemon) {
        if (uc.card.name.toLowerCase().includes(p.name.toLowerCase())) {
          set.add(p.name);
        }
      }
    }
    return set;
  }, [cards]);

  const pokemonList: PokemonEntry[] =
    genFilter === 'gen1' ? GEN1 : genFilter === 'gen2' ? GEN2 : [...GEN1, ...GEN2];

  const ownedCount = pokemonList.filter((p) => ownedNames.has(p.name)).length;
  const pct = pokemonList.length > 0 ? Math.round((ownedCount / pokemonList.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <Text style={styles.title}>Pokédex</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>İlerleme</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressSub}>
          {ownedCount} / {pokemonList.length} Pokémon yakalandı
        </Text>
      </View>

      <View style={styles.genFilters}>
        {(
          [
            { key: 'gen1', label: 'Gen 1 (1-151)' },
            { key: 'gen2', label: 'Gen 2 (152-251)' },
            { key: 'all', label: 'Tümü' },
          ] as { key: GenFilter; label: string }[]
        ).map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.genBtn, genFilter === key && styles.genBtnActive]}
            onPress={() => setGenFilter(key)}
          >
            <Text style={[styles.genLabel, genFilter === key && styles.genLabelActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={pokemonList}
        keyExtractor={(item) => String(item.number)}
        numColumns={COLS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const owned = ownedNames.has(item.name);
          return (
            <View style={[styles.cell, owned && styles.cellOwned]}>
              <Text style={[styles.cellNumber, owned && styles.cellNumberOwned]}>
                #{String(item.number).padStart(3, '0')}
              </Text>
              <Text style={styles.cellEmoji}>{getPokemonEmoji(item.name)}</Text>
              <Text style={[styles.cellName, owned && styles.cellNameOwned]} numberOfLines={1}>
                {item.name}
              </Text>
              {owned && <View style={styles.ownedDot} />}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function getPokemonEmoji(name: string): string {
  const map: Record<string, string> = {
    Charizard: '🔥', Pikachu: '⚡', Mewtwo: '🔮', Mew: '✨',
    Gengar: '👻', Eevee: '🦊', Gyarados: '🌊', Snorlax: '😴',
    Dragonite: '🐉', Articuno: '❄️', Zapdos: '⚡', Moltres: '🔥',
    Blastoise: '💧', Venusaur: '🌿', Magikarp: '🐟', Ditto: '💜',
    Jigglypuff: '🎤', Meowth: '🐱', Bulbasaur: '🌱', Squirtle: '🐢',
    Charmander: '🦎', Lapras: '🦕', Vaporeon: '💧', Flareon: '🔥',
    Jolteon: '⚡', Espeon: '🌙', Umbreon: '🌑', Lugia: '🌊', 'Ho-oh': '🌈',
    Tyranitar: '🦖', Suicune: '💙', Raikou: '⚡', Entei: '🔥',
  };
  return map[name] ?? '🃏';
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
  backBtn: { paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontSize: fontSize.md },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  progressCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  progressPct: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800' },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressSub: { color: colors.textMuted, fontSize: fontSize.xs },
  genFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genBtn: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genBtnActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  genLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  genLabelActive: { color: colors.primary },
  grid: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  cell: {
    width: CELL,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.45,
  },
  cellOwned: {
    opacity: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  cellNumber: { color: colors.textFaint, fontSize: 8 },
  cellNumberOwned: { color: colors.primary },
  cellEmoji: { fontSize: 20 },
  cellName: {
    color: colors.textFaint,
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellNameOwned: { color: colors.text },
  ownedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
});
