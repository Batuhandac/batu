import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useCollectionStore } from '@/stores/collectionStore';
import { useStatsStore } from '@/stores/statsStore';
import { GAME_LABELS, Condition } from '@/types';
import { usdToTry } from '@/lib/api/justtcg';

const CONDITION_COLOR: Record<Condition, string> = {
  NM: colors.success,
  LP: '#58A6FF',
  MP: colors.warning,
  HP: '#FF7B72',
  DMG: colors.error,
};

export default function StatsScreen() {
  const { cards, totalValue } = useCollectionStore();
  const { stats, compute } = useStatsStore();

  useEffect(() => {
    compute(cards as any, totalValue);
  }, [cards, totalValue]);

  if (!stats) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </Pressable>
          <Text style={styles.title}>İstatistikler</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Henüz koleksiyonun yok</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalTry = usdToTry(stats.totalValueUsd);
  const topRarities = Object.entries(stats.rarityBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxRarityCount = topRarities[0]?.[1] ?? 1;

  const gameEntries = Object.entries(stats.valueByGame).filter(([, v]) => v > 0);
  const maxGameValue = Math.max(...gameEntries.map(([, v]) => v), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <Text style={styles.title}>İstatistikler</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <StatBox label="Toplam Kart" value={stats.totalCards.toString()} emoji="🃏" />
          <StatBox label="Tekil" value={stats.uniqueCards.toString()} emoji="🔢" />
          <StatBox label="Foil" value={stats.foilCount.toString()} emoji="✨" />
          <StatBox label="Oyun" value={stats.gamesCount.toString()} emoji="🎮" />
        </View>

        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Toplam Koleksiyon Değeri</Text>
          <Text style={styles.valueTry}>₺{totalTry.toLocaleString('tr-TR')}</Text>
          <Text style={styles.valueUsd}>${stats.totalValueUsd.toFixed(2)} USD</Text>
        </View>

        {gameEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Oyuna Göre Değer</Text>
            <View style={styles.card}>
              {gameEntries.map(([game, value]) => (
                <View key={game} style={styles.barRow}>
                  <Text style={styles.barLabel}>
                    {GAME_LABELS[game as keyof typeof GAME_LABELS] ?? game}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(value / maxGameValue) * 100}%` },
                        { backgroundColor: getGameColor(game) },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>
                    ₺{usdToTry(value).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duruma Göre Dağılım</Text>
          <View style={styles.card}>
            {(Object.entries(stats.conditionBreakdown) as [Condition, number][])
              .filter(([, v]) => v > 0)
              .map(([cond, count]) => (
                <View key={cond} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: CONDITION_COLOR[cond] }]}>{cond}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(count / stats.totalCards) * 100}%`,
                          backgroundColor: CONDITION_COLOR[cond],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              ))}
          </View>
        </View>

        {topRarities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nadirlik Dağılımı</Text>
            <View style={styles.card}>
              {topRarities.map(([rarity, count]) => (
                <View key={rarity} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {rarity}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(count / maxRarityCount) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {stats.topCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En Değerli Kartlar</Text>
            {stats.topCards.map((uc, i) => (
              <Pressable
                key={uc.id}
                style={({ pressed }) => [styles.topCardRow, pressed && { opacity: 0.7 }]}
                onPress={() => router.push(`/(main)/collection/${uc.id}`)}
              >
                <Text style={styles.topCardRank}>#{i + 1}</Text>
                <Image
                  source={{ uri: uc.card.imageUrl }}
                  style={styles.topCardImg}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.topCardInfo}>
                  <Text style={styles.topCardName} numberOfLines={1}>
                    {uc.card.name}
                  </Text>
                  <Text style={styles.topCardSet}>{uc.card.setName}</Text>
                </View>
                <Text style={styles.topCardValue}>
                  ₺{usdToTry(uc.price?.mid ?? 0).toLocaleString()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={statBoxStyles.wrap}>
      <Text style={statBoxStyles.emoji}>{emoji}</Text>
      <Text style={statBoxStyles.value}>{value}</Text>
      <Text style={statBoxStyles.label}>{label}</Text>
    </View>
  );
}

const statBoxStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 20 },
  value: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  label: { color: colors.textMuted, fontSize: fontSize.xs },
});

function getGameColor(game: string): string {
  const map: Record<string, string> = {
    pokemon: '#FFCB05',
    yugioh: '#4A90D9',
    onepiece: '#E63946',
    mtg: '#7C3AED',
    lorcana: '#0EA5E9',
  };
  return map[game] ?? colors.primary;
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
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.lg },
  content: { padding: spacing.xl, gap: spacing.xl },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  valueCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valueLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  valueTry: { color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  valueUsd: { color: colors.textMuted, fontSize: fontSize.md },
  section: { gap: spacing.md },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    width: 90,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  barValue: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topCardRank: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontWeight: '700',
    width: 24,
  },
  topCardImg: {
    width: 36,
    height: 50,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  topCardInfo: { flex: 1 },
  topCardName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  topCardSet: { color: colors.textMuted, fontSize: fontSize.xs },
  topCardValue: { color: colors.success, fontSize: fontSize.sm, fontWeight: '700' },
});
