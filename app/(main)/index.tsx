import React, { useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { usdToTry } from '@/lib/api/justtcg';

export default function DashboardScreen() {
  const { profile, user } = useAuthStore();
  const { cards, folders, loading, fetchCollection, fetchFolders, refreshPrices, totalValue } =
    useCollectionStore();

  useEffect(() => {
    if (user) {
      fetchCollection(user.id);
      fetchFolders(user.id);
    }
  }, [user, fetchCollection, fetchFolders]);

  const onRefresh = async () => {
    if (!user) return;
    await fetchCollection(user.id);
    await refreshPrices();
  };

  const recentCards = cards.slice(0, 6);
  const tryValue = usdToTry(totalValue);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}
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
          <Text style={styles.portfolioValue}>
            ₺{tryValue.toLocaleString('tr-TR')}
          </Text>
          {totalValue > 0 && (
            <Text style={styles.portfolioUsd}>${totalValue.toFixed(2)} USD</Text>
          )}
          <View style={styles.portfolioStats}>
            <Stat label="Kart" value={cards.reduce((s, c) => s + c.quantity, 0).toString()} />
            <View style={styles.statDivider} />
            <Stat label="Tekil" value={cards.length.toString()} />
            <View style={styles.statDivider} />
            <Stat label="Klasör" value={folders.length.toString()} />
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            emoji="📷"
            label="Tara"
            onPress={() => router.push('/(main)/scan')}
          />
          <QuickAction
            emoji="🗂"
            label="Koleksiyon"
            onPress={() => router.push('/(main)/collection/')}
          />
          <QuickAction
            emoji="🔄"
            label="Takas"
            onPress={() => router.push('/(main)/trade/')}
          />
          <QuickAction
            emoji="📦"
            label="Sat"
            onPress={() => router.push('/(main)/settings')}
          />
        </View>

        {recentCards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Eklenenler</Text>
              <Pressable onPress={() => router.push('/(main)/collection/')}>
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
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push('/(main)/scan')}
            >
              <Text style={styles.emptyBtnText}>İlk Kartı Tara</Text>
            </Pressable>
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

function QuickAction({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
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
  greeting: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subGreeting: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
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
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
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
  qaLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  seeAll: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  recentScroll: {
    paddingLeft: spacing.xl,
  },
  recentCard: {
    width: 90,
    marginRight: spacing.md,
  },
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
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  bottomPad: { height: spacing.xxxl },
});
