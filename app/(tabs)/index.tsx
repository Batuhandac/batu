import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Icon, Card, Section, Avatar, Button, IconButton, Badge, Group, ListRow, Carousel, useToast } from '@/components/ds';
import { BannerCard } from '@/components/home/BannerCard';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { CareRow } from '@/components/care/CareRow';
import { useTheme, hairline } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useLocation } from '@/lib/hooks/useLocation';
import { useClinics } from '@/lib/hooks/useClinics';
import { useMyQuestions, useUnreadMessages } from '@/lib/hooks/useCommunity';
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
      myQuestions.reload();
      refreshNearest();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPets, loadCare, myQuestions.reload, refreshNearest])
  );

  const petsById = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);
  const nextByPet = useMemo(() => {
    const m: Record<string, CareItem> = {};
    for (const c of care) if (!m[c.pet_id]) m[c.pet_id] = c;
    return m;
  }, [care]);
  const best = useMemo(() => pickBestClinic(clinics), [clinics]);
  const banners = useMemo(() => selectBanners(remoteBanners, pets.length > 0), [remoteBanners, pets.length]);
  const update = myQuestions.mine.find((q) => (myQuestions.unread[q.id] ?? 0) > 0);
  const firstName = role !== 'guest' && name ? name.split(' ')[0] : null;

  const done = async (c: CareItem) => {
    const next = await completeCare(c.id);
    track('care_done', { kind: c.kind, from: 'home' });
    toast(next ? `Yapıldı. Sonraki: ${formatDate(next.due, false)}` : 'Yapıldı olarak kaydedildi');
    loadCare();
    loadPets();
  };

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen scroll>
      {/* Başlık: tarih, selam, hesap */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="overline" tone="muted">
            {today}
          </Text>
          <Text variant="display" numberOfLines={1}>
            {firstName ? `Merhaba ${firstName}` : greeting()}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(role === 'guest' ? '/auth' : '/account')}
          accessibilityRole="button"
          accessibilityLabel={role === 'guest' ? 'Giriş yap' : 'Hesabım'}
          hitSlop={10}
          style={({ pressed }) => ({ marginBottom: 4, opacity: pressed ? 0.6 : 1 })}
        >
          {role === 'guest' ? (
            <Text variant="body" tone="primary">
              Giriş yap
            </Text>
          ) : (
            <Avatar label={name ?? 'P'} size={36} />
          )}
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: -2, right: -4, width: 11, height: 11, borderRadius: 6, backgroundColor: t.sos, borderWidth: 2, borderColor: t.bg }} />
          ) : null}
        </Pressable>
      </View>

      {/* Duyurular */}
      {banners.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Carousel
            data={banners}
            keyOf={(b) => b.id}
            itemWidth={Math.min(width - 56, 400)}
            gap={10}
            autoPlayMs={0}
            renderItem={(b) => <BannerCard banner={b} />}
          />
        </View>
      ) : null}

      {/* Dostlar */}
      <Section title="Dostların" style={{ marginTop: 24 }}>
        <Group>
          {pets.map((p) => (
            <PetRow key={p.id} pet={p} next={nextByPet[p.id]} />
          ))}
          <ListRow
            icon="add-circle-outline"
            title={pets.length > 0 ? 'Dost ekle' : 'İlk dostunu ekle'}
            subtitle={pets.length > 0 ? undefined : 'Aşı takvimi, kilo ve acil sağlık kartı tek yerde'}
            onPress={() => router.push('/pets/create')}
            right={<View />}
            last
          />
        </Group>
      </Section>

      {/* Yaklaşan bakım */}
      {pets.length > 0 ? (
        <Section title="Yaklaşan bakım" action="Ekle" onAction={() => router.push('/care/edit')}>
          <Group>
            {care.length > 0 ? (
              care.slice(0, 3).map((c, i, arr) => (
                <CareRow
                  key={c.id}
                  item={c}
                  petName={pets.length > 1 ? petsById[c.pet_id]?.name : undefined}
                  onPress={() => router.push(`/care/edit?id=${c.id}`)}
                  onDone={() => done(c)}
                  last={i === arr.length - 1}
                />
              ))
            ) : (
              <ListRow
                icon="calendar-outline"
                title="Aşı ya da parazit günü ekle"
                subtitle="Bir gün önce ve gününde hatırlatırız"
                onPress={() => router.push('/care/edit')}
                last
              />
            )}
          </Group>
        </Section>
      ) : null}

      {/* Soruma yeni yanıt */}
      {update ? (
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Group>
            <ListRow
              icon="chatbubble-ellipses-outline"
              title={`Soruna ${myQuestions.total} yeni yanıt var`}
              subtitle={update.title}
              onPress={() => router.push(`/community/${update.id}`)}
              last
            />
          </Group>
        </View>
      ) : null}

      {/* Yakındaki klinik */}
      <Section title="En yakın açık klinik" action="Tümü" onAction={() => router.push('/nearby')}>
        {lat == null || lng == null ? (
          <Card>
            <Text variant="callout" tone="muted">
              Konumunu paylaşırsan en yakın açık kliniği burada gösteririz.
            </Text>
            <Button
              title={granted === false ? 'Bölge seç' : 'Konumumu kullan'}
              variant="secondary"
              loading={locating}
              onPress={() => (granted === false ? router.push('/nearby') : request())}
              style={{ marginTop: 12 }}
              full
            />
          </Card>
        ) : best ? (
          <NearestCard clinic={best} />
        ) : loading ? (
          <Card>
            <View style={{ height: 18, width: '70%', borderRadius: 4, backgroundColor: t.surfaceAlt }} />
            <View style={{ height: 13, width: '45%', borderRadius: 4, backgroundColor: t.surfaceAlt, marginTop: 10 }} />
          </Card>
        ) : (
          <Card onPress={() => router.push('/nearby')} accessibilityLabel="Tüm klinikler">
            <Text variant="body">Şu an açık olduğunu bildiğimiz klinik yok</Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              Saati bilinmeyen klinikleri aramayı dene. Tüm listeyi gör.
            </Text>
          </Card>
        )}
      </Section>

      {/* Acil durumda */}
      <Section title="Acil durumda">
        <Group>
          <ListRow
            icon="medkit-outline"
            iconColor={t.sos}
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

