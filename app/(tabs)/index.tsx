import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Icon,
  IconBadge,
  Card,
  Section,
  Group,
  ListRow,
  Avatar,
  Button,
  LogoMark,
  Wordmark,
  Carousel,
  IconButton,
  type IconName,
} from '@/components/ds';
import { BannerCard } from '@/components/home/BannerCard';
import { QuestionCard } from '@/components/community/QuestionCard';
import { loadCachedRemoteBanners, fetchRemoteBanners, selectBanners } from '@/lib/content/banners';
import { useLatestQuestions, useMyQuestions, useUnreadMessages } from '@/lib/hooks/useCommunity';
import { useTheme, radius, shadow } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useLocation } from '@/lib/hooks/useLocation';
import { speciesLabel } from '@/lib/utils/pets';
import { getRegisteredClinic } from '@/lib/data/registry';
import { getClinicById } from '@/lib/data/query';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const QUICK: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: 'list', title: 'Yakın klinikler', text: 'Açık olanlar önce', href: '/(tabs)/nearby' },
  { icon: 'map', title: 'Harita', text: 'Çevrendeki klinikler', href: '/map' },
  { icon: 'bandage-outline', title: 'İlk yardım', text: 'Veterinere kadar', href: '/first-aid' },
  { icon: 'id-card-outline', title: 'Acil kart', text: 'Dostunun bilgileri', href: '/(tabs)/pets' },
];

