import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePets } from '@/lib/hooks/usePets';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { track } from '@/lib/analytics';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function HomeScreen() {
  const { pets, load: loadPets } = usePets();
  const { favorites, load: loadFavs } = useFavorites();

  useFocusEffect(useCallback(() => { loadPets(); loadFavs(); }, [loadPets, loadFavs]));

  const primaryPet = pets.find((p) => p.is_primary) ?? pets[0];
  const primaryVetFav = favorites.find((f) => f.is_primary_vet);

  const handleEmergency = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await track('emergency_cta_tap');
    router.push('/(tabs)/nearby');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Üst başlık */}
        <View className="px-6 pt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-muted text-sm">{greeting()} 👋</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">Pati SOS</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
            <Text className="text-base">📍</Text>
            <Text className="text-gray-label text-sm font-medium">Ankara</Text>
          </View>
        </View>

        {/* ACİL hero */}
        <TouchableOpacity onPress={handleEmergency} activeOpacity={0.9} className="mx-5 mt-6">
          <LinearGradient
            colors={['#FF5A52', '#E53E3E', '#C53030']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 28,
              shadowColor: '#E53E3E',
              shadowOpacity: 0.45,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 10 },
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="bg-white/20 self-start rounded-full px-3 py-1 mb-3">
                  <Text className="text-white text-xs font-bold tracking-wide">ACİL DURUM</Text>
                </View>
                <Text className="text-white text-3xl font-extrabold">Açık Klinik Bul</Text>
                <Text className="text-white/90 text-sm mt-1.5 leading-relaxed">
                  Sana en yakın açık veterineri{'\n'}saniyeler içinde bul ve ara
                </Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center ml-2">
                <Text className="text-4xl">🆘</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-5 bg-white/15 rounded-2xl px-4 py-3">
              <Text className="text-white font-bold text-base flex-1">Hemen başla</Text>
              <Text className="text-white text-xl">→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Hızlı erişim */}
        <View className="flex-row gap-3 px-5 mt-4">
          <QuickTile emoji="🗺️" label="Harita" onPress={() => router.push('/(tabs)/map')} />
          <QuickTile emoji="🏥" label="Klinik Ekle" onPress={() => router.push('/clinic/add')} />
          <QuickTile emoji="🐾" label="Petlerim" onPress={() => router.push('/(tabs)/pets')} />
        </View>

        {/* Pet acil kartı */}
        <View className="px-5 mt-6">
          <Text className="text-white font-bold text-lg mb-3">Acil Kart</Text>
          {primaryPet ? (
            <TouchableOpacity
              onPress={() => router.push(`/pets/${primaryPet.id}`)}
              activeOpacity={0.85}
              className="bg-card border border-border rounded-3xl p-5 flex-row items-center gap-4"
            >
              <View className="w-14 h-14 rounded-2xl bg-surface items-center justify-center">
                <Text className="text-3xl">
                  {primaryPet.species === 'cat' ? '🐱' : primaryPet.species === 'dog' ? '🐶' : '🐾'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{primaryPet.name}</Text>
                <Text className="text-gray-text text-sm mt-0.5">Acil sağlık kartını gör / paylaş</Text>
              </View>
              <Text className="text-gray-muted text-2xl">›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/pets/create')}
              activeOpacity={0.85}
              className="bg-card border border-dashed border-border rounded-3xl p-5 flex-row items-center gap-4"
            >
              <View className="w-14 h-14 rounded-2xl bg-surface items-center justify-center">
                <Text className="text-3xl">➕</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">Acil kart oluştur</Text>
                <Text className="text-gray-text text-sm mt-0.5">
                  Alerji, ilaç, kronik hastalık — 30 saniyede hazır
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {primaryVetFav && (
            <View className="bg-surface border border-border rounded-2xl px-5 py-3.5 flex-row items-center gap-3 mt-3">
              <Text className="text-xl">⭐</Text>
              <Text className="text-gray-label text-sm font-medium flex-1">Düzenli veterinerin kayıtlı</Text>
            </View>
          )}
        </View>

        {/* İpucu kartı */}
        <View className="px-5 mt-6">
          <View className="bg-card/50 border border-border rounded-2xl px-5 py-4 flex-row gap-3">
            <Text className="text-xl">💡</Text>
            <Text className="text-gray-text text-sm flex-1 leading-relaxed">
              Gitmeden önce mutlaka <Text className="text-gray-label font-semibold">ara</Text>. Klinik
              durumu değişebilir; boşuna yola çıkma.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickTile({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-1 bg-card border border-border rounded-2xl py-4 items-center gap-1.5"
    >
      <Text className="text-2xl">{emoji}</Text>
      <Text className="text-gray-label text-xs font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}
