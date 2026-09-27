import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { useLocation } from '@/lib/hooks/useLocation';
import { useOnboardingStore } from '@/stores/onboarding';
import { DistrictList } from '@/components/location/DistrictPicker';

export default function LocationScreen() {
  const { request, loading, setManual } = useLocation();
  const { setCompleted } = useOnboardingStore();

  const handleGrant = async () => {
    await request();
    setCompleted(true);
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    setCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <Screen scroll>
      <View className="px-6 pt-12 pb-8 gap-8">
        <View className="items-center">
          <Text className="text-5xl mb-6">📍</Text>
          <Text className="text-white text-2xl font-bold text-center mb-3">
            Konum İzni
          </Text>
          <Text className="text-gray-text text-base text-center leading-relaxed">
            Acil anında sana en yakın açık veterineri gösterebilmek için konumuna ihtiyacımız var.
            Konumun sadece telefonunda kullanılır, hiçbir yere gönderilmez.
          </Text>
        </View>

        <View className="gap-4">
          <TouchableOpacity
            onPress={handleGrant}
            disabled={loading}
            activeOpacity={0.85}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: '#ff7f1c' }}
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Bekleniyor...' : 'Konuma izin ver ve başla'}
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-muted text-sm text-center mb-1">veya ilçe seç:</Text>

          <DistrictList onPick={(d) => { setManual(d.lat, d.lng, d.name); handleSkip(); }} />
        </View>
      </View>
    </Screen>
  );
}
