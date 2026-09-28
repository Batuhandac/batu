import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ds';
import type { Clinic } from '@/types';

// Veri kaynağı atfı zorunlu:
// - Google Places verisi Google haritası dışında gösterilince "Google Maps"
//   (çevrilmeden, olduğu gibi)
// - OpenStreetMap verisi için "© OpenStreetMap katkıcıları" (ODbL)
// - Apple Haritalar araması için "Apple Haritalar"
export function usesSource(clinics: Pick<Clinic, 'source' | 'merged_sources'>[], s: Clinic['source']) {
  return clinics.some((c) => c.source === s || c.merged_sources?.includes(s!));
}

export function DataAttribution({ clinics }: { clinics: Pick<Clinic, 'source' | 'merged_sources'>[] }) {
  const google = usesSource(clinics, 'google');
  const osm = usesSource(clinics, 'builtin');
  const apple = usesSource(clinics, 'apple');
  if (!google && !osm && !apple) return null;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
      <Text variant="caption" tone="subtle" center style={{ fontSize: 12 }}>
        Klinik bilgileri: {[google ? 'Google Maps' : null, apple ? 'Apple Haritalar' : null, osm ? '© OpenStreetMap katkıcıları' : null].filter(Boolean).join(' · ')}
      </Text>
    </View>
  );
}
