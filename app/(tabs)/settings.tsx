import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

function Row({ label, onPress, danger }: { label: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-border"
      activeOpacity={0.7}
    >
      <Text className={`text-base ${danger ? 'text-red-400' : 'text-white'}`}>{label}</Text>
      <Text className="text-gray-muted">›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const handleSignOut = async () => {
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Veri Silme Talebi',
      'Tüm verilerinin silinmesi için support@patisos.app adresine e-posta gönder. KVKK kapsamında 30 gün içinde işleme alınır.',
      [{ text: 'Tamam' }]
    );
  };

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text className="text-white text-2xl font-bold mb-6">Ayarlar</Text>

        <View className="bg-card border border-border rounded-2xl px-5 mb-6">
          <Row label="Petlerimi Yönet" onPress={() => router.push('/(tabs)/pets')} />
          <Row label="Konum İzinleri" onPress={() => Linking.openSettings()} />
          <Row label="Bildirim İzinleri" onPress={() => Linking.openSettings()} />
        </View>

        <View className="bg-card border border-border rounded-2xl px-5 mb-6">
          <Row label="Kullanım Koşulları" onPress={() => {}} />
          <Row label="Gizlilik Politikası" onPress={() => {}} />
          <Row label="Sorumluluk Reddi" onPress={() => {}} />
        </View>

        <View className="bg-card border border-border rounded-2xl px-5 mb-6">
          <Row label="Veri Silme Talebi" onPress={handleDeleteData} danger />
          <Row label="Hesaptan Çıkış" onPress={handleSignOut} danger />
        </View>

        <Disclaimer />

        <Text className="text-gray-muted text-xs text-center mt-6">
          Pati SOS v{Constants.expoConfig?.version ?? '1.0.0'} · Ankara
        </Text>
      </View>
    </Screen>
  );
}
