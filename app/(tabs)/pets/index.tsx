import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { usePets } from '@/lib/hooks/usePets';
import type { Pet } from '@/types';

function PetRow({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const emoji = pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾';
  return (
    <TouchableOpacity onPress={onPress} className="bg-card border border-border rounded-2xl px-5 py-4 mb-3 mx-4 flex-row items-center gap-4" activeOpacity={0.85}>
      <Text className="text-3xl">{emoji}</Text>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-white font-bold text-base">{pet.name}</Text>
          {pet.is_primary && (
            <View className="bg-red-sos/20 border border-red-sos/40 rounded-full px-2 py-0.5">
              <Text className="text-red-400 text-xs">Ana</Text>
            </View>
          )}
        </View>
        {(pet.species || pet.breed) && (
          <Text className="text-gray-text text-sm mt-0.5">
            {[pet.species, pet.breed].filter(Boolean).join(' · ')}
          </Text>
        )}
        {pet.emergency_note && (
          <Text className="text-yellow-400 text-xs mt-1" numberOfLines={1}>⚠️ {pet.emergency_note}</Text>
        )}
      </View>
      <Text className="text-gray-muted text-xl">›</Text>
    </TouchableOpacity>
  );
}

export default function PetsScreen() {
  const { pets, loading, load } = usePets();

  // Ekrana her dönüldüğünde (örn. pet ekledikten sonra) listeyi yenile
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-4 pt-6 pb-4">
        <Text className="text-white text-2xl font-bold">Petlerim</Text>
        <TouchableOpacity
          onPress={() => router.push('/pets/create')}
          className="bg-red-sos rounded-xl px-4 py-2"
        >
          <Text className="text-white font-bold text-sm">+ Ekle</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E53E3E" />
        </View>
      )}

      {!loading && pets.length === 0 && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">🐾</Text>
          <Text className="text-white font-bold text-lg text-center mb-2">Henüz pet yok</Text>
          <Text className="text-gray-text text-sm text-center mb-6">
            Petinin acil kartını oluştur. 30 saniye yeterli.
          </Text>
          <TouchableOpacity onPress={() => router.push('/pets/create')} className="bg-red-sos rounded-2xl py-4 px-8">
            <Text className="text-white font-bold">Acil Kart Oluştur</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && pets.length > 0 && (
        <FlatList
          data={pets}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <PetRow pet={item} onPress={() => router.push(`/pets/${item.id}`)} />}
          contentContainerStyle={{ paddingVertical: 4 }}
        />
      )}
    </Screen>
  );
}
