import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Button, Text } from '@/components/ds';
import { FirstAidList } from '@/components/clinic/FirstAidList';
import { markFirstAidSeen } from '@/lib/data/gameStore';

export default function FirstAidScreen() {
  // "Hazırlıklı" rozeti ve ilk adımlar için
  useEffect(() => {
    markFirstAidSeen();
  }, []);
  return (
    <Screen scroll>
      <Header
        title="Veterinere ulaşana kadar"
        subtitle="Tedavi değildir; zarar vermemek ve zaman kazanmak içindir. Veterinerin söyledikleri her zaman önce gelir."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <Button title="Acil veteriner bul" variant="sos" icon="medkit" size="lg" full onPress={() => router.push('/emergency')} style={{ marginBottom: 20 }} />
        <FirstAidList />
        <Text variant="caption" tone="subtle" center style={{ marginTop: 12 }}>
          Kaynak: genel kabul görmüş evcil hayvan ilk yardım önerileri. Her durumda önce veterinerini ara.
        </Text>
      </View>
    </Screen>
  );
}
