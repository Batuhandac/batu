import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Icon, IconBadge, Card, Section, Avatar, Button, IconButton, Badge, LogoMark, Wordmark, Carousel } from '@/components/ds';
import { BannerCard } from '@/components/home/BannerCard';
import { useTheme, radius, shadow } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useLocation } from '@/lib/hooks/useLocation';
import { useClinics } from '@/lib/hooks/useClinics';
import { useMyQuestions, useUnreadMessages } from '@/lib/hooks/useCommunity';
import { loadCachedRemoteBanners, fetchRemoteBanners, selectBanners } from '@/lib/content/banners';
import { clinicStatus, formatDistance, pickBestClinic } from '@/lib/utils/status';
import { callClinic } from '@/lib/utils/call';
import { speciesLabel } from '@/lib/utils/pets';
import { useSession } from '@/stores/session';
import type { Clinic } from '@/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const REFRESH_MS = 2 * 60 * 1000;

export default function HomeScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { pets, load: loadPets } = usePets();
  const { lat, lng, granted, loading: locating, request } = useLocation();
  const { clinics, loading, fetch } = useClinics();
  const myQuestions = useMyQuestions();
  const unread = useUnreadMessages();
  const { role, name } = useSession();
  const [remoteBanners, setRemoteBanners] = useState<Awaited<ReturnType<typeof loadCachedRemoteBanners>>>([]);
  const lastFetch = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadCachedRemoteBanners().then(setRemoteBanners);
    fetchRemoteBanners().then((r) => r && setRemoteBanners(r));
  }, []);

  // Konum değişince ya da ekrana dönüldüğünde (2 dk'dan eskiyse) en yakın açık kliniği tazele
  const refreshNearest = useCallback(() => {
    if (lat == null || lng == null) return;
    const prev = lastFetch.current;
    if (prev && prev.lat === lat && prev.lng === lng && Date.now() - prev.at < REFRESH_MS) return;
    lastFetch.current = { at: Date.now(), lat, lng };
    fetch(lat, lng);
  }, [lat, lng, fetch]);

  useEffect(() => {
    refreshNearest();
  }, [refreshNearest]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
      myQuestions.reload();
      refreshNearest();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPets, myQuestions.reload, refreshNearest])
  );

  const best = useMemo(() => pickBestClinic(clinics), [clinics]);
  const banners = useMemo(() => selectBanners(remoteBanners, pets.length > 0), [remoteBanners, pets.length]);
  const update = myQuestions.mine.find((q) => (myQuestions.unread[q.id] ?? 0) > 0);
  const firstName = role !== 'guest' && name ? name.split(' ')[0] : null;

  const startEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push('/emergency');
  };

  return (
    <Screen scroll>
      {/* Üst bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LogoMark size={32} />
          <Wordmark size={20} />
        </View>
        <Pressable
          onPress={() => router.push(role === 'guest' ? '/auth' : '/account')}
          accessibilityRole="button"
          accessibilityLabel={role === 'guest' ? 'Giriş yap' : 'Hesabım'}
          hitSlop={8}
        >
          {role === 'guest' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: t.primarySoft }}>
              <Icon name="person-circle-outline" size={18} color={t.primary} />
              <Text variant="caption" tone="primary">
                Giriş yap
              </Text>
            </View>
          ) : (
            <Avatar label={name ?? 'P'} size={38} />
          )}
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: t.sos, borderWidth: 2, borderColor: t.bg }} />
          ) : null}
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
        <Text variant="overline" tone="subtle">
          {greeting()}
        </Text>
        <Text variant="title" style={{ marginTop: 4 }}>
          {firstName ? `Merhaba ${firstName}` : 'Dostunun yanındayız.'}
        </Text>
      </View>

      {/* ACİL */}
      <Pressable
        onPress={startEmergency}
        accessibilityRole="button"
        accessibilityLabel="Acil veteriner bul"
        style={({ pressed }) => ({
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: radius.xl,
          backgroundColor: pressed ? t.sosPressed : t.sos,
          paddingVertical: 22,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...shadow(t, 2),
        })}
      >
        <View style={{ flex: 1 }}>
          <Text variant="title" color={t.onSos}>
            Acil veteriner bul
          </Text>
          <Text variant="callout" color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>
            En yakın açık klinik, tek dokunuşla arama.
          </Text>
        </View>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.onSos, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-forward" size={26} color={t.sos} />
        </View>
      </Pressable>

      {/* Şu an açık, en yakın */}
      <Section title="Şu an açık, en yakın" action="Tümü" onAction={() => router.push('/nearby')} style={{ marginTop: 24 }}>
        {lat == null || lng == null ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconBadge name="navigate" size={44} />
              <Text variant="callout" tone="muted" style={{ flex: 1 }}>
                Konumunu paylaş, sana en yakın açık kliniği burada gösterelim.
              </Text>
            </View>
            <Button
              title={granted === false ? 'Bölge seç' : 'Konumumu kullan'}
              variant="soft"
              loading={locating}
              onPress={() => (granted === false ? router.push('/nearby') : request())}
              style={{ marginTop: 14 }}
              full
            />
          </Card>
        ) : best ? (
          <NearestCard clinic={best} />
        ) : loading ? (
          <Card>
            <View style={{ height: 20, width: '70%', borderRadius: 6, backgroundColor: t.surfaceAlt }} />
            <View style={{ height: 14, width: '45%', borderRadius: 6, backgroundColor: t.surfaceAlt, marginTop: 10 }} />
          </Card>
        ) : (
          <Card onPress={() => router.push('/nearby')} accessibilityLabel="Tüm klinikler">
            <Text variant="bodyStrong">Şu an açık olduğunu bildiğimiz klinik yok</Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              Saati bilinmeyen klinikleri aramayı dene. Tüm listeyi gör.
            </Text>
          </Card>
        )}
      </Section>

      {/* Soruma yeni yanıt */}
      {update ? (
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Card tone="primary" onPress={() => router.push(`/community/${update.id}`)} accessibilityLabel="Soruna yeni yanıt var">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="chatbubble-ellipses" size={22} color={t.primary} />
              <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                Soruna {myQuestions.total} yeni yanıt var
              </Text>
              <Icon name="chevron-forward" size={18} color={t.primary} />
            </View>
          </Card>
        </View>
      ) : null}

      {/* Dostlar */}
      <Section title="Dostların" action={pets.length > 0 ? 'Tümü' : undefined} onAction={() => router.push('/pets')} style={{ marginTop: 24 }}>
        {pets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
            {pets.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/pets/${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${p.name} acil kartı`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingLeft: 6,
                  paddingRight: 16,
                  height: 52,
                  borderRadius: radius.pill,
                  backgroundColor: pressed ? t.surfaceAlt : t.surface,
                  borderWidth: 1,
                  borderColor: t.border,
                })}
              >
                <Avatar label={p.name} size={40} />
                <View>
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="caption" tone="muted" style={{ fontSize: 12 }}>
                    {p.breed ?? speciesLabel(p.species)}
                  </Text>
                </View>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push('/pets/create')}
              accessibilityRole="button"
              accessibilityLabel="Dost ekle"
              style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.borderStrong, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="add" size={22} color={t.primary} />
            </Pressable>
          </ScrollView>
        ) : (
          <Card onPress={() => router.push('/pets/create')} accessibilityLabel="Acil kart oluştur">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconBadge name="id-card-outline" size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Acil kartını hazırla</Text>
                <Text variant="caption" tone="muted">
                  Kilo, alerji ve ilaçlar acil anda ekranında. 1 dakika.
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={t.textSubtle} />
            </View>
          </Card>
        )}
      </Section>

      {/* Bannerlar */}
      {banners.length > 0 ? (
        <View style={{ marginTop: 28 }}>
          <Carousel data={banners} keyOf={(b) => b.id} itemWidth={Math.min(width - 40, 420)} renderItem={(b) => <BannerCard banner={b} />} />
        </View>
      ) : null}
    </Screen>
  );
}

function NearestCard({ clinic }: { clinic: Clinic }) {
  const s = clinicStatus(clinic);
  const meta = [clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null, clinic.district].filter(Boolean).join(' · ');
  return (
    <Card onPress={() => router.push(`/clinic/${clinic.id}`)} accessibilityLabel={clinic.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="headline" numberOfLines={2}>
            {clinic.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label={s.label} tone={s.tone} dot />
            {s.closingSoon ? <Badge label={s.closingSoon} tone="honey" /> : null}
            {meta ? (
              <Text variant="caption" tone="muted">
                {meta}
              </Text>
            ) : null}
          </View>
        </View>
        <IconButton
          icon="call"
          variant="primary"
          size={52}
          accessibilityLabel={`${clinic.name} ara`}
          onPress={() => callClinic({ id: clinic.id, name: clinic.name, phone: clinic.phone ?? clinic.emergency_phone ?? null }, 'home')}
        />
      </View>
    </Card>
  );
}
