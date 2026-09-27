import React from 'react';
import { View, Text } from 'react-native';

// Google Places verisi Google haritası dışında gösterildiğinde atıf zorunlu.
// "Google Maps" ifadesi çevrilmeden, olduğu gibi yazılmalı.
export function GoogleAttribution() {
  return (
    <View className="items-center py-3">
      <Text className="text-gray-muted text-xs">
        Klinik bilgileri: <Text style={{ fontWeight: '600' }}>Google Maps</Text>
      </Text>
    </View>
  );
}
