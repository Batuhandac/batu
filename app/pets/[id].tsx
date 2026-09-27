import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Screen, Header, Text, Card, Avatar, Button, Badge, IconButton, Icon } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { getPet, removePet, setPrimaryPet } from '@/lib/data/localStore';
import { sharePetCard, shareViaWhatsApp } from '@/lib/utils/share';
import { speciesLabel } from '@/lib/utils/pets';
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

export default function PetDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);

  const loadPet = async () => {
    const data = await getPet(id);
    if (data) setPet(data);
  };

  // Düzenleme ekranından dönünce güncel hâli göster
  useFocusEffect(React.useCallback(() => { loadPet(); }, [id]));

  if (!pet) return <Screen>{null}</Screen>;

  const handleDelete = () => {
    Alert.alert('Kart silinsin mi?', `${pet.name} için kaydettiğin bilgiler bu telefondan silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await removePet(id);
          router.back();
        },
      },
    ]);
  };

  const meta = [speciesLabel(pet.species), pet.breed].filter(Boolean).join(' · ');

  return (
    <Screen scroll>
      <Header
        title=""
        large={false}
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon="create-outline" onPress={() => router.push(`/pets/create?id=${pet.id}`)} accessibilityLabel="Düzenle" size={40} />
            <IconButton icon="trash-outline" onPress={handleDelete} accessibilityLabel="Sil" size={40} color={t.danger} />
          </View>
        }
      />

      {/* Acil sağlık kartı */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ borderRadius: radius.xl, backgroundColor: t.primary, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="overline" color={t.dark ? t.onPrimary : 'rgba(255,255,255,0.8)'}>
              Acil sağlık kartı
            </Text>
            <Icon name="medkit" size={18} color={t.onPrimary} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <Avatar label={pet.name} size={60} color={t.primary} background={t.onPrimary} />
            <View style={{ flex: 1 }}>
              <Text variant="title" color={t.onPrimary}>
                {pet.name}
              </Text>
              {meta ? (
                <Text variant="callout" color={t.onPrimary} style={{ opacity: 0.85 }}>
                  {meta}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {[
              { k: 'Yaş', v: pet.age_years != null ? `${pet.age_years}` : '—' },
              { k: 'Kilo', v: pet.weight_kg != null ? `${pet.weight_kg} kg` : '—' },
            ].map((x) => (
              <View key={x.k} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, padding: 12 }}>
                <Text variant="caption" color={t.onPrimary} style={{ opacity: 0.8 }}>
                  {x.k}
                </Text>
                <Text variant="headline" color={t.onPrimary}>
                  {x.v}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {pet.is_primary ? (
          <View style={{ marginTop: 12 }}>
            <Badge label="Acil Mod'da bu kart gösterilir" tone="primary" icon="checkmark-circle" />
          </View>
        ) : (
          <Button
            title="Acil Mod'da bu kartı göster"
            variant="ghost"
            icon="star-outline"
            onPress={async () => {
              await setPrimaryPet(pet.id);
              await loadPet();
            }}
            style={{ alignSelf: 'flex-start', marginTop: 6, marginLeft: -12 }}
          />
        )}

        <Card style={{ marginTop: 14, paddingVertical: 6 }}>
          {(
            [
              { label: 'Alerji', value: pet.allergies, alert: true },
              { label: 'İlaçlar', value: pet.medications, alert: true },
              { label: 'Kronik hastalık', value: pet.chronic_conditions, alert: true },
              { label: 'Son aşı', value: pet.last_vaccine_date },
              { label: 'Son parazit', value: pet.last_parasite_date },
              { label: 'Acil not', value: pet.emergency_note, alert: true },
              { label: 'Sahibi', value: [pet.owner_name, pet.owner_phone].filter(Boolean).join(' · ') || null },
            ].filter((r) => !!r.value) as { label: string; value: string; alert?: boolean }[]
          ).map((r, i) => (
            <Row key={r.label} label={r.label} value={r.value} alert={r.alert} first={i === 0} />
          ))}
          {!pet.allergies && !pet.medications && !pet.chronic_conditions && !pet.emergency_note && (
            <Text variant="callout" tone="muted" style={{ paddingVertical: 10 }}>
              Sağlık bilgisi eklenmemiş. Alerji ya da ilaç varsa eklemen acil anda çok işe yarar.
            </Text>
          )}
        </Card>

        <Text variant="overline" tone="subtle" style={{ marginTop: 24, marginBottom: 10 }}>
          Kartı paylaş
        </Text>
        <View style={{ gap: 10 }}>
          <Button
            title="WhatsApp ile gönder"
            icon="logo-whatsapp"
            full
            onPress={() => {
              track('pet_card_shared', { pet_id: id, via: 'whatsapp' });
              shareViaWhatsApp(pet);
            }}
          />
          <Button
            title="Diğer uygulamalarla paylaş"
            icon="share-outline"
            variant="secondary"
            full
            onPress={() => {
              track('pet_card_shared', { pet_id: id });
              sharePetCard(pet);
            }}
          />
        </View>
        <Text variant="caption" tone="subtle" center style={{ marginTop: 14 }}>
          Bilgiler yalnızca bu telefonda saklanır.
        </Text>
      </View>
    </Screen>
  );
}
