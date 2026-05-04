import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { usdToTry } from '@/lib/api/justtcg';

type FeedItem = {
  id: string;
  actor: string;
  kind: 'scan' | 'achievement' | 'trade' | 'wishlist';
  title: string;
  detail: string;
  meta: string;
};

const SOCIAL_SEED: FeedItem[] = [
  {
    id: 'friend-achievement-1',
    actor: 'Zeynep',
    kind: 'achievement',
    title: 'completed 72% of Paldean Fates',
    detail: '8 missing cards are available in friends/trade network.',
    meta: 'followed collector',
  },
  {
    id: 'friend-trade-1',
    actor: 'Ahmet',
    kind: 'trade',
    title: 'has 3 duplicate cards you need',
    detail: 'Potential match against your wishlist and missing-set list.',
    meta: 'friend match',
  },
  {
    id: 'followed-scan-1',
    actor: 'Mert Cards',
    kind: 'scan',
    title: 'verified a One Piece parallel rare',
    detail: 'Exact print matched by scan and catalog cross-check.',
    meta: 'followed seller',
  },
];

export default function FeedScreen() {
  const { profile } = useAuthStore();
  const { cards, totalValue } = useCollectionStore();
  const { badges, unlockedCount } = useBadgeStore();

  const feedItems = useMemo(() => {
    const recentCards: FeedItem[] = cards.slice(0, 3).map((item) => ({
      id: `scan-${item.id}`,
      actor: profile?.displayName ?? 'You',
      kind: 'scan',
      title: `scanned ${item.card.name}`,
      detail: `${item.card.setName} - ${item.condition}${item.foil ? ' - Foil' : ''}`,
      meta: item.price ? `TL ${Math.round(usdToTry(item.price.mid)).toLocaleString('tr-TR')}` : 'price pending',
    }));

    const badgeItems: FeedItem[] = badges
      .filter((badge) => !badge.locked)
      .slice(0, 2)
      .map((badge) => ({
        id: `badge-${badge.id}`,
        actor: profile?.displayName ?? 'You',
        kind: 'achievement',
        title: `unlocked ${badge.name}`,
        detail: badge.description,
        meta: 'achievement',
      }));

    return [...recentCards, ...badgeItems, ...SOCIAL_SEED];
  }, [badges, cards, profile?.displayName]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Feed</Text>
            <Text style={styles.subtitle}>Followed collectors, friends and achievements.</Text>
          </View>
          <Pressable style={styles.profilePill} onPress={() => router.push('/(main)/friends')}>
            <Text style={styles.profilePillText}>FRIENDS</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <Summary label="Following" value="0" />
          <Summary label="Friends" value="2" />
          <Summary label="Badges" value={String(unlockedCount)} accent />
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.panelKicker}>Social graph</Text>
          <Text style={styles.panelTitle}>Your collection becomes more valuable when the network can match missing cards.</Text>
          <View style={styles.panelStats}>
            <Text style={styles.panelStat}>{cards.length} unique prints</Text>
            <Text style={styles.panelStat}>TL {Math.round(usdToTry(totalValue)).toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        <View style={styles.feedList}>
          {feedItems.map((item) => (
            <FeedRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.summaryValueAccent]}>{value}</Text>
    </View>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const tone =
    item.kind === 'achievement'
      ? colors.accent
      : item.kind === 'trade'
        ? colors.success
        : item.kind === 'wishlist'
          ? colors.warning
          : colors.primary;

  return (
    <View style={styles.feedRow}>
      <View style={[styles.feedIcon, { borderColor: tone }]}>
        <Text style={[styles.feedIconText, { color: tone }]}>{item.kind.slice(0, 4).toUpperCase()}</Text>
      </View>
      <View style={styles.feedBody}>
        <Text style={styles.feedTitle}>
          <Text style={styles.feedActor}>{item.actor}</Text> {item.title}
        </Text>
        <Text style={styles.feedDetail}>{item.detail}</Text>
        <Text style={styles.feedMeta}>{item.meta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 112, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 3 },
  profilePill: {
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  profilePillText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summary: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', marginBottom: 4 },
  summaryValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  summaryValueAccent: { color: colors.primary },
  heroPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  panelKicker: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' },
  panelTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', lineHeight: 24 },
  panelStats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  panelStat: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '900',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  feedList: { gap: spacing.sm },
  feedRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  feedIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
  },
  feedIconText: { fontSize: 8, fontWeight: '900' },
  feedBody: { flex: 1, gap: 3 },
  feedTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', lineHeight: 21 },
  feedActor: { fontWeight: '900' },
  feedDetail: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  feedMeta: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
});
