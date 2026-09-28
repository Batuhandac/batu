import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Chip, IconButton, Icon } from '@/components/ds';
import { useTheme, radius, shadow, type Theme } from '@/lib/theme';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { DistrictPicker } from '@/components/location/DistrictPicker';
import { attributionText } from '@/components/ui/DataAttribution';
import { clinicStatus, formatDistance } from '@/lib/utils/status';
import type { Clinic, NearbyFilters } from '@/types';

const DEFAULT_REGION: Region = {
  latitude: 39.9334,
  longitude: 32.8597,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const DEFAULT_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false };

function markerColor(t: Theme, clinic: Clinic): string {
  const s = clinicStatus(clinic);
  return s.tone === 'open' ? t.open : s.tone === 'closed' ? t.closed : t.unknown;
}

export default function MapScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { clinics, loading, fetch } = useClinics();
  const { lat, lng, source, isStale, granted, request, refresh, setManual } = useLocation();
  const [filters, setFilters] = useState<NearbyFilters>(DEFAULT_FILTERS);
  const [picker, setPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (source !== 'manual' && isStale) refresh();
    }, [source, isStale, refresh])
  );

  useEffect(() => {
    fetch(lat ?? DEFAULT_REGION.latitude, lng ?? DEFAULT_REGION.longitude, filters);
  }, [lat, lng, filters, fetch]);

  useEffect(() => {
    if (lat == null || lng == null) return;
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 800);
  }, [lat, lng]);

  const toggleFilter = (key: keyof NearbyFilters) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const useGps = async () => {
    const ok = granted ? await refresh() : await request();
    if (!ok) setPicker(true);
  };

  const attribution = attributionText(clinics);
  const openCount = clinics.filter((c) => clinicStatus(c).tone === 'open').length;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={lat != null && lng != null ? { latitude: lat, longitude: lng, latitudeDelta: 0.12, longitudeDelta: 0.12 } : DEFAULT_REGION}
        userInterfaceStyle={t.dark ? 'dark' : 'light'}
        showsUserLocation={source === 'gps'}
        showsMyLocationButton={false}
      >
        {clinics.map((clinic) => {
          const s = clinicStatus(clinic);
          return (
            <Marker key={clinic.id} coordinate={{ latitude: clinic.lat, longitude: clinic.lng }} pinColor={markerColor(t, clinic)}>
              <Callout tooltip onPress={() => router.push(`/clinic/${clinic.id}`)}>
                <View
                  style={{
                    backgroundColor: t.surface,
                    borderRadius: radius.md,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: t.border,
                    minWidth: 210,
                    maxWidth: 260,
                    ...shadow(t, 2),
                  }}
                >
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {clinic.name}
                  </Text>
                  <Text variant="caption" color={markerColor(t, clinic)} style={{ marginTop: 4 }}>
                    {[s.closingSoon ?? s.label, clinic.distance_km > 0 ? formatDistance(clinic.distance_km, clinic.location_approx) : null].filter(Boolean).join(' · ')}
                  </Text>
                  <Text variant="caption" tone="primary" style={{ marginTop: 8 }}>
                    Detay ve arama →
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Filtreler */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
        <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} accessibilityLabel="Geri" size={40} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 10 }}>
          <Chip label="Şu an açık" icon="time-outline" active={filters.only_open} onPress={() => toggleFilter('only_open')} />
          <Chip label="7/24" icon="moon-outline" active={filters.only_24_7} onPress={() => toggleFilter('only_24_7')} />
          <Chip label="Acil kabul" icon="medkit-outline" active={filters.only_emergency} onPress={() => toggleFilter('only_emergency')} />
        </ScrollView>
      </View>

      {/* Sağ düğmeler */}
      <View style={{ position: 'absolute', right: 16, bottom: insets.bottom + 90, gap: 10 }}>
        <IconButton icon="navigate" onPress={useGps} accessibilityLabel="Konumuma git" size={48} />
        <IconButton icon="add" variant="primary" onPress={() => router.push('/clinic/add')} accessibilityLabel="Klinik ekle" size={48} />
      </View>

      {/* Alt bilgi */}
      <Pressable
        onPress={() => setPicker(true)}
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: t.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: t.border,
          paddingHorizontal: 14,
          paddingVertical: 10,
          ...shadow(t, 2),
        }}
      >
        {loading ? <ActivityIndicator color={t.primary} size="small" /> : <Icon name="location-outline" size={18} color={t.primary} />}
        <View style={{ flex: 1 }}>
          <Text variant="callout">{loading ? 'Klinikler yükleniyor…' : `${openCount} açık · ${clinics.length} klinik`}</Text>
          {attribution ? (
            <Text variant="caption" tone="subtle" style={{ fontSize: 11 }} numberOfLines={2}>
              {attribution}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" tone="primary">
          Konum
        </Text>
      </Pressable>

      <DistrictPicker visible={picker} onClose={() => setPicker(false)} onPick={(d) => setManual(d.lat, d.lng, d.name)} onUseGps={useGps} />
    </View>
  );
}
