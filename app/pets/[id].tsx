import React, { useCallback, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Screen, Header, Text, Card, Button, Badge, Icon, Group, Section, Chip, useToast } from '@/components/ds';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { CareRow } from '@/components/care/CareRow';
import { WeightCard } from '@/components/care/WeightCard';
import { VetLinkSection } from '@/components/pets/VetLinkSection';
import { useTheme, hairline, radius } from '@/lib/theme';
import { PASTELS, pastelOf } from '@/lib/art/faces';
import { cardFields, POINTS } from '@/lib/game';
import { ProgressBar } from '@/components/game';
import { getPet, removePet, setPrimaryPet } from '@/lib/data/localStore';
import { upcomingCare, doneCare, completeCare, loadWeights, removePetCare, kindMeta, type CareItem, type WeightEntry } from '@/lib/data/care';
import { deletePetPhoto } from '@/lib/data/petPhoto';
import { sharePetCard, shareViaWhatsApp } from '@/lib/utils/share';
import { speciesLabel, petAge, sexLabel, upcomingBirthday, genitive } from '@/lib/utils/pets';
import { formatDate, todayISO } from '@/lib/utils/dates';
import { track } from '@/lib/analytics';
import type { Pet } from '@/types';

const QUICK_KINDS = ['vaccine', 'internal_parasite', 'external_parasite', 'checkup'] as const;

