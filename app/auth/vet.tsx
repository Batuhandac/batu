import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Card, Text, Icon } from '@/components/ds';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuthFlow } from '@/lib/hooks/useAuthFlow';
import { useTheme } from '@/lib/theme';

const STEPS = ['Hesabını oluştur', 'Kliniğini seç ve bilgilerini gönder', 'Telefonla doğrulayalım (genelde aynı gün)'];

export default function VetAuthScreen() {
  const t = useTheme();
  const { initialMode, done } = useAuthFlow();
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header
        title="Veteriner hekim"
        subtitle="Ücretsiz ve reklamsız: sıralama satın alınamaz. Doğru bilgiyle hasta sahiplerine ulaşırsınız."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <Card tone="alt" style={{ marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: i ? 10 : 0 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="caption" color={t.onPrimary} style={{ fontSize: 12 }}>
                  {i + 1}
                </Text>
              </View>
              <Text variant="callout" style={{ flex: 1 }}>
                {s}
              </Text>
              {i === STEPS.length - 1 ? <Icon name="call-outline" size={16} color={t.textSubtle} /> : null}
            </View>
          ))}
        </Card>
        <AuthForm role="vet" initialMode={initialMode} onDone={() => done('vet')} />
      </View>
    </Screen>
  );
}
