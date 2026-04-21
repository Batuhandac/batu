import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';

interface Tip {
  icon: string;
  text: string;
}

const TIPS: Tip[] = [
  {
    icon: '🃏',
    text: 'Bir set tamamlamak mı istiyorsun? Seti hedef olarak seç ve hangi arkadaşların o setden kart sahibi olduğunu hemen gör.',
  },
  {
    icon: '📁',
    text: 'Arkadaşının takas klasörü var mı? Sadece takas için işaretlenmiş kartları görmek için klasörüne göz at.',
  },
  {
    icon: '👥',
    text: 'Kiminle takas yapacağından emin değil misin? "Tüm Arkadaşlar"ı seçili bırak, sana en çok kart sunabilecek kişileri sıralayalım.',
  },
];

export function TipsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.mascotWrap}>
        <Text style={styles.mascot}>🎴</Text>
      </View>
      <Text style={styles.title}>Başlarken</Text>
      <Text style={styles.subtitle}>Nereden başlayacağından emin değil misin? İşte birkaç ipucu.</Text>
      <View style={styles.tips}>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tip}>
            <View style={styles.tipIcon}>
              <Text style={styles.tipIconText}>{tip.icon}</Text>
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  mascotWrap: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  mascot: {
    fontSize: 72,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  tips: {
    gap: spacing.lg,
    width: '100%',
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipIconText: {
    fontSize: 18,
  },
  tipText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
