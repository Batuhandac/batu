import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { TIER_CONFIG } from '@/constants/tiers';
import { useAuthStore } from '@/stores/authStore';

const CHANNELS = [
  { name: 'Shopify', status: 'Integration ready', detail: 'Push product title, SKU, image, price and inventory.' },
  { name: 'ikas', status: 'Integration ready', detail: 'Turkey-first storefront sync via server bridge.' },
  { name: 'eBay', status: 'Coming soon', detail: 'Inventory item, offer and publish flow.' },
  { name: 'Trendyol', status: 'Coming soon', detail: 'Catalog + price/inventory batch bridge.' },
];

export default function SellScreen() {
  const { profile } = useAuthStore();
  const tier = profile?.tier ?? 'free';
  const canSell = tier !== 'free' && tier !== 'premium';
  const tierCfg = TIER_CONFIG[tier];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>BACK</Text>
          </Pressable>
          <Text style={styles.title}>Sell</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>Premium plan only</Text>
          <Text style={styles.heroTitle}>Integrations, not a marketplace.</Text>
          <Text style={styles.heroText}>
            Cardory will push verified cards to your own sales channels. Marketplace liquidity stays in Buy/Trade.
          </Text>
          <View style={[styles.accessPill, canSell ? styles.accessOpen : styles.accessLocked]}>
            <Text style={[styles.accessText, canSell ? styles.accessOpenText : styles.accessLockedText]}>
              {canSell ? 'Unlocked for your plan' : `${tierCfg.label} - upgrade required`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Channels</Text>
          {CHANNELS.map((channel) => (
            <View key={channel.name} style={styles.channelRow}>
              <View style={styles.channelIcon}>
                <Text style={styles.channelIconText}>{channel.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.channelBody}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.channelDetail}>{channel.detail}</Text>
              </View>
              <Text style={styles.channelStatus}>{channel.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.icedBox}>
          <Text style={styles.icedTitle}>Iced, coming soon</Text>
          <Text style={styles.icedText}>
            No public marketplace at launch. First release focuses on scan accuracy, collection, buy/trade discovery,
            and premium integration rails.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 112, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    minWidth: 48,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backText: { color: colors.textMuted, fontSize: 9, fontWeight: '900' },
  title: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '900' },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  kicker: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -0.3 },
  heroText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  accessPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  accessOpen: { borderColor: colors.success, backgroundColor: colors.successMuted },
  accessLocked: { borderColor: colors.warning, backgroundColor: colors.warningMuted },
  accessText: { fontSize: fontSize.xs, fontWeight: '900' },
  accessOpenText: { color: colors.success },
  accessLockedText: { color: colors.warning },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  channelIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  channelIconText: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  channelBody: { flex: 1 },
  channelName: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  channelDetail: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 17, marginTop: 2 },
  channelStatus: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', maxWidth: 92, textAlign: 'right' },
  icedBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  icedTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  icedText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
});
