import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  timestamp: string | null;
}

export function OfflineBanner({ timestamp }: Props) {
  const fmt = timestamp ? new Date(timestamp).toLocaleString('tr-TR') : 'bilinmiyor';
  return (
    <View className="bg-yellow-900 border-b border-yellow-700 px-4 py-2">
      <Text className="text-yellow-200 text-xs text-center">
        Çevrimdışısın — son güncelleme: {fmt}
      </Text>
    </View>
  );
}
