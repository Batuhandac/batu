import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { TIER_CONFIG } from '@/constants/tiers';
import { useAuthStore } from '@/stores/authStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { useCollectionStore } from '@/stores/collectionStore';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const { cards, folders, totalValue } = useCollectionStore();
  const { badges, unlockedCount, compute } = useBadgeStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    compute(cards as any, folders, totalValue);
  }, [cards, folders, totalValue, compute]);

  const totalCards = cards.reduce((sum, item) => sum + item.quantity, 0);
  const tierCfg = TIER_CONFIG[profile?.tier ?? 'free'];

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            router.replace('/(auth)');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topIdentity}>
          <Avatar label={(profile?.displayName ?? 'C')[0]} small />
          <Text style={styles.brand}>Cardory</Text>
        </View>
        <View style={styles.iconButton}>
          <Text style={styles.iconButtonText}>SRCH</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Avatar label={(profile?.displayName ?? 'U')[0]} />
          <View style={styles.profileText}>
            <Text style={styles.displayName}>{profile?.displayName ?? 'Collector'}</Text>
            <Text style={styles.username}>@{profile?.username ?? 'guest'}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{tierCfg.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Cards" value={String(totalCards)} onPress={() => router.push('/(main)/collection')} />
          <Stat label="Badges" value={String(unlockedCount)} onPress={() => router.push('/(main)/badges')} />
          <Stat label="Friends" value="0" onPress={() => router.push('/(main)/friends')} />
        </View>

        <Section title="Sales Channels">
          <Channel name="Shopify" status="Credential needed" tone="warning" />
          <Channel name="ikas" status="Credential needed" tone="warning" />
          <Channel name="eBay" status="OAuth needed" tone="error" />
          <Channel name="Trendyol" status="Connect" tone="primary" />
          <Channel name="Hepsiburada" status="Merchant needed" tone="warning" />
        </Section>

        <Section title="API and Scanning">
          <Row label="Scan API" detail="Server pipeline: GiblTCG, PokemonTCG, Anthropic and game catalogs." value="Ready" />
          <Row label="Price Provider" detail="Server-side pricing and FX engine." value="Ready" />
          <Row label="Server Location" detail="Choose EU region before production if Turkey latency matters." value="EU next" />
        </Section>

        <Section title="Experience">
          <ToggleRow label="Dark Theme" detail="Cardory dark cockpit theme." enabled />
          <ToggleRow label="Push Notifications" detail="Sales, sync, repricing and trade alerts." enabled={false} />
          <Row label="Export Data" detail="CSV/catalog export for shops and collectors." value="Ready" />
          <Row label="Security Settings" detail="Account, session and API token controls." value="Open" />
        </Section>

        <Section title="Explore">
          <Row label="Pokedex" detail="Track Pokemon completion." value={`${cards.length}`} onPress={() => router.push('/(main)/pokedex')} />
          <Row label="Badges" detail={`${unlockedCount}/${badges.length} badges unlocked.`} value="View" onPress={() => router.push('/(main)/badges')} />
          <Row label="Stats" detail="Portfolio analysis and market changes." value="View" onPress={() => router.push('/(main)/stats')} />
          <Row label="Friends" detail="Trade graph and collector matching." value="View" onPress={() => router.push('/(main)/friends')} />
        </Section>

        <Section title="Subscription">
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tierCfg.label}</Text>
              <Text style={styles.tierPrice}>{tierCfg.price}</Text>
            </View>
            <Text style={styles.tierDesc}>{tierCfg.description}</Text>
            {profile?.tier === 'free' && (
              <Button label="Upgrade" variant="primary" size="sm" style={styles.upgradeButton} onPress={() => {}} />
            )}
          </View>
        </Section>

        <Section title="Account">
          <Row label="Change Username" value="Open" />
          <Row label="Change Password" value="Open" />
          <Row label="Delete Account" value="Danger" destructive />
        </Section>

        <Button
          label="Sign Out"
          variant="ghost"
          size="lg"
          loading={signingOut}
          style={styles.signOutButton}
          onPress={handleSignOut}
        />
        <Text style={styles.version}>Cardory v1.0 - TCG operating system</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Avatar({ label, small }: { label: string; small?: boolean }) {
  return (
    <View style={[styles.avatar, small && styles.avatarSmall]}>
      <Text style={[styles.avatarText, small && styles.avatarTextSmall]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.statBox} onPress={onPress}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBox}>{children}</View>
    </View>
  );
}

function Channel({ name, status, tone }: { name: string; status: string; tone: 'primary' | 'warning' | 'error' }) {
  const color = tone === 'primary' ? colors.primary : tone === 'warning' ? colors.warning : colors.error;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}22` }]} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{name}</Text>
        <Text style={styles.rowDetail}>Server endpoint is ready; secure credentials stay off the client.</Text>
      </View>
      <View style={[styles.statusPill, { borderColor: color }]}>
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    </View>
  );
}

function Row({
  label,
  detail,
  value,
  destructive,
  onPress,
}: {
  label: string;
  detail?: string;
  value?: string;
  destructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress ?? (() => {})}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && styles.destructiveText]}>{label}</Text>
        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      </View>
      {value && <Text style={[styles.rowValue, destructive && styles.destructiveText]}>{value}</Text>}
    </Pressable>
  );
}

function ToggleRow({ label, detail, enabled }: { label: string; detail: string; enabled: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <View style={[styles.toggle, enabled && styles.toggleEnabled]}>
        <View style={[styles.toggleKnob, enabled && styles.toggleKnobEnabled]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  topIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brand: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '900' },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconButtonText: { color: colors.textMuted, fontSize: 8, fontWeight: '900' },
  content: { padding: spacing.xl, paddingBottom: 112, gap: spacing.xl },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarSmall: { width: 34, height: 34, borderColor: colors.border, backgroundColor: colors.surface },
  avatarText: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '900' },
  avatarTextSmall: { fontSize: fontSize.sm },
  profileText: { flex: 1, gap: 4 },
  displayName: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900' },
  username: { color: colors.textMuted, fontSize: fontSize.sm },
  tierBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tierBadgeText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', marginBottom: 4 },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  section: { gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowPressed: { backgroundColor: colors.surfaceHover },
  rowIcon: { width: 30, height: 30, borderRadius: radius.lg },
  rowText: { flex: 1 },
  rowLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  rowDetail: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18, marginTop: 2 },
  rowValue: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '900' },
  destructiveText: { color: colors.error },
  statusPill: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: 108,
  },
  statusText: { fontSize: 9, fontWeight: '900', textAlign: 'center' },
  toggle: {
    width: 42,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  toggleEnabled: { backgroundColor: colors.primary },
  toggleKnob: { width: 18, height: 18, borderRadius: radius.full, backgroundColor: colors.textMuted },
  toggleKnobEnabled: { marginLeft: 16, backgroundColor: colors.onPrimary },
  tierCard: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surfaceLow },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  tierPrice: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900' },
  tierDesc: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  upgradeButton: { alignSelf: 'flex-start', marginTop: spacing.sm },
  signOutButton: { marginTop: spacing.sm },
  version: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center' },
});
