import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TIER_CONFIG } from '@/constants/tiers';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const { cards, folders, totalValue } = useCollectionStore();
  const { badges, unlockedCount, compute } = useBadgeStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    compute(cards as any, folders, totalValue);
  }, [cards, folders, totalValue]);

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
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

  const tierCfg = TIER_CONFIG[profile?.tier ?? 'free'];
  const totalCards = cards.reduce((s, c) => s + c.quantity, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.displayName ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profile?.displayName}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
          </View>
          <Badge label={tierCfg.label} variant={tierCfg.badgeVariant as any} />
        </View>

        <View style={styles.statsRow}>
          <Pressable style={styles.statBox} onPress={() => router.push('/(main)/stats')}>
            <Text style={styles.statValue}>{totalCards}</Text>
            <Text style={styles.statLabel}>Kart</Text>
          </Pressable>
          <Pressable style={styles.statBox} onPress={() => router.push('/(main)/badges')}>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Rozet</Text>
          </Pressable>
          <Pressable style={styles.statBox} onPress={() => router.push('/(main)/friends')}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Arkadaş</Text>
          </Pressable>
        </View>

        <SettingsSection title="Keşfet">
          <SettingsRow
            label="Pokédex"
            emoji="🎯"
            desc="Koleksiyonundaki Pokémon'ları takip et"
            onPress={() => router.push('/(main)/pokedex')}
          />
          <SettingsRow
            label="Rozetler"
            emoji="🏅"
            desc={`${unlockedCount}/${badges.length} rozet kazanıldı`}
            onPress={() => router.push('/(main)/badges')}
          />
          <SettingsRow
            label="İstatistikler"
            emoji="📊"
            desc="Koleksiyonunun detaylı analizi"
            onPress={() => router.push('/(main)/stats')}
          />
          <SettingsRow
            label="Arkadaşlar"
            emoji="👥"
            desc="Arkadaşlarını bul ve karşılaştır"
            onPress={() => router.push('/(main)/friends')}
          />
        </SettingsSection>

        <SettingsSection title="Abonelik">
          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tierCfg.label}</Text>
              <Text style={styles.tierPrice}>{tierCfg.price}</Text>
            </View>
            <Text style={styles.tierDesc}>{tierCfg.description}</Text>
            {profile?.tier === 'free' && (
              <Button
                label="Premium'a Yükselt"
                variant="primary"
                size="sm"
                style={styles.upgradeBtn}
                onPress={() => {}}
              />
            )}
          </View>
        </SettingsSection>

        <SettingsSection title="Satış Kanalları">
          <ChannelItem emoji="🛍" name="ikas" connected={false} onConnect={() => {}} />
          <ChannelItem emoji="🟢" name="Shopify" connected={false} onConnect={() => {}} />
          <ChannelItem emoji="🔵" name="eBay" connected={false} onConnect={() => {}} />
          <ChannelItem emoji="🟠" name="Trendyol" connected={false} onConnect={() => {}} />
        </SettingsSection>

        <SettingsSection title="API Ayarları">
          <SettingsRow
            label="GiblTCG API"
            value={process.env.EXPO_PUBLIC_GIBLTCG_API_KEY ? '••••••••' : 'Yapılandırılmadı'}
            onPress={() => {}}
          />
          <SettingsRow
            label="JustTCG API"
            value={process.env.EXPO_PUBLIC_JUSTTCG_API_KEY ? '••••••••' : 'Yapılandırılmadı'}
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Hesap">
          <SettingsRow label="Kullanıcı Adını Değiştir" onPress={() => {}} />
          <SettingsRow label="Şifre Değiştir" onPress={() => {}} />
          <SettingsRow label="Verileri Dışa Aktar" onPress={() => {}} />
          <SettingsRow label="Hesabı Sil" destructive onPress={() => {}} />
        </SettingsSection>

        <Button
          label="Çıkış Yap"
          variant="ghost"
          size="lg"
          loading={signingOut}
          style={styles.signOutBtn}
          onPress={handleSignOut}
        />

        <Text style={styles.version}>batu v1.0.0 · Türkiye TCG Platformu</Text>
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionItems}>{children}</View>
    </View>
  );
}

function SettingsRow({
  label,
  value,
  emoji,
  desc,
  destructive,
  onPress,
}: {
  label: string;
  value?: string;
  emoji?: string;
  desc?: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {emoji && <Text style={styles.rowEmoji}>{emoji}</Text>}
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Text style={styles.rowChevron}>›</Text>
      </View>
    </Pressable>
  );
}

function ChannelItem({
  emoji,
  name,
  connected,
  onConnect,
}: {
  emoji: string;
  name: string;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onConnect}
    >
      <Text style={styles.channelEmoji}>{emoji}</Text>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{name}</Text>
      <View style={styles.rowRight}>
        <Badge
          label={connected ? 'Bağlı' : 'Bağla'}
          variant={connected ? 'success' : 'ghost'}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.xl },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  profileInfo: { flex: 1 },
  displayName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  username: { color: colors.textMuted, fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  tierCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  tierPrice: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  tierDesc: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  upgradeBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  sectionItems: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowPressed: { backgroundColor: colors.surfaceHover },
  rowEmoji: { fontSize: 18, marginRight: spacing.md },
  rowContent: { flex: 1 },
  rowLabel: { color: colors.text, fontSize: fontSize.md },
  rowLabelDestructive: { color: colors.error },
  rowDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { color: colors.textMuted, fontSize: fontSize.sm },
  rowChevron: { color: colors.textFaint, fontSize: 20, lineHeight: 20 },
  channelEmoji: { fontSize: 20, marginRight: spacing.sm },
  signOutBtn: { marginTop: spacing.sm },
  version: { color: colors.textFaint, fontSize: fontSize.xs, textAlign: 'center' },
  bottomPad: { height: spacing.xxxl },
});
