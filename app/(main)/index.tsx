import React, { useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { usdToTry } from '@/lib/api/justtcg';
import { GEN1 } from '@/constants/pokemon';

export default function DashboardScreen() {
  const { profile, user } = useAuthStore();
  const { cards, folders, loading, fetchCollection, fetchFolders, refreshPrices, totalValue } =
    useCollectionStore();
  const { badges, unlockedCount, compute } = useBadgeStore();

  useEffect(() => {
    if (user) {
      fetchCollection(user.id);
      fetchFolders(user.id);
    }
  }, [user, fetchCollection, fetchFolders]);

  useEffect(() => {
    compute(cards as any, folders, totalValue);
  }, [cards, folders, totalValue]);

  const onRefresh = async () => {
    if (!user) return;
    await fetchCollection(user.id);
    await refreshPrices();
  };

  const recentCards = cards.slice(0, 6);
  const tryValue = usdToTry(totalValue);
  const totalCards = cards.reduce((s, c) => s + c.quantity, 0);

  const dexCount = useMemo(() => {
    const owned = new Set<string>();
    for (const uc of cards) {
      for (const p of GEN1) {
        if (uc.card.name.toLowerCase().includes(p.name.toLowerCase())) owned.add(p.name);
      }
    }
    return owned.size;
  }, [cards]);

  const nearBadges = badges
    .filter((b) => b.locked && b.progress !== undefined && b.progress > 0)
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba, {profile?.displayName ?? '👋'}</Text>
            <Text style={styles.subGreeting}>Koleksiyonun seni bekliyor</Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => router.push('/(main)/settings')}>
            <Text style={styles.avatarText}>
              {(profile?.displayName ?? 'U')[0].toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Toplam Portföy Değeri</Text>
          <Text style={styles.portfolioValue}>₺{tryValue.toLocaleString('tr-TR')}</Text>
          {totalValue > 0 && (
            <Text style={styles.portfolioUsd}>${totalValue.toFixed(2)} USD</Text>
          )}
          <View style={styles.portfolioStats}>
            <Stat label="Kart" value={totalCards.toString()} />
            <View style={styles.statDivider} />
            <Stat label="Tekil" value={cards.length.toString()} />
            <View style={styles.statDivider} />
            <Stat label="Klasör" value={folders.length.toString()} />
            <View style={styles.statDivider} />
            <Stat label="Rozet" value={unlockedCount.toString()} />
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction emoji="📷" label="Tara" onPress={() => router.push('/(main)/scan')} />
          <QuickAction emoji="🔍" label="Keşfet" onPress={() => router.push('/(main)/browse')} />
          <QuickAction emoji="🔄" label="Takas" onPress={() => router.push('/(main)/trade')} />
          <QuickAction emoji="📊" label="İstatistik" onPress={() => router.push('/(main)/stats')} />
        </View>

        {dexCount > 0 && (
          <Pressable
            style={styles.dexCard}
            onPress={() => router.push('/(main)/pokedex')}
          >
            <View style={styles.dexLeft}>
              <Text style={styles.dexEmoji}>🎯</Text>
              <View>
                <Text style={styles.dexTitle}>Pokédex İlerlemesi</Text>
                <Text style={styles.dexSub}>{dexCount}/151 Gen 1 Pokémon yakalandı</Text>
              </View>
            </View>
            <View style={styles.dexRight}>
              <Text style={styles.dexPct}>{Math.round((dexCount / 151) * 100)}%</Text>
            </View>
          </Pressable>
        )}

        {nearBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yakındaki Rozetler</Text>
              <Pressable onPress={() => router.push('/(main)/badges')}>
                <Text style={styles.seeAll}>Tümünü Gör →</Text>
              </Pressable>
            </View>
            <View style={styles.badgeRow}>
              {nearBadges.map((badge) => (
                <Pressable
                  key={badge.id}
                  style={styles.badgeCard}
                  onPress={() => router.push('/(main)/badges')}
                >
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
                  <View style={styles.badgeProgressBar}>
                    <View
                      style={[
                        styles.badgeProgressFill,
                        { width: `${(badge.progress ?? 0) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.badgeProgressLabel}>{badge.progressLabel}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {recentCards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Eklenenler</Text>
              <Pressable onPress={() => router.push('/(main)/collection')}>
                <Text style={styles.seeAll}>Tümünü Gör →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
              {recentCards.map((uc) => (
                <Pressable
                  key={uc.id}
                  style={styles.recentCard}
                  onPress={() => router.push(`/(main)/collection/${uc.id}`)}
                >
                  <Image
                    source={{ uri: uc.card.imageUrl }}
                    style={styles.recentImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {uc.price && (
                    <Text style={styles.recentPrice}>
                      ₺{usdToTry(uc.price.mid).toLocaleString()}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {cards.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyTitle}>Koleksiyonun boş</Text>
            <Text style={styles.emptyText}>
              İlk kartını taramak için kamera simgesine dokun.
            </Text>
            <View style={styles.emptyBtns}>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/(main)/scan')}>
                <Text style={styles.emptyBtnText}>Kart Tara</Text>
              </Pressable>
              <Pressable
                style={[styles.emptyBtn, styles.emptyBtnSecondary]}
                onPress={() => router.push('/(main)/browse')}
              >
                <Text style={styles.emptyBtnSecondaryText}>Kart Keşfet</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  emoji,
  label,
  onPress,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.qaBtn, pressed && styles.qaPressed]}
      onPress={onPress}
    >
      <Text style={styles.qaEmoji}>{emoji}</Text>
      <Text style={styles.qaLabel}>{label}</Text>
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
    paddingBottom: spacing.lg,
  },
  greeting: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  subGreeting: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '700' },
  portfolioCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portfolioLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  portfolioValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  portfolioUsd: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  portfolioStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  qaBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qaPressed: { opacity: 0.7 },
  qaEmoji: { fontSize: 22 },
  qaLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  dexCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dexLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  dexEmoji: { fontSize: 28 },
  dexTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  dexSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  dexRight: {},
  dexPct: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800' },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  seeAll: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeEmoji: { fontSize: 22 },
  badgeName: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
  badgeProgressBar: {
    height: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: 2,
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  badgeProgressLabel: { color: colors.textFaint, fontSize: 9 },
  recentScroll: { paddingLeft: spacing.xl },
  recentCard: { width: 90, marginRight: spacing.md },
  recentImage: {
    width: 90,
    height: 126,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  recentPrice: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  emptyBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBtnSecondaryText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  bottomPad: { height: spacing.xxxl },
});
