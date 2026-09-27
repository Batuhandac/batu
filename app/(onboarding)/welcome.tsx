import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, Button, Checkbox, Icon, LogoMark, type IconName } from '@/components/ds';
import { useTheme } from '@/lib/theme';

// Tek ekran: uygulamanın üç işi ve sorumluluk onayı (iOS "Yenilikler" ekranı düzeni).
const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'medkit-outline',
    title: 'Acilde en yakın açık klinik',
    text: 'Gece ya da bayram fark etmez. Açık klinikleri bulur, tek dokunuşla aratırız.',
  },
  {
    icon: 'calendar-outline',
    title: 'Aşı ve parazit hatırlatması',
    text: 'Bir gün önce ve gününde haber veririz. Kilo ve sağlık kartı da burada.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Veterinere sor',
    text: 'Acil olmayan sorularını onaylı veteriner hekimler yanıtlar.',
  },
];

export default function WelcomeScreen() {
  const t = useTheme();
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.surface }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <LogoMark size={64} />
          <Text variant="display" center style={{ marginTop: 12 }}>
            Pati SOS'a hoş geldin
          </Text>
        </View>

        <View style={{ marginTop: 36, gap: 24 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <View style={{ width: 36, alignItems: 'center', paddingTop: 2 }}>
                <Icon name={f.icon} size={30} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{f.title}</Text>
                <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                  {f.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <Checkbox checked={accepted} onPress={() => setAccepted(!accepted)}>
          <Text variant="caption" tone="muted" style={{ lineHeight: 18 }}>
            Pati SOS'un teşhis ya da tedavi önermediğini, klinik bilgilerinin değişebileceğini ve gitmeden önce kliniği
            aramam gerektiğini anlıyorum.
          </Text>
        </Checkbox>
        <Button title="Devam" size="lg" full disabled={!accepted} onPress={() => router.push('/auth?from=onboarding')} style={{ marginTop: 16 }} />
        <Text variant="caption" tone="subtle" center style={{ marginTop: 10 }}>
          Ücretsiz · Üyelik gerekmez · Reklamsız
        </Text>
      </View>
    </SafeAreaView>
  );
}
