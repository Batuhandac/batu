import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
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
    <View className="flex-row flex-wrap gap-2">
      {ANKARA_DISTRICTS.map((d) => (
        <TouchableOpacity
          key={d.name}
          onPress={() => onPick(d)}
          className="bg-card border border-border rounded-full px-4 py-2.5"
          activeOpacity={0.8}
        >
          <Text className="text-white text-sm">{d.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function DistrictPicker({ visible, onClose, onPick, onUseGps }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl pt-5 pb-10" style={{ maxHeight: '80%' }}>
          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text className="text-white text-lg font-bold">Neredesin?</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text className="text-gray-text text-base">Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            {onUseGps && (
              <TouchableOpacity
                onPress={() => { onUseGps(); onClose(); }}
                className="rounded-2xl py-4 items-center mb-4"
                style={{ backgroundColor: '#ff7f1c' }}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold text-base">📍 Bulunduğum konumu kullan</Text>
              </TouchableOpacity>
            )}
            <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-3">
              Ya da ilçe / semt seç (Ankara)
            </Text>
            <DistrictList onPick={(d) => { onPick(d); onClose(); }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
