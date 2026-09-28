import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, Button, Checkbox, Icon, LogoMark, type IconName } from '@/components/ds';
import { Peek, peekOffset, usePastel } from '@/components/art';
import { useTheme, radius } from '@/lib/theme';
import { PASTELS, PASTEL_INK, type PastelKey } from '@/lib/art/faces';

// Tek ekran: üstte kenardan bakan maskotlar, altta uygulamanın üç işi ve sorumluluk onayı.
const FEATURES: { icon: IconName; tint: PastelKey; title: string; text: string }[] = [
  {
    icon: 'medkit',
    tint: 'rose',
    title: 'Acilde en yakın açık klinik',
    text: 'Gece ya da bayram fark etmez. Açık klinikleri bulur, tek dokunuşla aratırız.',
  },
  {
    icon: 'calendar',
    tint: 'mint',
    title: 'Aşı ve parazit hatırlatması',
    text: 'Bir gün önce ve gününde haber veririz. Kilo ve sağlık kartı da burada.',
  },
  {
    icon: 'chatbubbles',
    tint: 'lilac',
    title: 'Veterinere sor',
    text: 'Acil olmayan sorularını onaylı veteriner hekimler yanıtlar.',
  },
];

const PEEK_W = 128;

export default function WelcomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const peach = usePastel('peach');
  const mode = t.dark ? 'dark' : 'light';
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: peach }} edges={['top']}>
      <View style={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 64 }}>
        <LogoMark size={44} />
        <Text variant="display" style={{ marginTop: 12 }}>
          Patiport'a{'\n'}hoş geldin!
        </Text>
        <Text variant="body" tone="muted" style={{ marginTop: 6 }}>
          Dostun için en yakın açık veteriner, aşı hatırlatması ve veterinere soru.
        </Text>
      </View>

      <View style={{ flex: 1, backgroundColor: t.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
        {/* Kenardan bakan maskotlar: patileri kartın üstünde */}
        <Peek species="cat" fur="ginger" seed="hosgeldin-kedi" width={PEEK_W} style={{ position: 'absolute', right: 150, top: -peekOffset(PEEK_W) }} />
        <Peek species="dog" fur="cream" seed="hosgeldin-kopek" mood="wink" width={PEEK_W} style={{ position: 'absolute', right: 24, top: -peekOffset(PEEK_W) }} />

        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 36, paddingBottom: 12, gap: 22 }} showsVerticalScrollIndicator={false}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: PASTELS[mode][f.tint] }}>
                <Icon name={f.icon} size={22} color={PASTEL_INK[mode][f.tint]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{f.title}</Text>
                <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
                  {f.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 12) + 4 }}>
          <Checkbox checked={accepted} onPress={() => setAccepted(!accepted)}>
            <Text variant="caption" tone="muted" style={{ lineHeight: 18 }}>
              Patiport'un teşhis ya da tedavi önermediğini, klinik bilgilerinin değişebileceğini ve gitmeden önce kliniği
              aramam gerektiğini anlıyorum.
            </Text>
          </Checkbox>
          <Button title="Devam" size="lg" full disabled={!accepted} onPress={() => router.push('/auth?from=onboarding')} style={{ marginTop: 16 }} />
          <Text variant="caption" tone="subtle" center style={{ marginTop: 10 }}>
            Ücretsiz · Üyelik gerekmez · Reklamsız
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
