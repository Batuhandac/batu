import React from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { track } from '@/lib/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCallFirst?: () => void; // telefon yoksa gösterilmez
  lat: number;
  lng: number;
  clinicId: string;
}

export function DirectionsModal({ visible, onClose, onCallFirst, lat, lng, clinicId }: Props) {
  const openMaps = async () => {
    track('directions_confirmed', { clinic_id: clinicId });
    // Gerçek YOL TARİFİ aç (varış noktası = klinik koordinatı).
    // Önceki sürüm koordinatı "arama metni" olarak gönderiyordu (q=),
    // bu yüzden yanlış yere atıyordu. daddr/destination doğru olanı.
    const iosUrl = `maps://?daddr=${lat},${lng}&dirflg=d`;
    const androidUrl = `google.navigation:q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const nativeUrl = Platform.OS === 'ios' ? iosUrl : androidUrl;
    try {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      if (canOpen) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl p-6 pb-10">
          <Text className="text-white text-xl font-bold text-center mb-2">
            {onCallFirst ? 'Gitmeden önce aradın mı?' : 'Yol tarifi'}
          </Text>
          <Text className="text-gray-text text-sm text-center mb-6 leading-relaxed">
            {onCallFirst
              ? 'Klinik dolu ya da kapalı olabilir. Arayıp geldiğini haber vermek, varınca zaman kazandırır.'
              : 'Bu kliniğin telefonu kayıtlı değil. Açık olduğundan emin olamıyoruz; mümkünse telefonu olan bir kliniği tercih et.'}
          </Text>
          {onCallFirst && (
            <TouchableOpacity
              onPress={() => { onCallFirst(); onClose(); }}
              className="bg-green-open rounded-2xl py-4 items-center mb-3"
            >
              <Text className="text-white font-bold text-base">📞 Önce arayayım</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={openMaps}
            className="bg-card border border-border rounded-2xl py-4 items-center"
          >
            <Text className="text-gray-label font-semibold text-base">
              {onCallFirst ? 'Aradım, yol tarifini aç' : 'Yol tarifini aç'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="py-3 items-center mt-1">
            <Text className="text-gray-muted text-sm">Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