/** Dost satırı: yakında doğum günü varsa onu, yoksa sıradaki bakımı gösterir. */
function PetRow({ pet, next }: { pet: Pet; next?: CareItem }) {
  const t = useTheme();
  const bday = upcomingBirthday(pet);
  const due = next ? dueLabel(next.due) : null;
  let sub: React.ReactNode = pet.breed ?? speciesLabel(pet.species);
  if (bday && bday.days <= 7) {
    sub = bday.days === 0 ? `Bugün ${genitive(pet.name)} doğum günü, ${bday.turns} yaşında` : `${bday.days} gün sonra ${bday.turns} yaşında`;
  } else if (next && due) {
    const c = due.tone === 'sos' ? t.sos : due.tone === 'honey' ? t.honey : undefined;
    sub = (
      <>
        {next.title} ·{' '}
        <Text variant="caption" color={c ?? t.textMuted} style={c ? { fontWeight: '600' } : undefined}>
          {due.label.toLocaleLowerCase('tr-TR')}
        </Text>
      </>
    );
  }
  return (
    <Pressable
      onPress={() => router.push(`/pets/${pet.id}`)}
      accessibilityRole="button"
      accessibilityLabel={pet.name}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, backgroundColor: pressed ? t.surfaceAlt : 'transparent' })}
    >
      <PetAvatar pet={pet} size={40} />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 12,
          paddingVertical: 10,
          paddingRight: 16,
          minHeight: 60,
          borderBottomWidth: hairline,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>
            {pet.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 1 }}>
            {sub}
          </Text>
        </View>
        <Icon name="chevron-forward" size={17} color={t.textSubtle} />
      </View>
    </Pressable>
  );
}

function NearestCard({ clinic }: { clinic: Clinic }) {
  const t = useTheme();
  const s = clinicStatus(clinic);
  const meta = [clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null, clinic.district].filter(Boolean).join(' · ');
  return (
    <Card onPress={() => router.push(`/clinic/${clinic.id}`)} accessibilityLabel={clinic.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {clinic.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
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
          size={44}
          color={t.onPrimary}
          accessibilityLabel={`${clinic.name} ara`}
          onPress={() => callClinic({ id: clinic.id, name: clinic.name, phone: clinic.phone ?? clinic.emergency_phone ?? null }, 'home')}
        />
      </View>
    </Card>
  );
}
