import React, { useCallback, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Card, Button, Icon, IconButton } from '@/components/ds';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { PetFace } from '@/components/art';
import { useTheme, hairline } from '@/lib/theme';
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
  const alerts = [pet.allergies ? 'Alerji' : null, pet.medications ? 'İlaç' : null, pet.chronic_conditions ? 'Kronik hastalık' : null].filter(Boolean) as string[];
  const due = next ? dueLabel(next.due) : null;
  const dueColor = due?.tone === 'sos' ? t.sos : due?.tone === 'honey' ? t.honey : t.textMuted;
  return (
    <Card onPress={() => router.push(`/pets/${pet.id}`)} style={{ marginHorizontal: 20, marginBottom: 10 }} accessibilityLabel={pet.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <PetAvatar pet={pet} size={56} />
        <View style={{ flex: 1 }}>
          <Text variant="headline">{pet.name}</Text>
          <Text variant="caption" tone="muted" style={{ marginTop: 1 }} numberOfLines={1}>
            {details}
          </Text>
          {alerts.length > 0 ? (
            <Text variant="caption" tone="sos" style={{ marginTop: 3, fontWeight: '600' }} numberOfLines={1}>
              {alerts.join(' · ')}
            </Text>
          ) : null}
        </View>
        <Icon name="chevron-forward" size={17} color={t.textSubtle} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: hairline, borderTopColor: t.border }}>
        {next && due ? (
          <Text variant="caption" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
            Sıradaki: {next.title} ·{' '}
            <Text variant="caption" color={dueColor} style={due.tone === 'sos' || due.tone === 'honey' ? { fontWeight: '600' } : undefined}>
              {due.label.toLocaleLowerCase('tr-TR')}
            </Text>
          </Text>
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
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 4, minHeight: 44, alignItems: 'center' }}>
        <IconButton icon="add" variant="plain" onPress={() => router.push('/pets/create')} accessibilityLabel="Dost ekle" size={36} />
      </View>
      <Text variant="display" style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        Dostlarım
      </Text>

      {loading && pets.length === 0 ? (
        <ActivityIndicator color={t.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <PetRow pet={item} next={nextByPet[item.id]} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 32 }}>
              <View style={{ flexDirection: 'row' }}>
                <PetFace species="cat" seed="bos-kedi" fur="ginger" size={104} background="peach" />
                <View style={{ marginLeft: -18 }}>
                  <PetFace species="dog" seed="bos-kopek" fur="cream" mood="wink" size={104} background="mint" />
                </View>
              </View>
              <Text variant="headline" center style={{ marginTop: 14 }}>
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
