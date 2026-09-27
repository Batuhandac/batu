import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button, Icon } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { DistrictList } from '@/components/location/DistrictPicker';
import { useLocation } from '@/lib/hooks/useLocation';
import { useOnboardingStore } from '@/stores/onboarding';

export default function LocationScreen() {
  const t = useTheme();
  const { request, loading, setManual } = useLocation();
  const { setCompleted } = useOnboardingStore();

  const finish = () => {
    setCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={{ paddingHorizontal: 24, paddingTop: 40 }}>
      <Icon name="location-outline" size={44} color={t.primary} />
      <Text variant="title" style={{ marginTop: 20 }}>
        Konumunu kullanalım mı?
      </Text>
      <Text variant="body" tone="muted" style={{ marginTop: 8 }}>
        Sana en yakın açık veterinerleri gösterebilmemiz için. Konumun yalnızca telefonunda
        kullanılır, hiçbir yere kaydedilmez.
      </Text>

      <Button
        title="Konumumu kullan"
        icon="navigate"
        size="lg"
        full
        loading={loading}
        onPress={async () => {
          await request();
          finish();
        }}
        style={{ marginTop: 28 }}
      />

      <View style={{ marginTop: 32 }}>
        <Text variant="overline" tone="muted" style={{ marginBottom: 8, marginLeft: 16 }}>
          Ya da ilçeni seç
        </Text>
        <DistrictList
          onPick={(d) => {
            setManual(d.lat, d.lng, d.name);
            finish();
          }}
        />
      </View>

      <Button title="Şimdi değil" variant="ghost" onPress={finish} style={{ marginTop: 20, alignSelf: 'center' }} />
    </Screen>
  );
}
