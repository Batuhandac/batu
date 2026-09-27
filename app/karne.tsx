import React, { useCallback } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Header, Text, Card } from '@/components/ds';
import { PetFace, usePastel } from '@/components/art';
import { BadgeTile, ProgressBar } from '@/components/game';
import { useTheme, radius } from '@/lib/theme';
import { useGame } from '@/lib/hooks/useGame';
import { BADGES, LEVELS, POINTS } from '@/lib/game';

// Seviye ilerledikçe maskotun ifadesi değişir
const LEVEL_FACES = [
  { species: 'cat', mood: 'sleepy' },
  { species: 'cat', mood: 'happy' },
  { species: 'dog', mood: 'happy' },
  { species: 'dog', mood: 'wink' },
  { species: 'other', mood: 'surprised' },
] as const;

const HOW: [string, number][] = [
  ['Dost ekle', POINTS.pet],
  ['Dostunun kartını doldur', POINTS.fullCard],
  ['Bakım takvimine tarih ekle', POINTS.careAdded],
  ['Bakımı zamanında yap', POINTS.doneOnTime],
  ['Kilo kaydet', POINTS.weight],
  ['Konumunu paylaş', POINTS.location],
];

export default function KarneScreen() {
  const t = useTheme();
  const butter = usePastel('butter');
  const { summary, reload } = useGame();
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );
  if (!summary) return <Screen>{null}</Screen>;
  const { level, points, earned, streak } = summary;
  const face = LEVEL_FACES[level.index];
  const earnedIds = new Set(earned.map((b) => b.id));
  const ordered = [...BADGES].sort((a, b) => Number(earnedIds.has(b.id)) - Number(earnedIds.has(a.id)));

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Pati karnen" onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />

      <View style={{ marginHorizontal: 20, borderRadius: radius.xl, backgroundColor: butter, padding: 20, alignItems: 'center' }}>
        <PetFace species={face.species} mood={face.mood} fur="ginger" seed="karne" size={104} background={null} />
        <Text variant="overline" tone="muted" style={{ marginTop: 6 }}>
          Seviye {level.index + 1} / {LEVELS.length}
        </Text>
        <Text variant="title" center>
          {level.name}
        </Text>
        <Text variant="callout" tone="muted" center style={{ marginTop: 2 }}>
          {points} pati{level.next ? ` · ${level.next.name} için ${level.toNext} pati daha` : ' · en yüksek seviyedesin'}
        </Text>
        <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
          <ProgressBar value={level.progress} height={10} track={t.dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)'} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 12 }}>
        {[
          [String(points), 'pati'],
          [`${earned.length}/${BADGES.length}`, 'rozet'],
          [String(streak), 'zamanında seri'],
        ].map(([v, l]) => (
          <Card key={l} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
            <Text variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
              {v}
            </Text>
            <Text variant="caption" tone="muted">
              {l}
            </Text>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
        <Text variant="headline" style={{ marginBottom: 12 }}>
          Rozetler
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }}>
          {ordered.map((b) => (
            <View key={b.id} style={{ width: '31%', alignItems: 'center' }}>
              <BadgeTile badge={b} earned={earnedIds.has(b.id)} size={62} />
              {!earnedIds.has(b.id) ? (
                <Text variant="caption" tone="subtle" center style={{ fontSize: 12, lineHeight: 16 }}>
                  {b.how}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
        <Text variant="headline" style={{ marginBottom: 10 }}>
          Nasıl pati kazanırım?
        </Text>
        <Card padded={false}>
          {HOW.map(([l, p], i) => (
            <View
              key={l}
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: t.border }}
            >
              <Text variant="body">{l}</Text>
              <Text variant="body" tone="primary" style={{ fontWeight: '700' }}>
                +{p}
              </Text>
            </View>
          ))}
        </Card>
        <Text variant="caption" tone="subtle" style={{ marginTop: 8 }}>
          Puanlar yalnızca bu telefondaki kayıtlardan hesaplanır. Dostunun sağlığına yarayan her iş sayılır.
        </Text>
      </View>
    </Screen>
  );
}
