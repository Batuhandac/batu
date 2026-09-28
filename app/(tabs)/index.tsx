import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Icon, Card, Section, Avatar, Button, IconButton, Badge, Group, ListRow, Carousel, useToast } from '@/components/ds';
import { BannerCard } from '@/components/home/BannerCard';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { PetFace, usePastel } from '@/components/art';
import { pastelOf } from '@/lib/art/faces';
import { CareRow } from '@/components/care/CareRow';
import { useTheme, radius } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useLocation } from '@/lib/hooks/useLocation';
import { useClinics } from '@/lib/hooks/useClinics';
import { useMyQuestions, useUnreadMessages } from '@/lib/hooks/useCommunity';
import { loadCachedRemoteBanners, fetchRemoteBanners, selectBanners } from '@/lib/content/banners';
import { syncVetRecordsSometimes } from '@/lib/data/vetLink';
import { upcomingCare, completeCare, type CareItem } from '@/lib/data/care';
import { clinicStatus, formatDistance, pickBestClinic } from '@/lib/utils/status';
import { dueLabel, formatDate, todayISO } from '@/lib/utils/dates';
import { callClinic } from '@/lib/utils/call';
import { speciesLabel, upcomingBirthday } from '@/lib/utils/pets';
import { track } from '@/lib/analytics';
import { useSession } from '@/stores/session';
import { useGame } from '@/lib/hooks/useGame';
import { FirstStepsCard, KarneCard, NewBadgeSheet } from '@/components/game';
import { closeFirstSteps, markBadgesSeen } from '@/lib/data/gameStore';
import { BADGES, POINTS } from '@/lib/game';
import type { Clinic, Pet } from '@/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler!';
  if (h < 12) return 'Günaydın!';
  if (h < 18) return 'İyi günler!';
  return 'İyi akşamlar!';
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
  const game = useGame();
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
      game.reload();
      myQuestions.reload();
      refreshNearest();
      // Veterinerin panelden girdiği yeni kayıtlar takvime düşsün
      syncVetRecordsSometimes().then((added) => {
        if (!added.length) return;
        toast(`${added[0].clinic_name} ${added.length} kayıt ekledi: ${added.map((x) => x.title).join(', ')}`, 'medkit');
        loadCare();
        game.reload();
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPets, loadCare, game.reload, myQuestions.reload, refreshNearest])
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
    const gained = todayISO() <= c.due ? POINTS.doneOnTime : POINTS.doneLate;
    const next = await completeCare(c.id);
    track('care_done', { kind: c.kind, from: 'home' });
    toast(`Aferin, yapıldı! +${gained} pati${next ? ` · Sonraki: ${formatDate(next.due, false)}` : ''}`, 'paw');
    loadCare();
    loadPets();
    game.reload();
  };

  const primary = pets.find((p) => p.is_primary) ?? pets[0];
  const onStep = (id: string) => {
    if (id === 'pet') router.push('/pets/create');
    else if (id === 'care') router.push(pets.length ? '/care/edit' : '/pets/create');
    else if (id === 'card') router.push(primary ? `/pets/${primary.id}` : '/pets/create');
    else if (id === 'location') request().then(() => game.reload());
    else if (id === 'firstaid') router.push('/first-aid');
  };
  const sum = game.summary;
  const showSteps = !!sum && !game.stepsClosed;

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
            {firstName ? `Merhaba ${firstName}!` : greeting()}
          </Text>
          <Text variant="callout" tone="muted" style={{ marginTop: 2 }} numberOfLines={1}>
            {petLine(pets)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(role === 'guest' ? '/auth' : '/account')}
          accessibilityRole="button"
          accessibilityLabel={role === 'guest' ? 'Giriş yap' : 'Hesabım'}
          hitSlop={10}
          style={({ pressed }) => ({ marginBottom: 30, opacity: pressed ? 0.6 : 1 })}
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

      {/* İlk adımlar (yeni kullanıcı) */}
      {showSteps && sum ? (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <FirstStepsCard
            steps={sum.steps}
            onStep={onStep}
            onClose={async () => {
              await closeFirstSteps();
              game.reload();
            }}
          />
        </View>
      ) : null}

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
      <Section title="Dostların" action={pets.length > 0 ? 'Tümü' : undefined} onAction={() => router.push('/pets')} style={{ marginTop: 24 }}>
        {pets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
            {pets.map((p) => (
              <PetCard key={p.id} pet={p} next={nextByPet[p.id]} />
            ))}
            <Pressable
              onPress={() => router.push('/pets/create')}
              accessibilityRole="button"
              accessibilityLabel="Dost ekle"
              style={({ pressed }) => ({
                width: 116,
                borderRadius: radius.lg,
                backgroundColor: t.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Icon name="add-circle-outline" size={30} color={t.primary} />
              <Text variant="callout" tone="primary">
                Dost ekle
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <FirstPetCard />
        )}
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

      {/* Pati karnesi */}
      {sum && (pets.length > 0 || sum.points > 0) ? (
        <Section title="Pati karnen" action="Rozetler" onAction={() => router.push('/karne')}>
          <KarneCard
            levelName={sum.level.name}
            points={sum.points}
            progress={sum.level.progress}
            toNext={sum.level.toNext}
            nextName={sum.level.next?.name ?? null}
            earned={sum.earned.length}
            total={BADGES.length}
            streak={sum.streak}
            onPress={() => router.push('/karne')}
          />
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
            tint="rose"
            iconColor={t.sos}
            title="Acil veteriner bul"
            subtitle="En yakın açık klinik, tek dokunuşla ara"
            onPress={() => router.push('/emergency')}
          />
          <ListRow icon="bandage-outline" tint="peach" title="İlk yardım rehberi" subtitle="Veterinere ulaşana kadar" onPress={() => router.push('/first-aid')} last />
        </Group>
      </Section>

      <NewBadgeSheet
        badges={game.fresh}
        onClose={async () => {
          await markBadgesSeen(game.fresh.map((b) => b.id));
          game.reload();
        }}
      />
    </Screen>
  );
}

/** "Boncuk ve Minnoş bugün nasıl?" */
function petLine(pets: Pet[]): string {
  if (pets.length === 0) return 'Dostunu ekle, bakımını birlikte takip edelim.';
  const names = pets.map((p) => p.name);
  const who = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} ve ${names[1]}` : `${names[0]}, ${names[1]} ve ${names.length - 2} dostun`;
  return `${who} bugün nasıl?`;
}

/** Dost kartı: kendi pastel renginde, yakında doğum günü varsa onu, yoksa sıradaki bakımı gösterir. */
function PetCard({ pet, next }: { pet: Pet; next?: CareItem }) {
  const t = useTheme();
  const bg = usePastel(pastelOf(pet.id));
  const bday = upcomingBirthday(pet);
  const due = next ? dueLabel(next.due) : null;
  const soon = bday && bday.days <= 7;
  let line: React.ReactNode = pet.breed ?? speciesLabel(pet.species);
  if (soon && bday) {
    line = bday.days === 0 ? `Bugün doğum günü` : `${bday.days} gün sonra ${bday.turns} yaşında`;
  } else if (next && due) {
    const c = due.tone === 'sos' ? t.sos : due.tone === 'honey' ? t.honey : t.textMuted;
    line = (
      <>
        {next.title} ·{' '}
        <Text variant="caption" color={c} style={due.tone === 'sos' || due.tone === 'honey' ? { fontWeight: '600' } : undefined}>
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
      style={({ pressed }) => ({ width: 156, padding: 14, borderRadius: radius.lg, backgroundColor: bg, opacity: pressed ? 0.8 : 1 })}
    >
      <PetAvatar pet={pet} size={76} plain mood={soon ? 'wink' : 'happy'} />
      <Text variant="headline" numberOfLines={1} style={{ marginTop: 8 }}>
        {pet.name}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>
        {soon ? <Icon name="gift-outline" size={12} color={t.textMuted} /> : null}
        {soon ? ' ' : ''}
        {line}
      </Text>
    </Pressable>
  );
}

/** Henüz dost yokken: kenardan bakan iki maskotla davet. */
function FirstPetCard() {
  const bg = usePastel('peach');
  return (
    <Pressable
      onPress={() => router.push('/pets/create')}
      accessibilityRole="button"
      accessibilityLabel="İlk dostunu ekle"
      style={({ pressed }) => ({ borderRadius: radius.lg, backgroundColor: bg, padding: 18, paddingRight: 150, minHeight: 124, overflow: 'hidden', opacity: pressed ? 0.8 : 1 })}
    >
      <Text variant="headline">İlk dostunu ekle</Text>
      <Text variant="callout" tone="muted" style={{ marginTop: 4 }}>
        Aşı takvimi, kilo ve acil sağlık kartı tek yerde.
      </Text>
      <View style={{ position: 'absolute', right: 70, bottom: -14 }}>
        <PetFace species="cat" seed="ilk-kedi" fur="ginger" size={92} />
      </View>
      <View style={{ position: 'absolute', right: 4, bottom: -20 }}>
        <PetFace species="dog" seed="ilk-kopek" fur="cream" mood="wink" size={92} />
      </View>
    </Pressable>
  );
}

function NearestCard({ clinic }: { clinic: Clinic }) {
  const t = useTheme();
  const s = clinicStatus(clinic);
  const meta = [clinic.distance_km > 0 ? formatDistance(clinic.distance_km, clinic.location_approx) : null, clinic.district].filter(Boolean).join(' · ');
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
