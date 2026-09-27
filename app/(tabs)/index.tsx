import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Icon, IconBadge, Card, Section, Avatar, Button, IconButton, Badge, Group, ListRow, LogoMark, Wordmark, Carousel, useToast } from '@/components/ds';
import { BannerCard } from '@/components/home/BannerCard';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { CareRow } from '@/components/care/CareRow';
import { QuestionCard } from '@/components/community/QuestionCard';
import { useTheme, radius } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useLocation } from '@/lib/hooks/useLocation';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLatestQuestions, useMyQuestions, useUnreadMessages } from '@/lib/hooks/useCommunity';
import { loadCachedRemoteBanners, fetchRemoteBanners, selectBanners } from '@/lib/content/banners';
import { upcomingCare, completeCare, type CareItem } from '@/lib/data/care';
import { clinicStatus, formatDistance, pickBestClinic } from '@/lib/utils/status';
import { dueLabel, formatDate } from '@/lib/utils/dates';
import { callClinic } from '@/lib/utils/call';
import { speciesLabel, upcomingBirthday, genitive } from '@/lib/utils/pets';
import { track } from '@/lib/analytics';
import { useSession } from '@/stores/session';
import type { Clinic, Pet } from '@/types';

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
  const toast = useToast((s) => s.show);
  const { width } = useWindowDimensions();
  const { pets, load: loadPets } = usePets();
  const { lat, lng, granted, loading: locating, request } = useLocation();
  const { clinics, loading, fetch } = useClinics();
  const latest = useLatestQuestions(2);
  const myQuestions = useMyQuestions();
  const unread = useUnreadMessages();
  const { role, name } = useSession();
  const [care, setCare] = useState<CareItem[]>([]);
  const [remoteBanners, setRemoteBanners] = useState<Awaited<ReturnType<typeof loadCachedRemoteBanners>>>([]);
  const lastFetch = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadCachedRemoteBanners().then(setRemoteBanners);
    fetchRemoteBanners().then((r) => r && setRemoteBanners(r));
  }, []);

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

  const loadCare = useCallback(() => upcomingCare().then(setCare), []);

  useFocusEffect(
    useCallback(() => {
      loadPets();
      loadCare();
      latest.reload();
      myQuestions.reload();
      refreshNearest();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPets, loadCare, latest.reload, myQuestions.reload, refreshNearest])
  );

  const petsById = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);
  const nextByPet = useMemo(() => {
    const m: Record<string, CareItem> = {};
    for (const c of care) if (!m[c.pet_id]) m[c.pet_id] = c;
    return m;
  }, [care]);
  const best = useMemo(() => pickBestClinic(clinics), [clinics]);
  const banners = useMemo(() => selectBanners(remoteBanners, pets.length > 0), [remoteBanners, pets.length]);
  const birthday = useMemo(
    () => pets.map((p) => ({ p, b: upcomingBirthday(p) })).find((x) => x.b && x.b.days <= 7) ?? null,
    [pets]
  );
  const update = myQuestions.mine.find((q) => (myQuestions.unread[q.id] ?? 0) > 0);
  const firstName = role !== 'guest' && name ? name.split(' ')[0] : null;

  const done = async (c: CareItem) => {
    const next = await completeCare(c.id);
    track('care_done', { kind: c.kind, from: 'home' });
    toast(next ? `Yapıldı. Sonraki: ${formatDate(next.due, false)}` : 'Yapıldı olarak kaydedildi');
    loadCare();
    loadPets();
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

      <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
        <Text variant="overline" tone="subtle">
          {greeting()}
        </Text>
        <Text variant="title" style={{ marginTop: 2 }}>
          {firstName ? `Merhaba ${firstName}` : 'Dostunun yanındayız.'}
        </Text>
      </View>

      {/* Bannerlar */}
      {banners.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          <Carousel data={banners} keyOf={(b) => b.id} itemWidth={Math.min(width - 40, 420)} renderItem={(b) => <BannerCard banner={b} />} />
        </View>
      ) : null}

      {/* Doğum günü */}
      {birthday && birthday.b ? (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Card tone="honey" onPress={() => router.push(`/pets/${birthday.p.id}`)} accessibilityLabel="Doğum günü">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PetAvatar pet={birthday.p} size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {birthday.b.days === 0 ? `Bugün ${genitive(birthday.p.name)} doğum günü!` : `${birthday.p.name} ${birthday.b.days} gün sonra ${birthday.b.turns} yaşında`}
                </Text>
                <Text variant="caption" tone="muted">
                  {birthday.b.days === 0 ? `${birthday.b.turns} yaşına girdi.` : 'Küçük bir kutlama planlamak için güzel bir zaman.'}
                </Text>
              </View>
              <Icon name="gift-outline" size={24} color={t.honey} />
            </View>
          </Card>
        </View>
      ) : null}

      {/* Dostlar */}
      <Section title="Dostların" action={pets.length > 0 ? 'Tümü' : undefined} onAction={() => router.push('/pets')} style={{ marginTop: 24 }}>
        {pets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
            {pets.map((p) => (
              <PetTile key={p.id} pet={p} next={nextByPet[p.id]} />
            ))}
            <Pressable
              onPress={() => router.push('/pets/create')}
              accessibilityRole="button"
              accessibilityLabel="Dost ekle"
              style={({ pressed }) => ({
                width: 120,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: t.borderStrong,
                backgroundColor: pressed ? t.surfaceAlt : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              })}
            >
              <Icon name="add" size={26} color={t.primary} />
              <Text variant="caption" tone="primary">
                Dost ekle
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <Card onPress={() => router.push('/pets/create')} accessibilityLabel="Dost ekle">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconBadge name="paw" size={52} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">İlk dostunu ekle</Text>
                <Text variant="caption" tone="muted">
                  Fotoğrafı, aşı takvimi, kilo takibi ve acil kartı tek yerde.
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={t.textSubtle} />
            </View>
          </Card>
        )}
      </Section>

      {/* Yaklaşan bakım */}
      {pets.length > 0 ? (
        <Section title="Yaklaşan bakım" action="Ekle" onAction={() => router.push('/care/edit')}>
          {care.length > 0 ? (
            <Group>
              {care.slice(0, 3).map((c, i, arr) => (
                <CareRow
                  key={c.id}
                  item={c}
                  petName={pets.length > 1 ? petsById[c.pet_id]?.name : undefined}
                  onPress={() => router.push(`/care/edit?id=${c.id}`)}
                  onDone={() => done(c)}
                  last={i === arr.length - 1}
                />
              ))}
            </Group>
          ) : (
            <Card onPress={() => router.push('/care/edit')} accessibilityLabel="Bakım ekle">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <IconBadge name="calendar-outline" size={44} />
                <Text variant="callout" tone="muted" style={{ flex: 1 }}>
                  Aşı ve parazit günlerini ekle; zamanı gelince hatırlatalım.
                </Text>
                <Icon name="add-circle" size={26} color={t.primary} />
              </View>
            </Card>
          )}
        </Section>
      ) : null}

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

      {/* Yakındaki klinik */}
      <Section title="Şu an açık, en yakın" action="Tümü" onAction={() => router.push('/nearby')}>
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

      {/* Topluluk */}
      <Section title="Topluluktan" action="Tümü" onAction={() => router.push('/community')}>
        {latest.items.length > 0 ? (
          latest.items.map((q) => <QuestionCard key={q.id} q={q} compact />)
        ) : (
          <Card onPress={() => router.push('/community/ask')} accessibilityLabel="Veterinere sor">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconBadge name="chatbubbles-outline" size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Veterinere sor</Text>
                <Text variant="caption" tone="muted">
                  Beslenme, davranış, aşı… Onaylı hekimler yanıtlıyor.
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={t.textSubtle} />
            </View>
          </Card>
        )}
      </Section>

      {/* Acil durumda */}
      <Section title="Acil durumda">
        <Group>
          <ListRow
            icon="medkit"
            iconColor={t.sos}
            iconBg={t.sosSoft}
            title="Acil veteriner bul"
            subtitle="En yakın açık klinik, tek dokunuşla ara"
            onPress={() => router.push('/emergency')}
          />
          <ListRow icon="bandage-outline" title="İlk yardım rehberi" subtitle="Veterinere ulaşana kadar" onPress={() => router.push('/first-aid')} last />
        </Group>
      </Section>
    </Screen>
  );
}

