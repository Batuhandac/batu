import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { GAME_CONFIG } from '@/constants/games';
import { useCollectionStore } from '@/stores/collectionStore';

const PEOPLE_OPTIONS: DropdownOption[] = [
  { label: 'All followed + friends', value: 'all' },
  { label: 'Friends only', value: 'friends' },
  { label: 'Ahmet K.', value: 'friend-1' },
  { label: 'Mehmet Y.', value: 'friend-2' },
];

const EXPANSION_OPTIONS: DropdownOption[] = [
  { label: 'No set selected', value: '' },
  ...Object.values(GAME_CONFIG).flatMap((game) =>
    game.sets.map((set) => ({ label: set, value: set })),
  ),
];

export default function TradeScreen() {
  const { cards, folders } = useCollectionStore();
  const [goalExpansion, setGoalExpansion] = useState('');
  const [goalFolder, setGoalFolder] = useState('');
  const [people, setPeople] = useState('all');
  const [scope, setScope] = useState('');
  const [searched, setSearched] = useState(false);

  const folderOptions: DropdownOption[] = useMemo(
    () => [
      { label: 'Wishlist / folder not selected', value: '' },
      ...folders.map((folder) => ({ label: folder.name, value: folder.id })),
    ],
    [folders],
  );

  const duplicateUnits = cards.reduce((sum, item) => sum + Math.max(0, item.quantity - 1), 0);
  const suggestedMatches = Math.min(12, duplicateUnits + (goalExpansion ? 3 : 0) + (goalFolder ? 2 : 0));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Buy / Trade</Text>
          <Text style={styles.subtitle}>
            Find sellers and traders by wishlist, missing set cards, duplicates and friend graph.
          </Text>
        </View>

        <View style={styles.discoveryGrid}>
          <DiscoveryCard
            label="Find sellers"
            value="Local + global"
            detail="Cards listed by sellers will appear here once channel/provider data is connected."
          />
          <DiscoveryCard
            label="Find traders"
            value="Collector graph"
            detail="Match your missing cards against duplicates in friends and public trade folders."
          />
        </View>

        <TradeSection title="Goal" subtitle="Pick a set, collection folder or wishlist target.">
          <View style={styles.twoCol}>
            <View style={styles.colWrap}>
              <Text style={styles.colLabel}>Set</Text>
              <Dropdown
                options={EXPANSION_OPTIONS}
                value={goalExpansion}
                placeholder="Set"
                onChange={setGoalExpansion}
              />
            </View>
            <View style={styles.colWrap}>
              <Text style={styles.colLabel}>Wishlist / Folder</Text>
              <Dropdown
                options={folderOptions}
                value={goalFolder}
                placeholder="Wishlist"
                onChange={setGoalFolder}
              />
            </View>
          </View>
        </TradeSection>

        <TradeSection title="People" subtitle="Search all followed users, only friends, or one collector.">
          <Dropdown
            options={PEOPLE_OPTIONS}
            value={people}
            placeholder="All followed + friends"
            onChange={setPeople}
          />
        </TradeSection>

        <TradeSection title="Scope" subtitle="Narrow matches to trade folders, public collections or sale-enabled cards.">
          <Dropdown
            options={folderOptions}
            value={scope}
            placeholder="Public trade folders"
            onChange={setScope}
          />
        </TradeSection>

        {searched && (
          <View style={styles.resultsBox}>
            <Text style={styles.resultsTitle}>{suggestedMatches || 2} potential matches</Text>
            <Text style={styles.resultsText}>
              Matches will become live when Supabase public collections, wishlist rows and seller listings are connected.
            </Text>
            <View style={styles.matchRow}>
              <Text style={styles.matchName}>Trader duplicate match</Text>
              <Text style={styles.matchMeta}>{duplicateUnits} duplicate units available from your side</Text>
            </View>
            <View style={styles.matchRow}>
              <Text style={styles.matchName}>Seller discovery</Text>
              <Text style={styles.matchMeta}>Provider listings and user sale cards will populate here.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Find Matches"
          variant="primary"
          size="lg"
          style={styles.continueBtn}
          onPress={() => setSearched(true)}
        />
      </View>
    </SafeAreaView>
  );
}

function DiscoveryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.discoveryCard}>
      <Text style={styles.discoveryLabel}>{label}</Text>
      <Text style={styles.discoveryValue}>{value}</Text>
      <Text style={styles.discoveryDetail}>{detail}</Text>
    </View>
  );
}

function TradeSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    paddingBottom: 128,
  },
  header: { gap: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22 },
  discoveryGrid: { flexDirection: 'row', gap: spacing.md },
  discoveryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  discoveryLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900', textTransform: 'uppercase' },
  discoveryValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  discoveryDetail: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 17 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  sectionSubtitle: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  sectionContent: { marginTop: spacing.sm },
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  colWrap: { flex: 1, gap: spacing.xs },
  colLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900', textTransform: 'uppercase' },
  resultsBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultsTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  resultsText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  matchRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: 2,
  },
  matchName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  matchMeta: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueBtn: { width: '100%' },
});
