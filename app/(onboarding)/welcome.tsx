import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

function Feature({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <View className="flex-row items-center gap-4 mb-4">
      <View className="w-12 h-12 rounded-2xl bg-card border border-border items-center justify-center">
        <Text className="text-2xl">{emoji}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{title}</Text>
        <Text className="text-gray-text text-sm mt-0.5">{desc}</Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Gradient hero */}
        <LinearGradient
          colors={['#2a2a2b', '#131315']}
          style={{ paddingTop: 40, paddingBottom: 36, paddingHorizontal: 24, alignItems: 'center' }}
        >
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-5"
            style={{ backgroundColor: 'rgba(255,127,28,0.15)', borderWidth: 1, borderColor: 'rgba(255,127,28,0.35)' }}
          >
            <Text style={{ fontSize: 52 }}>🐾</Text>
          </View>
          <Text className="text-white text-3xl font-extrabold text-center leading-tight">
            Petinin kötü gününe{'\n'}hazır ol
          </Text>
          <Text className="text-gray-text text-base text-center mt-3 leading-relaxed">
            Gece 02:00, petin kötü hissediyor. Saniyeler içinde{'\n'}en yakın açık veterineri bul ve tek tuşla ara.
          </Text>
        </LinearGradient>

        <View className="px-6 pt-8">
          <Feature emoji="🆘" title="Tek tuşla acil" desc="En yakın açık klinik ve büyük bir 'Ara' butonu" />
          <Feature emoji="🟢" title="Açık mı, kapalı mı?" desc="Çalışma saatlerinden anlık hesaplanır; bilmiyorsak söyleriz" />
          <Feature emoji="📋" title="Ne söyleyeceğin hazır" desc="Pet kartındaki bilgiler aramada karşında" />
          <Feature emoji="🩹" title="Yolda ne yapmalı" desc="Veterinere ulaşana kadar temel adımlar" />

          {/* Bilgilendirme */}
          <View className="bg-surface border border-border rounded-2xl p-4 mt-4 mb-5">
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
            className="flex-row items-start gap-3 mb-6"
            activeOpacity={0.7}
          >
            <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${accepted ? 'bg-orange-accent border-orange-accent' : 'border-border bg-surface'}`}>
              {accepted && <Text className="text-white text-sm font-bold">✓</Text>}
            </View>
            <Text className="text-gray-text text-sm flex-1 leading-relaxed">
              Bilgilendirmeyi okudum ve kabul ediyorum. Bu uygulamanın tıbbi tavsiye vermediğini anlıyorum.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => accepted && router.push('/(onboarding)/location')}
            activeOpacity={0.85}
            disabled={!accepted}
            className={`rounded-2xl py-4 items-center ${accepted ? 'bg-orange-accent' : 'bg-surface border border-border opacity-50'}`}
            style={accepted ? { shadowColor: '#ff7f1c', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 } : undefined}
          >
            <Text className="text-white font-bold text-lg">Başla</Text>
          </TouchableOpacity>

          <Text className="text-gray-muted text-xs text-center mt-4">
            Ücretsiz · Hesap gerekmez · Reklamsız
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
