import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';

const GAMES = ['Pokemon', 'Yu-Gi-Oh!', 'One Piece', 'Naruto', 'MTG', 'Lorcana'];

export default function WelcomeScreen() {
  const enterGuestMode = useAuthStore((s) => s.enterGuestMode);

  const handleGuest = () => {
    enterGuestMode();
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.brandBlock}>
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>TCG</Text>
          </View>
          <View style={styles.copyBlock}>
            <Text style={styles.appName}>Cardory</Text>
            <Text style={styles.tagline}>
              Kart tara, birebir baskiyi dogrula, fiyatla, koleksiyonuna ekle,
              takas et ve satis kanallarina aktar.
            </Text>
          </View>
        </View>

        <View style={styles.ecosystemBlock}>
          <Text style={styles.eyebrow}>Supported ecosystems</Text>
          <View style={styles.gamesGrid}>
            {GAMES.map((game, index) => (
              <View
                key={game}
                style={[styles.gameChip, index === 0 && styles.gameChipActive]}
              >
                <Text style={[styles.gameText, index === 0 && styles.gameTextActive]}>
                  {game}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.trustPanel}>
          <TrustLine label="Exact print scan" value="AI + resmi katalog" />
          <TrustLine label="Turkiye price engine" value="Kur, komisyon, marj" />
          <TrustLine label="Commerce ready" value="Shopify, ikas, eBay" />
        </View>

        <View style={styles.actions}>
          <Button
            label="Create Account"
            variant="primary"
            size="lg"
            style={styles.actionBtn}
            onPress={() => router.push('/(auth)/register')}
          />
          <Button
            label="Login"
            variant="secondary"
            size="lg"
            style={styles.actionBtn}
            onPress={() => router.push('/(auth)/login')}
          />
          <Pressable onPress={handleGuest} style={styles.guestBtn}>
            <Text style={styles.guestText}>
              {isSupabaseConfigured ? 'Try without account ->' : 'Try as Guest ->'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrustLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.trustLine}>
      <Text style={styles.trustLabel}>{label}</Text>
      <Text style={styles.trustValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logoIcon: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  copyBlock: { alignItems: 'center', gap: spacing.xs },
  appName: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  ecosystemBlock: { alignItems: 'center', gap: spacing.md },
  eyebrow: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 330,
  },
  gameChip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gameChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  gameText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  gameTextActive: { color: colors.primary },
  trustPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  trustLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  trustLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  trustValue: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'right', flex: 1 },
  actions: { gap: spacing.md },
  actionBtn: { width: '100%' },
  guestBtn: { alignItems: 'center', paddingVertical: spacing.md },
  guestText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
});
