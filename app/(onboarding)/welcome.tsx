import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, Button, Checkbox, LogoMark, Wordmark, Dots } from '@/components/ds';
import { Art, type ArtName } from '@/components/art';
import { useTheme, radius } from '@/lib/theme';

const SLIDES: { art: ArtName; title: string; text: string }[] = [
  {
    art: 'emergency',
    title: 'Acil anında en yakın açık veteriner',
    text: 'Gece yarısı ya da bayram günü fark etmez. Açık klinikleri bulur, tek dokunuşla aramanı sağlarız.',
  },
  {
    art: 'petcard',
    title: 'Dostunun acil kartı hep cebinde',
    text: 'Kilo, alerji ve ilaç bilgisi kliniği ararken ekranında. Bilgiler yalnızca telefonunda saklanır.',
  },
  {
    art: 'community',
    title: 'Aklına takılanı veterinere sor',
    text: 'Acil olmayan soruların için topluluğa yaz. Onaylı veteriner hekimler yanıtlasın, klinikle mesajlaş.',
  },
];

export default function WelcomeScreen() {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [pagerHeight, setPagerHeight] = useState(0);
  const last = index === SLIDES.length - 1;
  const artWidth = Math.min(width - 56, height < 720 ? 250 : 340);

  const goTo = (i: number) => {
    setIndex(i);
    ref.current?.scrollTo({ x: i * width, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 52 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LogoMark size={32} />
          <Wordmark size={20} />
        </View>
        {!last ? (
          <Pressable onPress={() => goTo(SLIDES.length - 1)} hitSlop={12} accessibilityRole="button">
            <Text variant="callout" tone="muted">
              Geç
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ flex: 1 }}
        onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
      >
        {SLIDES.map((s) => (
          <View key={s.art} style={{ width, height: pagerHeight || undefined, paddingHorizontal: 28, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Art name={s.art} width={artWidth} />
            </View>
            <Text variant="display" center style={{ marginTop: 20 }}>
              {s.title}
            </Text>
            <Text variant="body" tone="muted" center style={{ marginTop: 12 }}>
              {s.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <Dots count={SLIDES.length} index={index} />

        {last ? (
          <>
            <View style={{ marginTop: 20, padding: 14, borderRadius: radius.lg, backgroundColor: t.surfaceAlt }}>
              <Checkbox checked={accepted} onPress={() => setAccepted(!accepted)}>
                <Text variant="caption" tone="muted" style={{ lineHeight: 19 }}>
                  Pati SOS'un teşhis ya da tedavi önermediğini, klinik bilgilerinin değişebileceğini ve
                  gitmeden önce kliniği aramam gerektiğini anlıyorum.
                </Text>
              </Checkbox>
            </View>
            <Button
              title="Başlayalım"
              size="lg"
              full
              disabled={!accepted}
              onPress={() => router.push('/auth?from=onboarding')}
              style={{ marginTop: 14 }}
            />
          </>
        ) : (
          <Button title="Devam" size="lg" full onPress={() => goTo(index + 1)} style={{ marginTop: 20 }} />
        )}
        <Text variant="caption" tone="subtle" center style={{ marginTop: 12 }}>
          Ücretsiz · Üyelik gerekmez · Reklamsız
        </Text>
      </View>
    </SafeAreaView>
  );
}
