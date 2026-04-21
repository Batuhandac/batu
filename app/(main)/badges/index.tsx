import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useBadgeStore, BADGE_CATEGORIES } from '@/stores/badgeStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { Badge, BadgeCategory } from '@/types';

export default function BadgesScreen() {
  const { badges, unlockedCount, compute } = useBadgeStore();
  const { cards, folders, totalValue } = useCollectionStore();
  const [filter, setFilter] = useState<BadgeCategory | 'all'>('all');

  useEffect(() => {
    compute(cards as any, folders, totalValue);
  }, [cards, folders, totalValue]);

  const filtered = filter === 'all' ? badges : badges.filter((b) => b.category === filter);
  const unlocked = filtered.filter((b) => !b.locked);
  const locked = filtered.filter((b) => b.locked);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <Text style={styles.title}>Rozetler</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{unlockedCount}/{badges.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterLabel, filter === 'all' && styles.filterLabelActive]}>
            Tümü
          </Text>
        </Pressable>
        {BADGE_CATEGORIES.map(({ key, label, emoji }) => (
          <Pressable
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={styles.filterEmoji}>{emoji}</Text>
            <Text style={[styles.filterLabel, filter === key && styles.filterLabelActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {unlocked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kazanıldı ({unlocked.length})</Text>
            <View style={styles.grid}>
              {unlocked.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          </View>
        )}

        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kilitli ({locked.length})</Text>
            <View style={styles.grid}>
              {locked.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <View style={[styles.badge, badge.locked && styles.badgeLocked]}>
      <Text style={[styles.badgeEmoji, badge.locked && styles.badgeEmojiLocked]}>
        {badge.locked ? '🔒' : badge.emoji}
      </Text>
      <Text style={[styles.badgeName, badge.locked && styles.badgeNameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>
        {badge.description}
      </Text>

      {badge.progress !== undefined && badge.locked && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${badge.progress * 100}%` }]} />
          </View>
          {badge.progressLabel && (
            <Text style={styles.progressLabel}>{badge.progressLabel}</Text>
          )}
        </View>
      )}

      {!badge.locked && (
        <View style={styles.unlockedTag}>
          <Text style={styles.unlockedText}>✓ Kazanıldı</Text>
        </View>
      )}
    </View>
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
  backBtn: { paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontSize: fontSize.md },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  countBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  filterScroll: { flexGrow: 0, marginBottom: spacing.md },
  filterRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  filterEmoji: { fontSize: 12 },
  filterLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  filterLabelActive: { color: colors.primary },
  content: { paddingHorizontal: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badge: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeLocked: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderLight,
    opacity: 0.7,
  },
  badgeEmoji: { fontSize: 32 },
  badgeEmojiLocked: { fontSize: 24 },
  badgeName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  badgeNameLocked: { color: colors.textMuted },
  badgeDesc: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  progressWrap: { gap: 3, marginTop: spacing.xs },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressLabel: { color: colors.textFaint, fontSize: 9 },
  unlockedTag: {
    marginTop: spacing.xs,
    backgroundColor: colors.successMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  unlockedText: { color: colors.success, fontSize: 9, fontWeight: '700' },
});
