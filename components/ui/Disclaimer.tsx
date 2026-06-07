import React from 'react';
import { View, Text } from 'react-native';

export function Disclaimer() {
  return (
    <View className="border border-border rounded-xl p-4 mt-4 bg-surface">
      <Text className="text-gray-text text-xs leading-relaxed">
        Bu uygulama veteriner teşhisi, tedavisi veya ilaç önerisi sunmaz. Bilgiler değişebilir.
        Acil durumlarda doğrudan lisanslı veteriner hekime başvurun ve gitmeden önce kliniği arayın.
      </Text>
    </View>
  );
}
