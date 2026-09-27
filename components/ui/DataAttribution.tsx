import React from 'react';
import { View, Text } from 'react-native';
import type { Clinic } from '@/types';

// Veri kaynağı atfı zorunlu:
// - Google Places verisi Google haritası dışında gösterilince "Google Maps"
//   (çevrilmeden, olduğu gibi)
// - OpenStreetMap verisi için "© OpenStreetMap katkıcıları" (ODbL)
export function usesSource(clinics: Pick<Clinic, 'source' | 'merged_sources'>[], s: Clinic['source']) {
  return clinics.some((c) => c.source === s || c.merged_sources?.includes(s!));
}

export function DataAttribution({ clinics }: { clinics: Pick<Clinic, 'source' | 'merged_sources'>[] }) {
  const google = usesSource(clinics, 'google');
  const osm = usesSource(clinics, 'builtin');
  if (!google && !osm) return null;
  return (
    <View className="items-center py-3 px-4">
      <Text className="text-gray-muted text-xs text-center">
        Klinik bilgileri:{' '}
        {google && <Text style={{ fontWeight: '600' }}>Google Maps</Text>}
        {google && osm ? ' · ' : ''}
        {osm && '© OpenStreetMap katkıcıları'}
      </Text>
    </View>
  );
}
