import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button, Checkbox, IconBadge, LogoMark, Wordmark, type IconName } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';

const POINTS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'navigate',
    title: 'Açık ve yakın olan önce',
    text: 'Çalışma saatlerinden anlık hesaplanır. Bilmediğimiz bir şeyi açık göstermeyiz.',
  },
  {
    icon: 'call',
    title: 'Tek dokunuşla ara',
    text: 'Panik anında menüler arasında kaybolmadan doğrudan kliniğe ulaş.',
  },
  {
    icon: 'id-card-outline',
    title: 'Dostunun acil kartı',
    text: 'Kilo, alerji ve ilaç bilgisi aradığın anda ekranında.',
  },
];

export default function WelcomeScreen() {
  const t = useTheme();
  const [accepted, setAccepted] = useState(false);

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={{ paddingHorizontal: 24, paddingTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LogoMark size={44} />
        <Wordmark size={26} />
      </View>

      <Text variant="display" style={{ marginTop: 36 }}>
        Acil anında en yakın açık veteriner, bir dokunuş uzağında.
      </Text>
      <Text variant="body" tone="muted" style={{ marginTop: 12 }}>
        Gece yarısı ya da bayram günü fark etmez. Açık klinikleri bulur, aramanı ve yolda ne
        yapman gerektiğini kolaylaştırırız.
      </Text>

      <View style={{ marginTop: 28, gap: 18 }}>
        {POINTS.map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: 14 }}>
            <IconBadge name={p.icon} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{p.title}</Text>
              <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                {p.text}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 28,
          padding: 16,
          borderRadius: radius.lg,
          backgroundColor: t.surfaceAlt,
        }}
      >
        <Checkbox checked={accepted} onPress={() => setAccepted(!accepted)}>
          <Text variant="callout" tone="muted">
            Pati SOS'un teşhis ya da tedavi önermediğini, klinik bilgilerinin değişebileceğini ve
            gitmeden önce kliniği aramam gerektiğini anlıyorum.
          </Text>
        </Checkbox>
      </View>

      <Button
        title="Başla"
        size="lg"
        full
        disabled={!accepted}
        onPress={() => router.push('/(onboarding)/location')}
        style={{ marginTop: 20 }}
      />
      <Text variant="caption" tone="subtle" center style={{ marginTop: 14 }}>
        Ücretsiz · Üyelik gerekmez · Reklamsız
      </Text>
    </Screen>
  );
}
