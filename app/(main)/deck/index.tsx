import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useCollectionStore } from '@/stores/collectionStore';
import { buildDeckSummary } from '@/lib/collection/dexFeatures';

export default function DeckBuilderScreen() {
  const { cards } = useCollectionStore();
  const summary = useMemo(() => buildDeckSummary(cards as any), [cards]);
  const pokemonCards = cards.filter((item) => item.card.game === 'pokemon').slice(0, 18);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <Text style={styles.title}>Deck Builder</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Pokémon deck durumu</Text>
          <Text style={styles.scoreValue}>{summary.totalCards}/60</Text>
          <Text style={styles.scoreText}>
            {summary.readyForPlaytest
              ? '60 kart ve copy limitleri hazır.'
              : '60 karta tamamla, enerji/trainer dengesini ve 4-copy limitini kontrol et.'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Metric label="Pokémon" value={summary.pokemonCount.toString()} />
          <Metric label="Trainer" value={summary.trainerCount.toString()} />
          <Metric label="Energy" value={summary.energyCount.toString()} />
        </View>

        {summary.overCopyLimit.length > 0 && (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>Copy limit uyarısı</Text>
            <Text style={styles.warningText}>
              {summary.overCopyLimit.slice(0, 4).join(', ')} kartlarında 4 kopya üstü var.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deck havuzu</Text>
          <View style={styles.cardGrid}>
            {pokemonCards.map((item) => (
              <Pressable
                key={item.id}
                style={styles.cardThumb}
                onPress={() => router.push(`/(main)/collection/${item.id}`)}
              >
                <Image source={{ uri: item.card.imageUrl }} style={styles.image} contentFit="cover" />
                <Text style={styles.qty}>x{item.quantity}</Text>
              </Pressable>
            ))}
          </View>
          {pokemonCards.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Deck için Pokémon kartı yok</Text>
              <Text style={styles.emptyText}>Scan veya keşfet ekranından kart ekleyince otomatik dolar.</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
  content: { padding: spacing.xl, gap: spacing.xl },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  scoreLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  scoreValue: { color: colors.text, fontSize: 42, fontWeight: '800' },
  scoreText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  metricRow: { flexDirection: 'row', gap: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  metricLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  warning: {
    backgroundColor: colors.warningMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.lg,
    gap: 4,
  },
  warningTitle: { color: colors.warning, fontSize: fontSize.md, fontWeight: '800' },
  warningText: { color: colors.warning, fontSize: fontSize.sm, lineHeight: 20 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cardThumb: { width: '22%', aspectRatio: 0.714, borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%', backgroundColor: colors.surfaceAlt },
  qty: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    color: colors.text,
    backgroundColor: colors.overlay,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    fontSize: 10,
    fontWeight: '800',
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  bottomPad: { height: spacing.xxxl },
});