export default function PetDetailScreen() {
  const t = useTheme();
  const toast = useToast((s) => s.show);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [care, setCare] = useState<CareItem[]>([]);
  const [history, setHistory] = useState<CareItem[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  const load = useCallback(async () => {
    const [p, up, done, w] = await Promise.all([getPet(id), upcomingCare(id), doneCare(id), loadWeights(id)]);
    setPet(p);
    setCare(up);
    setHistory(done);
    setWeights(w);
  }, [id]);

  // Düzenleme / bakım ekranlarından dönünce güncel hâli göster
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!pet) return <Screen>{null}</Screen>;

  const handleDelete = () => {
    Alert.alert(`${pet.name} silinsin mi?`, 'Profil, bakım takvimi ve kilo kayıtları bu telefondan silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await removePetCare(pet.id);
          await deletePetPhoto(pet.photo_uri);
          await removePet(pet.id);
          router.back();
        },
      },
    ]);
  };

  const done = async (item: CareItem) => {
    const gained = todayISO() <= item.due ? POINTS.doneOnTime : POINTS.doneLate;
    const next = await completeCare(item.id);
    track('care_done', { kind: item.kind });
    toast(`Aferin, yapıldı! +${gained} pati${next ? ` · Sonraki: ${formatDate(next.due, false)}` : ''}`, 'paw');
    load();
  };

  const age = petAge(pet);
  const fields = cardFields(pet, [...care, ...history]);
  const missing = fields.filter((f) => !f.done);
  const filled = (fields.length - missing.length) / fields.length;
  const heroBg = PASTELS[t.dark ? 'dark' : 'light'][pastelOf(pet.id)];
  const emergencyRows = (
    [
      { label: 'Alerji', value: pet.allergies, alert: true },
      { label: 'İlaçlar', value: pet.medications, alert: true },
      { label: 'Kronik', value: pet.chronic_conditions, alert: true },
      { label: 'Son aşı', value: pet.last_vaccine_date },
      { label: 'Son parazit', value: pet.last_parasite_date },
      { label: 'Çip no', value: pet.chip_no ?? null },
      { label: 'Acil not', value: pet.emergency_note, alert: true },
    ] as { label: string; value: string | null; alert?: boolean }[]
  ).filter((r): r is { label: string; value: string; alert?: boolean } => !!r.value);
  const sex = sexLabel(pet);
  const bday = upcomingBirthday(pet);
  const facts = [speciesLabel(pet.species), pet.breed].filter(Boolean).join(' · ');
  const stats = [age, sex, pet.weight_kg != null ? `${String(pet.weight_kg).replace('.', ',')} kg` : null, pet.chip_no ? 'Çipli' : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen scroll>
      <Header
        title=""
        large={false}
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => router.push(`/pets/create?id=${pet.id}`)} accessibilityRole="button" accessibilityLabel="Profili düzenle" hitSlop={10}>
            <Text variant="body" tone="primary">
              Düzenle
            </Text>
          </Pressable>
        }
      />

      {/* Profil */}
      <View style={{ alignItems: 'center', marginHorizontal: 20, paddingVertical: 20, paddingHorizontal: 16, borderRadius: radius.xl, backgroundColor: heroBg }}>
        <PetAvatar pet={pet} size={120} plain={!pet.photo_uri} />
        <Text variant="title" center style={{ marginTop: 10 }}>
          {pet.name}
        </Text>
        {facts ? (
          <Text variant="callout" tone="muted" center style={{ marginTop: 2 }}>
            {facts}
          </Text>
        ) : null}
        {stats ? (
          <Text variant="callout" tone="muted" center style={{ marginTop: 2 }}>
            {stats}
          </Text>
        ) : null}
        {/* Kart doluluğu: eksikleri tek dokunuşla tamamlat */}
        <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text variant="caption" style={{ fontWeight: '800' }}>
              {filled === 1 ? 'Kart tamam' : `Kart %${Math.round(filled * 100)} dolu`}
            </Text>
            {filled < 1 ? (
              <Text variant="caption" tone="muted">
                Doldurdukça pati kazanırsın
              </Text>
            ) : null}
          </View>
          <ProgressBar value={filled} track={t.dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)'} />
          {missing.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {missing.slice(0, 3).map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  icon="add"
                  onPress={() => router.push(f.key === 'care' || f.key === 'vaccine' ? `/care/edit?petId=${pet.id}&kind=vaccine` : `/pets/create?id=${pet.id}`)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {bday && bday.days <= 14 ? (
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <Card style={{ backgroundColor: PASTELS[t.dark ? 'dark' : 'light'].butter }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="gift-outline" size={22} color={t.text} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {bday.days === 0 ? `Bugün ${genitive(pet.name)} doğum günü! ${bday.turns} yaşında.` : `${pet.name} ${bday.days} gün sonra ${bday.turns} yaşında.`}
              </Text>
            </View>
          </Card>
        </View>
      ) : null}

      {/* Bakım takvimi */}
      <Section title="Bakım takvimi" action="Ekle" onAction={() => router.push(`/care/edit?petId=${pet.id}`)}>
        {care.length > 0 ? (
          <Group>
            {care.slice(0, 6).map((c, i, arr) => (
              <CareRow key={c.id} item={c} onPress={() => router.push(`/care/edit?id=${c.id}`)} onDone={() => done(c)} last={i === arr.length - 1} />
            ))}
          </Group>
        ) : (
          <Card>
            <Text variant="callout" tone="muted">
              Aşı, parazit ve kontrol tarihlerini ekle; zamanı gelince hatırlatalım.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {QUICK_KINDS.map((k) => (
                <Chip key={k} label={kindMeta(k).label} icon={kindMeta(k).icon} onPress={() => router.push(`/care/edit?petId=${pet.id}&kind=${k}`)} />
              ))}
            </View>
          </Card>
        )}
      </Section>

      {/* Veterinerin: kodla kliniğe bağlama, klinikten gelen kayıtlar */}
      <VetLinkSection pet={pet} onChanged={load} />

      {/* Kilo */}
      <Section title="Kilo">
        <WeightCard petId={pet.id} petName={pet.name} entries={weights} onChanged={load} />
      </Section>

      {/* Acil sağlık kartı */}
      <Section title="Acil sağlık kartı">
        {emergencyRows.length > 0 ? (
          <Group>
            {emergencyRows.map((r, i) => (
              <View
                key={r.label}
                style={{ flexDirection: 'row', gap: 12, paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: i === emergencyRows.length - 1 ? 0 : hairline, borderBottomColor: t.border }}
              >
                <Text variant="callout" tone="muted" style={{ width: 96 }}>
                  {r.label}
                </Text>
                <Text variant="callout" tone={r.alert ? 'sos' : 'default'} style={[{ flex: 1 }, r.alert ? { fontWeight: '600' } : null]}>
                  {r.value}
                </Text>
              </View>
            ))}
          </Group>
        ) : null}
        {!pet.allergies && !pet.medications && !pet.chronic_conditions && !pet.emergency_note ? (
          <Text variant="caption" tone="muted" style={{ marginTop: 8, marginHorizontal: 16 }}>
            Alerji ya da ilaç varsa profile eklemen acil anda çok işe yarar.
          </Text>
        ) : (
          <Text variant="caption" tone="muted" style={{ marginTop: 8, marginHorizontal: 16 }}>
            Klinik ararken ekranında görünür. Veterinere bunları söyle.
          </Text>
        )}
        {pet.is_primary ? (
          <View style={{ marginTop: 12, marginLeft: 16 }}>
            <Badge label="Acil modda bu kart gösterilir" tone="primary" icon="checkmark-circle" />
          </View>
        ) : (
          <Button
            title="Acil modda bu kartı göster"
            variant="ghost"
            onPress={async () => {
              await setPrimaryPet(pet.id);
              load();
            }}
            style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 16 }}
          />
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Button
            title="WhatsApp"
            icon="logo-whatsapp"
            variant="secondary"
            onPress={() => {
              track('pet_card_shared', { pet_id: id, via: 'whatsapp' });
              shareViaWhatsApp(pet);
            }}
            style={{ flex: 1 }}
          />
          <Button
            title="Paylaş"
            icon="share-outline"
            variant="secondary"
            onPress={() => {
              track('pet_card_shared', { pet_id: id });
              sharePetCard(pet);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Section>

      {/* Geçmiş */}
      {history.length > 0 ? (
        <Section title="Geçmiş">
          <Group>
            {history.slice(0, 10).map((h, i, arr) => (
              <View
                key={h.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: i === arr.length - 1 ? 0 : hairline, borderBottomColor: t.border }}
              >
                <Icon name="checkmark-circle" size={20} color={t.textSubtle} />
                <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                  {h.title}
                </Text>
                <Text variant="caption" tone="muted">
                  {h.done_at ? formatDate(h.done_at) : ''}
                </Text>
              </View>
            ))}
          </Group>
        </Section>
      ) : null}

      <Pressable onPress={handleDelete} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', marginTop: 28, padding: 8 }}>
        <Text variant="callout" tone="danger">
          {pet.name} profilini sil
        </Text>
      </Pressable>
      <Text variant="caption" tone="subtle" center style={{ marginTop: 6 }}>
        Bilgiler yalnızca bu telefonda saklanır.
      </Text>
    </Screen>
  );
}
