import React from 'react';
import { View, Linking, Platform } from 'react-native';
import { Sheet, Text, Button } from '@/components/ds';
import { track } from '@/lib/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCallFirst?: () => void; // telefon yoksa gösterilmez
  lat: number;
  lng: number;
  clinicId: string;
  // Konum yaklaşıksa (oda listesi) harita uygulaması adresi kendisi bulsun
  address?: string | null;
}

export function DirectionsModal({ visible, onClose, onCallFirst, lat, lng, clinicId, address }: Props) {
  const openMaps = async () => {
    track('directions_confirmed', { clinic_id: clinicId });
    // Gerçek yol tarifi (varış noktası = klinik koordinatı ya da adresi)
    const dest = address ? encodeURIComponent(address) : `${lat},${lng}`;
    const iosUrl = `maps://?daddr=${dest}&dirflg=d`;
    const androidUrl = `google.navigation:q=${dest}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    const nativeUrl = Platform.OS === 'ios' ? iosUrl : androidUrl;
    try {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpen ? nativeUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={onCallFirst ? 'Gitmeden önce aradın mı?' : 'Yol tarifi'}>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <Text variant="body" tone="muted" style={{ marginBottom: 8 }}>
          {onCallFirst
            ? 'Klinik dolu ya da o an kapalı olabilir. Arayıp geldiğini haber vermek, varınca zaman kazandırır.'
            : 'Bu kliniğin telefonu kayıtlı değil, açık olduğundan emin olamıyoruz. Mümkünse telefonu olan bir kliniği tercih et.'}
        </Text>
        {onCallFirst && (
          <Button
            title="Önce arayayım"
            icon="call"
            size="lg"
            full
            onPress={() => {
              onCallFirst();
              onClose();
            }}
          />
        )}
        <Button title={onCallFirst ? 'Aradım, yol tarifini aç' : 'Yol tarifini aç'} icon="navigate-outline" variant="secondary" size="lg" full onPress={openMaps} />
      </View>
    </Sheet>
  );
}
