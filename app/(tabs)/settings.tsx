import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen } from '@/components/ui/Screen';
import { Disclaimer } from '@/components/ui/Disclaimer';

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
  const handleDeleteData = () => {
    Alert.alert(
      'Verilerin',
      'Pet kartların, favorilerin ve konumun yalnızca bu telefonda saklanır; uygulamayı silmek hepsini siler. ' +
        'Gönderdiğin yorum, fotoğraf veya bildirimlerin silinmesi için support@patisos.app adresine yaz — ' +
        'KVKK kapsamında 30 gün içinde işleme alınır.',
      [{ text: 'Tamam' }]
    );
  };

  const showSources = () => {
    Alert.alert(
      'Veri kaynakları',
      'Klinik bilgileri: © OpenStreetMap katkıcıları (ODbL lisansı), Google Maps ve kliniklerin kendi ' +
        'onayladığı bilgiler. Kullanıcıların eklediği klinikler kontrol edildikten sonra yayımlanır.',
      [{ text: 'Tamam' }]
    );
  };

  return (
    <Screen scroll>
      <View className="px-6 pt-6">
        <Text className="text-white text-2xl font-bold mb-6">Ayarlar</Text>

        <View className="bg-card border border-border rounded-2xl px-5 mb-6">
          <Row label="🐾 Pet kartlarım" onPress={() => router.push('/(tabs)/pets')} />
          <Row label="🏥 Bildiğin bir kliniği ekle" onPress={() => router.push('/clinic/add')} />
          <Row label="🩺 Veteriner hekimler için" onPress={() => router.push('/vets')} />
        </View>

        <View className="bg-card border border-border rounded-2xl px-5 mb-6">
          <Row label="Konum izni" onPress={() => Linking.openSettings()} />
          <Row label="Bildirim izni" onPress={() => Linking.openSettings()} />
        </View>

        <View className="bg-card border border-border rounded-2xl px-5 mb-6">
          <Row label="Kullanım Koşulları" onPress={() => Linking.openURL('https://patisos.app/kullanim-kosullari')} />
          <Row label="Gizlilik Politikası" onPress={() => Linking.openURL('https://patisos.app/gizlilik-politikasi')} />
          <Row label="Veri kaynakları" onPress={showSources} />
          <Row
            label="Sorumluluk reddi"
            onPress={() =>
              Alert.alert(
                'Sorumluluk reddi',
                'Pati SOS teşhis ya da tedavi önermez ve klinik bilgilerinin doğruluğunu garanti etmez. ' +
                  'Acil durumlarda gitmeden önce kliniği arayın.',
                [{ text: 'Anladım' }]
              )
            }
          />
          <Row label="Verilerim ve silme talebi" onPress={handleDeleteData} />
        </View>

        <Disclaimer />

        <Text className="text-gray-muted text-xs text-center mt-6">
          Pati SOS v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </Screen>
  );
}
