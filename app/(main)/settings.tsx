import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TIER_CONFIG } from '@/constants/tiers';

export default function SettingsScreen() {
  const { profile, signOut, loading } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

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
            router.replace('/(auth)/');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const tierCfg = TIER_CONFIG[profile?.tier ?? 'free'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ayarlar</Text>

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
            label="GiblTCG API Key"
            value={process.env.EXPO_PUBLIC_GIBLTCG_API_KEY ? '••••••••' : 'Yapılandırılmadı'}
            onPress={() => {}}
          />
          <SettingsRow
            label="JustTCG API Key"
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
  destructive,
  onPress,
}: {
  label: string;
  value?: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
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
      <Text style={styles.rowLabel}>{name}</Text>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
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
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  profileInfo: { flex: 1 },
  displayName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  username: { color: colors.textMuted, fontSize: fontSize.sm },
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
  rowLabel: { flex: 1, color: colors.text, fontSize: fontSize.md },
  rowLabelDestructive: { color: colors.error },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { color: colors.textMuted, fontSize: fontSize.sm },
  rowChevron: { color: colors.textFaint, fontSize: 20, lineHeight: 20 },
  channelEmoji: { fontSize: 20, marginRight: spacing.sm },
  signOutBtn: { marginTop: spacing.sm },
  version: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  bottomPad: { height: spacing.xxxl },
});