function PetTile({ pet, next }: { pet: Pet; next?: CareItem }) {
  const t = useTheme();
  const due = next ? dueLabel(next.due) : null;
  return (
    <Pressable
      onPress={() => router.push(`/pets/${pet.id}`)}
      accessibilityRole="button"
      accessibilityLabel={pet.name}
      style={({ pressed }) => ({
        width: 168,
        padding: 14,
        borderRadius: radius.lg,
        backgroundColor: pressed ? t.surfaceAlt : t.surface,
        borderWidth: 1,
        borderColor: t.border,
      })}
    >
      <PetAvatar pet={pet} size={64} />
      <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 10 }}>
        {pet.name}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {pet.breed ?? speciesLabel(pet.species)}
      </Text>
      <View style={{ marginTop: 10, minHeight: 24 }}>
        {next && due ? (
          <>
            <Text variant="caption" numberOfLines={1} style={{ fontSize: 12 }}>
              {next.title}
            </Text>
            <View style={{ marginTop: 4 }}>
              <Badge label={due.label} tone={due.tone} />
            </View>
          </>
        ) : (
          <Text variant="caption" tone="primary" style={{ fontSize: 12 }}>
            Takvim ekle
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function NearestCard({ clinic }: { clinic: Clinic }) {
  const s = clinicStatus(clinic);
  const meta = [clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null, clinic.district].filter(Boolean).join(' · ');
  return (
    <Card onPress={() => router.push(`/clinic/${clinic.id}`)} accessibilityLabel={clinic.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {clinic.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
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
          variant="soft"
          size={46}
          accessibilityLabel={`${clinic.name} ara`}
          onPress={() => callClinic({ id: clinic.id, name: clinic.name, phone: clinic.phone ?? clinic.emergency_phone ?? null }, 'home')}
        />
      </View>
    </Card>
  );
}
