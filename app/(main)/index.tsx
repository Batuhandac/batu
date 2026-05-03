import React, { useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { GEN1 } from '@/constants/pokemon';
import { versionLabel } from '@/constants/version';
import { usdToTry } from '@/lib/api/justtcg';

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
  }, [cards, folders, totalValue, compute]);

  const onRefresh = async () => {
    if (!user) return;
    await fetchCollection(user.id);
    await refreshPrices();
  };

  const totalCards = cards.reduce((sum, item) => sum + item.quantity, 0);
  const tryValue = usdToTry(totalValue);
  const recentCards = cards.slice(0, 6);

  const dexCount = useMemo(() => {
    const owned = new Set<string>();
    for (const userCard of cards) {
      for (const pokemon of GEN1) {
        if (userCard.card.name.toLowerCase().includes(pokemon.name.toLowerCase())) {
          owned.add(pokemon.name);
        }
      }
    }
    return owned.size;
  }, [cards]);

  const nearBadges = badges
    .filter((badge) => badge.locked && badge.progress !== undefined && badge.progress > 0)
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
    .slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.identity} onPress={() => router.push('/(main)/settings')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.displayName ?? 'C')[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.brand}>Cardory</Text>
              <Text style={styles.build}>build {versionLabel()}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(main)/browse')}>
            <Text style={styles.iconButtonText}>SRCH</Text>
          </Pressable>
        </View>

        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greeting}>Good morning, {profile?.displayName ?? 'Collector'}</Text>
            <Text style={styles.subGreeting}>Portfolio synced just now.</Text>
          </View>
        </View>

        <View style={styles.portfolioCard}>
          <View style={styles.glow} />
          <View style={styles.portfolioHeader}>
            <View style={styles.valueBlock}>
              <Text style={styles.labelCaps}>Total value (TRY)</Text>
              <View style={styles.valueLine}>
                <Text style={styles.portfolioValue}>TL {tryValue.toLocaleString('tr-TR')}</Text>
                <Text style={styles.trend}>+2.4%</Text>
              </View>
              <Text style={styles.usdValue}>~ ${totalValue.toFixed(2)} USD market value</Text>
            </View>
            <Pressable style={styles.scanPill} onPress={() => router.push('/(main)/scan')}>
              <Text style={styles.scanPillText}>SCAN</Text>
            </Pressable>
          </View>

          <View style={styles.metricsGrid}>
            <Metric label="Total cards" value={String(totalCards)} icon="CARD" />
            <Metric label="Unique" value={String(cards.length)} icon="UNIQ" />
            <Metric label="Folders" value={String(folders.length)} icon="FLDR" />
            <Metric label="Badges" value={String(unlockedCount)} icon="BDGE" />
          </View>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction label="Sets" icon="SETS" onPress={() => router.push('/(main)/browse')} />
          <QuickAction label="Trade" icon="TRDE" onPress={() => router.push('/(main)/trade')} />
          <QuickAction label="Value" icon="VALU" onPress={() => router.push('/(main)/stats')} />
          <QuickAction label="Ops" icon="OPS" onPress={() => router.push('/(main)/ops' as any)} />
          <QuickAction label="Deck" icon="DECK" onPress={() => router.push('/(main)/deck' as any)} />
          <QuickAction label="Folders" icon="FOLD" onPress={() => router.push('/(main)/collection')} />
        </View>

        <View style={styles.splitRow}>
          <Pressable style={styles.progressCard} onPress={() => router.push('/(main)/pokedex')}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.moduleTitle}>Pokedex Progress</Text>
              <Text style={styles.moduleValue}>{Math.round((dexCount / 151) * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (dexCount / 151) * 100)}%` }]} />
            </View>
            <Text style={styles.moduleHint}>{dexCount}/151 Gen 1 Pokemon owned</Text>
          </Pressable>

          <Pressable style={styles.progressCard} onPress={() => router.push('/(main)/badges')}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.moduleTitle}>Nearby Badges</Text>
              <Text style={styles.linkText}>VIEW</Text>
            </View>
            <View style={styles.badgeDots}>
              {nearBadges.length ? (
                nearBadges.map((badge) => (
                  <View key={badge.id} style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>{badge.emoji}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.badgeDot}><Text style={styles.badgeDotText}>FIRE</Text></View>
                  <View style={styles.badgeDot}><Text style={styles.badgeDotText}>SET</Text></View>
                  <View style={[styles.badgeDot, styles.lockedDot]}><Text style={styles.badgeDotText}>LOCK</Text></View>
                </>
              )}
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <Pressable onPress={() => router.push('/(main)/collection')}>
            <Text style={styles.linkText}>SEE ALL</Text>
          </Pressable>
        </View>

        {recentCards.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {recentCards.map((item) => (
              <Pressable
                key={item.id}
                style={styles.recentCard}
                onPress={() => router.push(`/(main)/collection/${item.id}`)}
              >
                <View style={styles.recentImageWrap}>
                  <Image source={{ uri: item.card.imageUrl }} style={styles.recentImage} contentFit="cover" />
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>OK</Text>
                  </View>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>{item.card.name}</Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>{item.card.setName}</Text>
                  <Text style={styles.recentPrice}>
                    {item.price ? `TL ${usdToTry(item.price.mid).toLocaleString('tr-TR')}` : 'Estimating'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptyText}>
              Start with a scan. Verified cards will appear here with price and set data.
            </Text>
            <Pressable style={styles.emptyAction} onPress={() => router.push('/(main)/scan')}>
              <Text style={styles.emptyActionText}>Scan first card</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 112 },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surfaceLowest,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '900', fontSize: fontSize.sm },
  brand: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900', letterSpacing: -0.3 },
  build: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '800' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconButtonText: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  welcomeRow: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  greeting: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.3 },
  subGreeting: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 3 },
  portfolioCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -90,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.primaryMuted,
  },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  valueBlock: { flex: 1 },
  labelCaps: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  valueLine: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' },
  portfolioValue: { color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -0.5 },
  trend: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900', marginBottom: 5 },
  usdValue: { color: colors.textFaint, fontSize: fontSize.sm, marginTop: spacing.xs },
  scanPill: {
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPillText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '900' },
  metricsGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  metric: {
    flex: 1,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.xs,
  },
  metricIcon: { color: colors.textFaint, fontSize: 9, fontWeight: '900', marginBottom: 4 },
  metricValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  metricLabel: { color: colors.textMuted, fontSize: 9, marginTop: 3, textAlign: 'center' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  quickAction: {
    width: '31.8%',
    height: 82,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: { opacity: 0.78 },
  quickIcon: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  quickLabel: { color: colors.text, fontSize: fontSize.xs, fontWeight: '900' },
  splitRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  progressCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  moduleTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900', flex: 1 },
  moduleValue: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '900' },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  moduleHint: { color: colors.textFaint, fontSize: fontSize.xs, marginTop: spacing.sm },
  badgeDots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  badgeDot: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedDot: { opacity: 0.45, borderStyle: 'dashed' },
  badgeDotText: { color: colors.textMuted, fontSize: 8, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  linkText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 0.8 },
  recentRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  recentCard: {
    width: 144,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  recentImageWrap: { height: 196, backgroundColor: colors.surfaceLowest, position: 'relative' },
  recentImage: { width: '100%', height: '100%' },
  verifiedPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(14,14,16,0.86)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  verifiedText: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  recentInfo: { padding: spacing.md, gap: 3 },
  recentName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  recentMeta: { color: colors.textFaint, fontSize: fontSize.xs },
  recentPrice: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', marginTop: 2 },
  emptyState: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  emptyAction: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyActionText: { color: colors.onPrimary, fontSize: fontSize.sm, fontWeight: '900' },
});
