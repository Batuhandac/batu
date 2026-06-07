import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';

export default function WelcomeScreen() {
  const [accepted, setAccepted] = useState(false);

  return (
    <Screen scroll>
      <View className="flex-1 px-6 pt-12 pb-8">
        <View className="items-center mb-10">
          <Text className="text-6xl mb-4">🐾</Text>
          <Text className="text-white text-3xl font-bold text-center leading-snug">
            Petinin kötü{'\n'}gününe hazır ol.
          </Text>
          <Text className="text-gray-text text-base text-center mt-4 leading-relaxed">
            Ankara'da gece 02:00, petin kötü hissediyor.{'\n'}
            Saniyeler içinde yakındaki açık, acil kabul eden{'\n'}
            veterineri bul ve tek tuşla ara.
          </Text>
        </View>

        <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <Text className="text-gray-label text-xs font-bold uppercase tracking-wide mb-2">
            Önemli Bilgilendirme
          </Text>
          <Text className="text-gray-text text-xs leading-relaxed">
            Bu uygulama veteriner teşhisi, tedavisi veya ilaç önerisi sunmaz. Bilgiler değişebilir.
            Acil durumlarda doğrudan lisanslı veteriner hekime başvurun ve gitmeden önce kliniği arayın.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setAccepted(!accepted)}
          className="flex-row items-start gap-3 mb-8"
          activeOpacity={0.7}
        >
          <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${accepted ? 'bg-green-open border-green-open' : 'border-border bg-surface'}`}>
            {accepted && <Text className="text-white text-sm font-bold">✓</Text>}
          </View>
          <Text className="text-gray-text text-sm flex-1 leading-relaxed">
            Yukarıdaki bilgilendirmeyi okudum ve kabul ediyorum. Bu uygulamanın tıbbi tavsiye vermediğini anlıyorum.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => accepted && router.push('/(onboarding)/location')}
          activeOpacity={0.85}
          className={`rounded-2xl py-4 items-center ${accepted ? 'bg-red-sos' : 'bg-surface border border-border opacity-50'}`}
        >
          <Text className="text-white font-bold text-lg">Devam Et</Text>
        </TouchableOpacity>

        <Text className="text-gray-muted text-xs text-center mt-4">
          Ücretsiz · Hesap gerekmez · Ankara
        </Text>
      </View>
    </Screen>
  );
}
