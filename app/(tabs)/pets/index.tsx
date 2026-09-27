import React, { useCallback } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Card, Avatar, Badge, Button, EmptyState, Icon, IconButton } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { speciesLabel } from '@/lib/utils/pets';
import type { Pet } from '@/types';

function PetRow({ pet }: { pet: Pet }) {
  const t = useTheme();
  const details = [speciesLabel(pet.species), pet.breed, pet.age_years != null ? `${pet.age_years} yaş` : null, pet.weight_kg != null ? `${pet.weight_kg} kg` : null]
    .filter(Boolean)
    .join(' · ');
  const alerts = [pet.allergies ? 'Alerji' : null, pet.medications ? 'İlaç' : null, pet.chronic_conditions ? 'Kronik' : null].filter(Boolean) as string[];
  return (
    <Card onPress={() => router.push(`/pets/${pet.id}`)} style={{ marginHorizontal: 20, marginBottom: 12 }} accessibilityLabel={pet.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar label={pet.name} size={52} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="bodyStrong" style={{ fontSize: 17 }}>
              {pet.name}
            </Text>
            {pet.is_primary ? <Badge label="Acil modda" tone="primary" /> : null}
          </View>
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }} numberOfLines={1}>
            {details}
          </Text>
          {alerts.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {alerts.map((a) => (
                <Badge key={a} label={a} tone="sos" />
              ))}
            </View>
          )}
        </View>
        <Icon name="chevron-forward" size={20} color={t.textSubtle} />
      </View>
    </Card>
  );
}

export default function PetsScreen() {
  const t = useTheme();
  const { pets, loading, load } = usePets();

  // Ekrana her dönüldüğünde (ör. kart ekledikten sonra) listeyi yenile
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Dostlarım</Text>
          <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
            Acil anda veterinere söyleyeceklerin
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
          renderItem={({ item }) => <PetRow pet={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              icon="paw"
              title="Dostunun acil kartını oluştur"
              text="Tür, kilo, alerji ve ilaç bilgisi acil anında Acil Mod'da otomatik karşına çıkar. Bilgiler yalnızca telefonunda saklanır."
              action={<Button title="Kart oluştur" icon="add" full onPress={() => router.push('/pets/create')} />}
            />
          }
        />
      )}
    </Screen>
  );
}
