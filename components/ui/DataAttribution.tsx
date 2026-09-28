import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ds';
import { CHAMBER_LABELS } from '@/lib/data/chamberClinics';
import type { Clinic } from '@/types';

// Veri kaynağı atfı zorunlu:
// - Google Places verisi Google haritası dışında gösterilince "Google Maps"
//   (çevrilmeden, olduğu gibi)
// - OpenStreetMap verisi için "© OpenStreetMap katkıcıları" (ODbL); oda
//   listelerindeki adresler de OpenStreetMap (Nominatim) ile konumlandı
// - Apple Haritalar araması için "Apple Haritalar"
// - Veteriner hekimleri odası listeleri için odanın adı
export function usesSource(clinics: Pick<Clinic, 'source' | 'merged_sources'>[], s: Clinic['source']) {
  return clinics.some((c) => c.source === s || c.merged_sources?.includes(s!));
}

type Sourced = Pick<Clinic, 'source' | 'merged_sources'>;

/** "Google Maps · Apple Haritalar · © OpenStreetMap katkıcıları" (kaynak yoksa null) */
export function attributionText(clinics: Sourced[]): string | null {
  const google = usesSource(clinics, 'google');
  const apple = usesSource(clinics, 'apple');
  const chamber = usesSource(clinics, 'chamber');
  const osm = usesSource(clinics, 'builtin') || chamber;
  const parts = [
    google ? 'Google Maps' : null,
    apple ? 'Apple Haritalar' : null,
    ...(chamber ? Object.values(CHAMBER_LABELS) : []),
    osm ? '© OpenStreetMap katkıcıları' : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

export function DataAttribution({ clinics }: { clinics: Sourced[] }) {
  const text = attributionText(clinics);
  if (!text) return null;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
      <Text variant="caption" tone="subtle" center style={{ fontSize: 12 }}>
        Klinik bilgileri: {text}
      </Text>
    </View>
  );
}
