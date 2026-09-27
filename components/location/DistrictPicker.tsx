import React from 'react';
import { View, ScrollView } from 'react-native';
import { Chip, Button, Sheet, Text } from '@/components/ds';
import { ANKARA_DISTRICTS } from '@/lib/utils/districts';
import type { District } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (d: District) => void;
  onUseGps?: () => void;
}

export function DistrictList({ onPick }: { onPick: (d: District) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {ANKARA_DISTRICTS.map((d) => (
        <Chip key={d.name} label={d.name} onPress={() => onPick(d)} />
      ))}
    </View>
  );
}

export function DistrictPicker({ visible, onClose, onPick, onUseGps }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Neredesin?">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        {onUseGps && (
          <Button
            title="Bulunduğum konumu kullan"
            icon="navigate"
            full
            onPress={() => {
              onUseGps();
              onClose();
            }}
            style={{ marginBottom: 20 }}
          />
        )}
        <Text variant="overline" tone="subtle" style={{ marginBottom: 12 }}>
          Ya da ilçe / semt seç · Ankara
        </Text>
        <DistrictList
          onPick={(d) => {
            onPick(d);
            onClose();
          }}
        />
      </ScrollView>
    </Sheet>
  );
}
