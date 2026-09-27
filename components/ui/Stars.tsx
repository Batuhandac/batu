import React from 'react';
import { View, Pressable } from 'react-native';
import { Icon } from '@/components/ds';
import { useTheme } from '@/lib/theme';

interface Props {
  value: number; // 0–5 (kesirli olabilir)
  size?: number;
  onChange?: (v: number) => void; // verilirse dokunulabilir puanlama
}

export function Stars({ value, size = 16, onChange }: Props) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: size > 24 ? 8 : 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half' : 'star-outline';
        const icon = <Icon name={name} size={size} color={name === 'star-outline' ? t.borderStrong : t.honey} />;
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${i} yıldız`}>
            {icon}
          </Pressable>
        ) : (
          <View key={i}>{icon}</View>
        );
      })}
    </View>
  );
}