export default function HomeScreen() {
  const t = useTheme();
  const { pets, load: loadPets } = usePets();
  const { favorites, load: loadFavs } = useFavorites();
  const { source, label } = useLocation();
  const { width } = useWindowDimensions();
  const latest = useLatestQuestions(3);
  const myQuestions = useMyQuestions();
  const unreadMessages = useUnreadMessages();
  const [remoteBanners, setRemoteBanners] = useState<Awaited<ReturnType<typeof loadCachedRemoteBanners>>>([]);

  useEffect(() => {
    loadCachedRemoteBanners().then(setRemoteBanners);
    fetchRemoteBanners().then((r) => r && setRemoteBanners(r));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPets();
      loadFavs();
      latest.reload();
      myQuestions.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPets, loadFavs, latest.reload, myQuestions.reload])
  );

  const banners = useMemo(() => selectBanners(remoteBanners, pets.length > 0), [remoteBanners, pets.length]);
  const myUpdates = myQuestions.mine.filter((q) => (myQuestions.unread[q.id] ?? 0) > 0);

  const primaryVet = favorites.find((f) => f.is_primary_vet);
  const primaryVetName = primaryVet
    ? getRegisteredClinic(primaryVet.clinic_id)?.name ?? getClinicById(primaryVet.clinic_id)?.name ?? 'Kayıtlı klinik'
    : null;

  const startEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push('/emergency');
  };

  return (
    <Screen scroll>
      {/* Üst bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LogoMark size={34} />
          <Wordmark size={21} />
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.push('/(tabs)/nearby')}
          accessibilityRole="button"
          accessibilityLabel="Konum"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            maxWidth: 150,
            marginRight: 8,
            paddingHorizontal: 12,
            height: 36,
            borderRadius: radius.pill,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Icon name={source === 'gps' ? 'navigate' : 'location-outline'} size={15} color={t.primary} />
          <Text variant="caption" numberOfLines={1}>
            {source === 'manual' ? label ?? 'Seçilen bölge' : source === 'gps' ? 'Konumun' : 'Konum seç'}
          </Text>
        </Pressable>
        <View>
          <IconButton icon="chatbubbles-outline" onPress={() => router.push('/messages')} accessibilityLabel={unreadMessages > 0 ? `Mesajlar, ${unreadMessages} okunmamış` : 'Mesajlar'} size={36} />
          {unreadMessages > 0 ? (
            <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.sos, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: t.bg }}>
              <Text variant="caption" color={t.onSos} style={{ fontSize: 10, lineHeight: 12 }}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text variant="overline" tone="subtle">
          {greeting()}
        </Text>
        <Text variant="title" style={{ marginTop: 4 }}>
          Dostunun yanındayız.
        </Text>
      </View>

      {/* ACİL kartı */}
      <Pressable
        onPress={startEmergency}
        accessibilityRole="button"
        accessibilityLabel="Acil veteriner bul"
        style={({ pressed }) => ({
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: radius.xl,
          backgroundColor: pressed ? t.sosPressed : t.sos,
          padding: 22,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...shadow(t, 2),
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconBadge name="medkit" size={52} color={t.onSos} background="rgba(255,255,255,0.18)" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, height: 28, borderRadius: radius.pill }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.onSos }} />
            <Text variant="caption" color={t.onSos} style={{ fontSize: 12 }}>
              7/24
            </Text>
          </View>
        </View>
        <Text variant="title" color={t.onSos} style={{ marginTop: 18 }}>
          Acil veteriner bul
        </Text>
        <Text variant="callout" color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>
          En yakın açık klinik, tek dokunuşla arama ve yolda yapman gerekenler.
        </Text>
        <View
          style={{
            marginTop: 18,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: t.onSos,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text variant="button" color={t.sos}>
            Hemen başla
          </Text>
          <Icon name="arrow-forward" size={18} color={t.sos} />
        </View>
      </Pressable>

      {/* Hızlı erişim */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
        {QUICK.map((q) => (
          <Card key={q.title} onPress={() => router.push(q.href as never)} style={{ width: '47.5%', flexGrow: 1 }} accessibilityLabel={q.title}>
            <IconBadge name={q.icon} size={40} />
            <Text variant="bodyStrong" style={{ marginTop: 12 }}>
              {q.title}
            </Text>
            <Text variant="caption" tone="muted">
              {q.text}
            </Text>
          </Card>
        ))}
      </View>

      {/* Bannerlar */}
      {banners.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <Carousel data={banners} keyOf={(b) => b.id} itemWidth={Math.min(width - 40, 420)} renderItem={(b) => <BannerCard banner={b} />} />
        </View>
      ) : null}

      {/* Sorularıma yeni yanıtlar */}
      {myUpdates.length > 0 ? (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Card tone="primary" onPress={() => router.push(`/community/${myUpdates[0].id}`)} accessibilityLabel="Soruna yeni yanıt var">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBadge name="chatbubble-ellipses" size={40} color={t.onPrimary} background={t.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Soruna {myQuestions.total} yeni yanıt var</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {myUpdates[0].title}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={t.primary} />
            </View>
          </Card>
        </View>
      ) : null}

      {/* Dostlar */}
      <Section title="Dostların" action={pets.length > 0 ? 'Tümü' : undefined} onAction={() => router.push('/(tabs)/pets')}>
        {pets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} style={{ marginHorizontal: -20 }}>
            <View style={{ width: 8 }} />
            {pets.map((p) => (
              <Card key={p.id} onPress={() => router.push(`/pets/${p.id}`)} style={{ width: 200 }} accessibilityLabel={p.name}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar label={p.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {p.breed ?? speciesLabel(p.species)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            <Card onPress={() => router.push('/pets/create')} tone="alt" style={{ width: 150, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Dost ekle">
              <Icon name="add" size={22} color={t.primary} />
              <Text variant="caption" tone="primary">
                Dost ekle
              </Text>
            </Card>
            <View style={{ width: 8 }} />
          </ScrollView>
        ) : (
          <Card>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <IconBadge name="paw" size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Acil kartını şimdi hazırla</Text>
                <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  Kilo, alerji ve ilaç bilgisi acil anda ekranında olsun. 1 dakika sürer.
                </Text>
              </View>
            </View>
            <Button title="Kart oluştur" variant="soft" icon="add" onPress={() => router.push('/pets/create')} style={{ marginTop: 14 }} full />
          </Card>
        )}
      </Section>

      {primaryVetName && primaryVet && (
        <Section title="Veterinerin">
          <Group>
            <ListRow icon="heart" title={primaryVetName} subtitle="Düzenli veterinerin" onPress={() => router.push(`/clinic/${primaryVet.clinic_id}`)} last />
          </Group>
        </Section>
      )}

      {/* Topluluk */}
      <Section title="Topluluktan" action="Tümü" onAction={() => router.push('/community')}>
        {latest.items.length > 0 ? (
          latest.items.map((q) => <QuestionCard key={q.id} q={q} compact />)
        ) : (
          <Card>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <IconBadge name="chatbubbles-outline" size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Veterinere sor</Text>
                <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  Beslenme, davranış, aşı… Acil olmayan soruların için topluluğa yaz.
                </Text>
              </View>
            </View>
          </Card>
        )}
        <Button title="Soru sor" variant="soft" icon="create-outline" onPress={() => router.push('/community/ask')} style={{ marginTop: 4 }} full />
      </Section>

      {/* Veteriner hekimlere */}
      <Pressable onPress={() => router.push('/vets')} style={{ paddingHorizontal: 20, marginTop: 28 }} accessibilityRole="button">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <Icon name="medical-outline" size={16} color={t.textMuted} />
          <Text variant="caption" tone="muted">
            Veteriner hekim misiniz?{' '}
            <Text variant="caption" tone="primary">
              Kliniğinizi ücretsiz doğrulayın
            </Text>
          </Text>
        </View>
      </Pressable>
    </Screen>
  );
}
