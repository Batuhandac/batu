import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  value: number;            // 0–5 (kesirli olabilir)
  size?: number;
  onChange?: (v: number) => void; // verilirse dokunulabilir
}

// Dolu/yarı/boş yıldız satırı. onChange verilirse puanlama girdisi olur.
export function Stars({ value, size = 16, onChange }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((i) => {
        const filled = value >= i - 0.25;
        const half = !filled && value >= i - 0.75;
        const glyph = filled ? '★' : half ? '★' : '☆';
        const color = filled ? '#F6AD55' : half ? '#F6AD55' : '#4A5568';
        if (onChange) {
          return (
            <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={6} activeOpacity={0.7}>
              <Text style={{ fontSize: size, color }}>{value >= i ? '★' : '☆'}</Text>
            </TouchableOpacity>
          );
        }
        return (
          <Text key={i} style={{ fontSize: size, color, opacity: half ? 0.6 : 1 }}>
            {glyph}
          </Text>
        );
      })}
    </View>
  );
}
