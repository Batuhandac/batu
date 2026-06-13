import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/ui/Screen';
import { usePets } from '@/lib/hooks/usePets';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { track } from '@/lib/analytics';

export default function HomeScreen() {
  const { pets, load: loadPets } = usePets();
  const { favorites, load: loadFavs } = useFavorites();

  useEffect(() => { loadPets(); loadFavs(); }, []);

  const primaryPet = pets.find(p => p.is_primary) ?? pets[0];
  const primaryVetFav = favorites.find(f => f.is_primary_vet);

  const handleEmergency = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await track('emergency_cta_tap');
    router.push('/(tabs)/nearby');
  };

  return (
    <Screen>
      <View className="flex-1 px-6 justify-between pt-16 pb-8">
        <View className="items-center">
          <Text className="text-white text-3xl font-bold text-center mb-2">Pati SOS</Text>
          <Text className="text-gray-muted text-sm text-center">Ankara</Text>
        </View>

        <View className="gap-6">
          <TouchableOpacity
            onPress={handleEmergency}
            activeOpacity={0.85}
            className="bg-red-sos rounded-3xl py-7 items-center shadow-lg"
            style={{ shadowColor: '#E53E3E', shadowOpacity: 0.4, shadowRadius: 20 }}
          >
            <Text className="text-white text-4xl mb-2">🆘</Text>
            <Text className="text-white font-bold text-2xl">ACİL</Text>
            <Text className="text-red-200 text-base mt-1">Açık Klinik Bul</Text>
          </TouchableOpacity>

          {primaryPet && (
            <TouchableOpacity
              onPress={() => router.push(`/pets/${primaryPet.id}`)}
              className="bg-card border border-border rounded-2xl px-5 py-4 flex-row items-center gap-4"
              activeOpacity={0.85}
            >
              <Text className="text-3xl">🐾</Text>
              <View className="flex-1">
                <Text className="text-gray-muted text-xs mb-0.5">Petim</Text>
                <Text className="text-white font-semibold text-base">{primaryPet.name}</Text>
                <Text className="text-gray-text text-xs mt-0.5">Acil kartını gör / paylaş</Text>
              </View>
              <Text className="text-gray-muted text-xl">›</Text>
            </TouchableOpacity>
          )}

          {!primaryPet && (
            <TouchableOpacity
              onPress={() => router.push('/pets/create')}
              className="bg-card border border-dashed border-border rounded-2xl px-5 py-4 flex-row items-center gap-4"
              activeOpacity={0.85}
            >
              <Text className="text-3xl">➕</Text>
              <View>
                <Text className="text-gray-text text-sm">Acil kart oluştur</Text>
                <Text className="text-gray-muted text-xs mt-0.5">30 saniyede hazır</Text>
              </View>
            </TouchableOpacity>
          )}

          {primaryVetFav && (
            <View className="bg-surface border border-border rounded-2xl px-5 py-4 flex-row items-center gap-3">
              <Text className="text-xl">🏥</Text>
              <View>
                <Text className="text-gray-muted text-xs">Düzenli veterinerim</Text>
                <Text className="text-white text-sm font-medium">Kaydedildi</Text>
              </View>
            </View>
          )}
        </View>

        <Text className="text-gray-muted text-xs text-center">
          Gitmeden önce ara. Bilgiler değişebilir.
        </Text>
      </View>
    </Screen>
  );
}
