import React, { useCallback, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Screen, Header, Text, Card, Button, Badge, IconButton, Icon, Group, Section, Chip, useToast } from '@/components/ds';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { CareRow } from '@/components/care/CareRow';
import { WeightCard } from '@/components/care/WeightCard';
import { useTheme, radius } from '@/lib/theme';
import { getPet, removePet, setPrimaryPet } from '@/lib/data/localStore';
import { upcomingCare, doneCare, completeCare, loadWeights, removePetCare, kindMeta, type CareItem, type WeightEntry } from '@/lib/data/care';
import { deletePetPhoto } from '@/lib/data/petPhoto';
import { sharePetCard, shareViaWhatsApp } from '@/lib/utils/share';
import { speciesLabel, petAge, sexLabel, upcomingBirthday, genitive } from '@/lib/utils/pets';
import { formatDate } from '@/lib/utils/dates';
import { track } from '@/lib/analytics';
import type { Pet } from '@/types';

function Row({ label, value, alert, first }: { label: string; value: string; alert?: boolean; first?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: t.border, gap: 12 }}>
      <Text variant="caption" tone="muted" style={{ width: 96, marginTop: 2 }}>
        {label}
      </Text>
      <Text variant={alert ? 'bodyStrong' : 'body'} tone={alert ? 'sos' : 'default'} style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

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
    const next = await completeCare(item.id);
    track('care_done', { kind: item.kind });
    toast(next ? `Yapıldı. Sonraki: ${formatDate(next.due, false)}` : 'Yapıldı olarak kaydedildi');
    load();
  };

  const age = petAge(pet);
  const sex = sexLabel(pet);
  const bday = upcomingBirthday(pet);
  const facts = [speciesLabel(pet.species), pet.breed].filter(Boolean).join(' · ');

  return (
    <Screen scroll>
      <Header
        title=""
        large={false}
        onBack={() => router.back()}
        right={<IconButton icon="create-outline" onPress={() => router.push(`/pets/create?id=${pet.id}`)} accessibilityLabel="Profili düzenle" size={40} />}
      />

      {/* Profil */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
        <PetAvatar pet={pet} size={112} />
        <Text variant="title" center style={{ marginTop: 14 }}>
          {pet.name}
        </Text>
        {facts ? (
          <Text variant="callout" tone="muted" center style={{ marginTop: 2 }}>
            {facts}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          {age ? <Badge label={age} tone="primary" /> : null}
          {sex ? <Badge label={sex} tone="neutral" /> : null}
          {pet.weight_kg != null ? <Badge label={`${String(pet.weight_kg).replace('.', ',')} kg`} tone="neutral" /> : null}
          {pet.chip_no ? <Badge label="Çipli" tone="neutral" icon="radio-outline" /> : null}
        </View>
      </View>

      {bday && bday.days <= 14 ? (
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <Card tone="honey">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="gift-outline" size={24} color={t.honey} />
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

      {/* Kilo */}
      <Section title="Kilo">
        <WeightCard petId={pet.id} petName={pet.name} entries={weights} onChanged={load} />
      </Section>

      {/* Acil sağlık kartı */}
      <Section title="Acil sağlık kartı">
        <View style={{ borderRadius: radius.xl, backgroundColor: t.primary, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="overline" color={t.dark ? t.onPrimary : 'rgba(255,255,255,0.8)'}>
              Veterinere söylenecekler
            </Text>
            <Icon name="medkit" size={18} color={t.onPrimary} />
          </View>
          <View style={{ marginTop: 10 }}>
            {(
              [
                { label: 'Alerji', value: pet.allergies },
                { label: 'İlaçlar', value: pet.medications },
                { label: 'Kronik', value: pet.chronic_conditions },
                { label: 'Son aşı', value: pet.last_vaccine_date },
                { label: 'Son parazit', value: pet.last_parasite_date },
                { label: 'Çip no', value: pet.chip_no ?? null },
                { label: 'Acil not', value: pet.emergency_note },
              ].filter((r) => !!r.value) as { label: string; value: string }[]
            ).map((r) => (
              <View key={r.label} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6 }}>
                <Text variant="caption" color={t.onPrimary} style={{ width: 84, opacity: 0.8 }}>
                  {r.label}
                </Text>
                <Text variant="callout" color={t.onPrimary} style={{ flex: 1 }}>
                  {r.value}
                </Text>
              </View>
            ))}
            {!pet.allergies && !pet.medications && !pet.chronic_conditions && !pet.emergency_note ? (
              <Text variant="callout" color={t.onPrimary} style={{ opacity: 0.9, marginTop: 4 }}>
                Alerji ya da ilaç varsa profile eklemen acil anda çok işe yarar.
              </Text>
            ) : null}
          </View>
        </View>
        {pet.is_primary ? (
          <View style={{ marginTop: 10 }}>
            <Badge label="Acil modda bu kart gösterilir" tone="primary" icon="checkmark-circle" />
          </View>
        ) : (
          <Button
            title="Acil modda bu kartı göster"
            variant="ghost"
            icon="star-outline"
            onPress={async () => {
              await setPrimaryPet(pet.id);
              load();
            }}
            style={{ alignSelf: 'flex-start', marginTop: 6, marginLeft: -12 }}
          />
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: t.border }}
              >
                <Icon name="checkmark-circle" size={20} color={t.open} />
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
