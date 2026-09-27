import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePets } from '@/lib/hooks/usePets';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useLocation } from '@/lib/hooks/useLocation';
import { speciesEmoji, speciesLabel } from '@/lib/utils/pets';

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
  const { source, label } = useLocation();

  useFocusEffect(useCallback(() => { loadPets(); loadFavs(); }, [loadPets, loadFavs]));

  const primaryPet = pets.find((p) => p.is_primary) ?? pets[0];
  const primaryVetFav = favorites.find((f) => f.is_primary_vet);

  const handleEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push('/emergency');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Üst başlık */}
        <View className="px-6 pt-5 flex-row items-start justify-between">
          <View>
            <Text className="text-gray-text text-base">{greeting()} 👋</Text>
            <Text className="text-white text-2xl font-bold mt-0.5" style={{ fontFamily: 'System', letterSpacing: -0.5 }}>
              Pati SOS
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/nearby')}
            className="flex-row items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 mt-1"
            style={{ maxWidth: 170 }}
          >
            <Text className="text-sm">📍</Text>
            <Text className="text-gray-label text-sm font-semibold" numberOfLines={1}>
              {source === 'manual' ? label ?? 'Seçilen bölge' : source === 'gps' ? 'Konumun' : 'Konum seç'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACİL hero */}
        <TouchableOpacity
          onPress={handleEmergency}
          activeOpacity={0.9}
          className="mx-5 mt-5"
          accessibilityRole="button"
          accessibilityLabel="Acil veteriner bul"
        >
          <LinearGradient
            colors={['rgba(255,127,28,0.95)', 'rgba(220,80,0,0.85)', 'rgba(19,19,21,0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 24,
              shadowColor: '#ff7f1c',
              shadowOpacity: 0.35,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View className="items-center" style={{ gap: 12 }}>
              {/* Icon */}
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Text className="text-3xl">🚨</Text>
              </View>
              {/* Text */}
              <View className="items-center">
                <Text className="text-white text-2xl font-bold text-center" style={{ letterSpacing: -0.3 }}>
                  ACİL VETERİNER BUL
                </Text>
                <Text className="text-white/80 text-sm text-center mt-1">
                  En yakın açık klinik · tek dokunuşla arama · ilk yardım
                </Text>
              </View>
              {/* CTA */}
              <View
                className="flex-row items-center gap-2 rounded-full px-6 py-3 mt-1"
                style={{ backgroundColor: 'rgba(255,127,28,0.9)' }}
              >
                <View className="w-2 h-2 rounded-full bg-white" />
                <Text className="text-white font-bold text-sm">Hemen Bul</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Hızlı erişim */}
        <View className="flex-row gap-3 px-5 mt-4">
          <QuickTile emoji="🗺️" label="Harita" onPress={() => router.push('/(tabs)/map')} />
          <QuickTile emoji="🏥" label="Klinik Ekle" onPress={() => router.push('/clinic/add')} />
          <QuickTile emoji="🐾" label="Petlerim" onPress={() => router.push('/(tabs)/pets')} />
        </View>

        {/* Pet profili */}
        <View className="px-5 mt-6">
          <Text className="text-white font-bold text-lg mb-3" style={{ letterSpacing: -0.3 }}>
            Kayıtlı Dostların
          </Text>
          {primaryPet ? (
            <TouchableOpacity
              onPress={() => router.push(`/pets/${primaryPet.id}`)}
              activeOpacity={0.85}
              className="bg-card border border-border rounded-3xl p-4 flex-row items-center gap-4"
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(68,71,76,0.8)' }}
              >
                <Text className="text-3xl">{speciesEmoji(primaryPet.species)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{primaryPet.name}</Text>
                <Text className="text-gray-text text-sm mt-0.5">
                  {primaryPet.breed ?? speciesLabel(primaryPet.species)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/pets/${primaryPet.id}`)}
                className="rounded-full px-4 py-2 border"
                style={{ backgroundColor: 'rgba(68,71,76,0.6)', borderColor: 'rgba(234,195,51,0.25)' }}
              >
                <Text style={{ color: '#eac333', fontSize: 12, fontWeight: '700' }}>Profili Gör</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/pets/create')}
              activeOpacity={0.85}
              className="bg-card border border-border rounded-3xl p-4 flex-row items-center gap-4"
              style={{ borderStyle: 'dashed' }}
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(68,71,76,0.5)' }}
              >
                <Text className="text-3xl">➕</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">Acil kart oluştur</Text>
                <Text className="text-gray-text text-sm mt-0.5">Acilde veterinere ne söyleyeceğin hazır olsun</Text>
              </View>
            </TouchableOpacity>
          )}

          {primaryVetFav && (
            <TouchableOpacity
              onPress={() => router.push(`/clinic/${primaryVetFav.clinic_id}`)}
              className="bg-surface border border-border rounded-2xl px-4 py-3 flex-row items-center gap-3 mt-3"
              activeOpacity={0.85}
            >
              <Text className="text-xl">⭐</Text>
              <Text className="text-gray-label text-sm font-medium flex-1">Düzenli veterinerin</Text>
              <Text className="text-gray-muted">›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Yakın klinikler harita önizlemesi */}
        <View className="px-5 mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-bold text-lg" style={{ letterSpacing: -0.3 }}>
              Yakınındaki Klinikler
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/nearby')}>
              <Text style={{ color: '#eac333', fontSize: 13, fontWeight: '700' }}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/map')}
            activeOpacity={0.9}
            className="bg-card border border-border rounded-3xl overflow-hidden"
            style={{ height: 140 }}
          >
            {/* Harita placeholder */}
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#1a1f2e' }}>
              <Text className="text-4xl mb-1">🗺️</Text>
              <Text className="text-gray-text text-sm">Haritada Görüntüle</Text>
            </View>
            {/* Open count overlay */}
            <View
              className="absolute bottom-3 left-3 flex-row items-center gap-2 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(31,31,33,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff7f1c' }} />
              <Text className="text-white text-xs font-semibold">Açık Klinikler</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* İpucu */}
        <View className="px-5 mt-4">
          <View
            className="flex-row gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(42,42,43,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <Text className="text-lg">💡</Text>
            <Text className="text-gray-text text-sm flex-1 leading-relaxed">
              Gitmeden önce mutlaka <Text className="text-gray-label font-semibold">ara</Text>. Klinik
              durumu değişebilir; boşuna yola çıkma.
            </Text>
          </View>
        </View>

        {/* Veteriner hekimlere */}
        <TouchableOpacity onPress={() => router.push('/vets')} className="mx-5 mt-4 py-3 items-center" activeOpacity={0.7}>
          <Text className="text-gray-muted text-sm">
            🩺 Veteriner hekim misiniz? <Text style={{ color: '#bac8dc', fontWeight: '600' }}>Kliniğinizi ücretsiz doğrulayın</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickTile({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-1 bg-card border border-border rounded-2xl py-4 items-center"
      style={{ gap: 6 }}
    >
      <Text className="text-2xl">{emoji}</Text>
      <Text className="text-gray-label text-xs font-bold">{label}</Text>
    </TouchableOpacity>
  );
}
