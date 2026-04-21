import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';

const GAMES = ['Pokémon', 'Yu-Gi-Oh!', 'One Piece', 'MTG', 'Lorcana'];

export default function WelcomeScreen() {
  const enterGuestMode = useAuthStore((s) => s.enterGuestMode);

  const handleGuest = () => {
    enterGuestMode();
    router.replace('/(main)');
  };
  return (
    <LinearGradient colors={['#0D1117', '#0f1f3d', '#0D1117']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.emoji}>🃏</Text>
            <Text style={styles.appName}>batu</Text>
            <Text style={styles.tagline}>TCG koleksiyonunu yönet,{'\n'}kart değerini anında öğren</Text>

            <View style={styles.gamesRow}>
              {GAMES.map((g) => (
                <View key={g} style={styles.gameChip}>
                  <Text style={styles.gameChipText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.features}>
            <Feature icon="📷" text="Kartını tara, anında değerini öğren" />
            <Feature icon="📊" text="Portföyünü takip et, piyasa fiyatlarını izle" />
            <Feature icon="🔄" text="Takas fırsatlarını keşfet" />
            <Feature icon="🛒" text="Shopify, ikas ve daha fazlasına tek tıkla sat" />
          </View>

          <View style={styles.actions}>
            <Button
              label="Ücretsiz Başla"
              variant="primary"
              size="lg"
              style={styles.btn}
              onPress={() => router.push('/(auth)/register')}
            />
            <Button
              label="Giriş Yap"
              variant="secondary"
              size="lg"
              style={styles.btn}
              onPress={() => router.push('/(auth)/login')}
            />
            <Pressable onPress={handleGuest} style={styles.guestBtn}>
              <Text style={styles.guestText}>
                {isSupabaseConfigured ? 'Hesapsız dene →' : 'Misafir olarak dene →'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    paddingTop: spacing.xxxl + spacing.xl,
    gap: spacing.lg,
  },
  emoji: { fontSize: 64 },
  appName: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    textAlign: 'center',
    lineHeight: 26,
  },
  gamesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  gameChip: {
    backgroundColor: 'rgba(47,129,247,0.15)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(47,129,247,0.3)',
  },
  gameChipText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  features: {
    gap: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: { fontSize: 22 },
  featureText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    flex: 1,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  btn: {
    width: '100%',
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  guestText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
