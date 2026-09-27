import React, { useCallback, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Card, Badge, Button, Icon, IconButton } from '@/components/ds';
import { Art } from '@/components/art';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { useTheme } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { upcomingCare, type CareItem } from '@/lib/data/care';
import { speciesLabel, petAge } from '@/lib/utils/pets';
import { dueLabel } from '@/lib/utils/dates';
import type { Pet } from '@/types';

function PetRow({ pet, next }: { pet: Pet; next?: CareItem }) {
  const t = useTheme();
  const details = [pet.breed ?? speciesLabel(pet.species), petAge(pet), pet.weight_kg != null ? `${String(pet.weight_kg).replace('.', ',')} kg` : null]
    .filter(Boolean)
    .join(' · ');
  const alerts = [pet.allergies ? 'Alerji' : null, pet.medications ? 'İlaç' : null, pet.chronic_conditions ? 'Kronik' : null].filter(Boolean) as string[];
  const due = next ? dueLabel(next.due) : null;
  return (
    <Card onPress={() => router.push(`/pets/${pet.id}`)} style={{ marginHorizontal: 20, marginBottom: 12 }} accessibilityLabel={pet.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <PetAvatar pet={pet} size={64} />
        <View style={{ flex: 1 }}>
          <Text variant="headline">{pet.name}</Text>
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }} numberOfLines={1}>
            {details}
          </Text>
          {alerts.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {alerts.map((a) => (
                <Badge key={a} label={a} tone="sos" />
              ))}
            </View>
          ) : null}
        </View>
        <Icon name="chevron-forward" size={20} color={t.textSubtle} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
        <Icon name="calendar-outline" size={16} color={t.textMuted} />
        {next && due ? (
          <>
            <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
              {next.title}
            </Text>
            <Badge label={due.label} tone={due.tone} />
          </>
        ) : (
          <Text variant="caption" tone="primary" style={{ flex: 1 }}>
            Aşı ve parazit takvimini ekle
          </Text>
        )}
      </View>
    </Card>
  );
}

export default function PetsScreen() {
  const t = useTheme();
  const { pets, loading, load } = usePets();
  const [nextByPet, setNextByPet] = useState<Record<string, CareItem>>({});

  // Ekrana her dönüldüğünde (ör. dost ya da bakım ekledikten sonra) yenile
  useFocusEffect(
    useCallback(() => {
      load();
      upcomingCare().then((items) => {
        const map: Record<string, CareItem> = {};
        for (const c of items) if (!map[c.pet_id]) map[c.pet_id] = c;
        setNextByPet(map);
      });
    }, [load])
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Dostlarım</Text>
          <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
            Profil, bakım takvimi ve acil kart
          </Text>
        </View>
        <IconButton icon="add" variant="primary" onPress={() => router.push('/pets/create')} accessibilityLabel="Dost ekle" size={44} />
      </View>

      {loading && pets.length === 0 ? (
        <ActivityIndicator color={t.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <PetRow pet={item} next={nextByPet[item.id]} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 12 }}>
              <Art name="petcard" width={240} />
              <Text variant="headline" center style={{ marginTop: 8 }}>
                İlk dostunu ekle
              </Text>
              <Text variant="callout" tone="muted" center style={{ marginTop: 6 }}>
                Fotoğrafı, aşı ve parazit takvimi, kilo takibi ve acil sağlık kartı tek yerde. Bilgiler yalnızca telefonunda saklanır.
              </Text>
              <Button title="Dost ekle" icon="add" onPress={() => router.push('/pets/create')} style={{ marginTop: 18 }} />
            </View>
          }
        />
      )}
    </Screen>
  );
}
