import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { useLocation } from '@/lib/hooks/useLocation';
import { useOnboardingStore } from '@/stores/onboarding';
import { ANKARA_DISTRICTS } from '@/lib/utils/districts';

export default function LocationScreen() {
  const { request, loading } = useLocation();
  const { setCompleted } = useOnboardingStore();

  const handleGrant = async () => {
    const granted = await request();
    setCompleted(true);
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    setCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View className="flex-1 px-6 pt-12 pb-8 justify-between">
        <View className="items-center">
          <Text className="text-5xl mb-6">📍</Text>
          <Text className="text-white text-2xl font-bold text-center mb-3">
            Konum İzni
          </Text>
          <Text className="text-gray-text text-base text-center leading-relaxed">
            Yakınındaki veteriner kliniklerini gösterebilmek için konumuna ihtiyacımız var.
            Konum bilgin sadece cihazında işlenir.
          </Text>
        </View>

        <View className="gap-4">
          <TouchableOpacity
            onPress={handleGrant}
            disabled={loading}
            activeOpacity={0.85}
            className="bg-red-sos rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Bekleniyor...' : 'Konuma izin ver ve başla'}
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-muted text-sm text-center mb-1">veya ilçe seç:</Text>

          <View className="flex-row flex-wrap gap-2 justify-center">
            {ANKARA_DISTRICTS.map(d => (
              <TouchableOpacity
                key={d.name}
                onPress={handleSkip}
                className="bg-surface border border-border rounded-full px-4 py-2"
              >
                <Text className="text-gray-label text-sm">{d.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
