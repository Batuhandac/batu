import React from 'react';
import { View } from 'react-native';
import { Text, Icon } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';

export function Disclaimer() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: t.surfaceAlt, marginTop: 12 }}>
      <Icon name="information-circle-outline" size={18} color={t.textMuted} />
      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
        Pati SOS teşhis ya da tedavi önermez. Klinik bilgileri değişebilir; acil durumda gitmeden önce
        kliniği ara ve lisanslı bir veteriner hekime başvur.
      </Text>
    </View>
  );
}
