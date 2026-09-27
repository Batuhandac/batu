import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { router, useFocusEffect } from 'expo-router';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { DistrictPicker } from '@/components/location/DistrictPicker';
import { formatDistance } from '@/components/clinic/ClinicCard';
import { usesSource } from '@/components/ui/DataAttribution';
import type { Clinic, NearbyFilters } from '@/types';

const DEFAULT_REGION: Region = {
  latitude: 39.9334,
  longitude: 32.8597,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const DEFAULT_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false };

function markerColor(clinic: Clinic): string {
  if (clinic.status === 'open' || clinic.is_24_7) return '#22c55e';
  if (clinic.status === 'closed') return '#8e9196';
  return '#eac333'; // saat bilinmiyor
}

const PANEL = 'rgba(31,31,33,0.94)';
const PANEL_BORDER = 'rgba(255,255,255,0.08)';

export default function MapScreen() {
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

  const google = usesSource(clinics, 'google');
  const osm = usesSource(clinics, 'builtin');

  return (
    <View className="flex-1 bg-bg">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={lat != null && lng != null ? { latitude: lat, longitude: lng, latitudeDelta: 0.12, longitudeDelta: 0.12 } : DEFAULT_REGION}
        userInterfaceStyle="dark"
        showsUserLocation={source === 'gps'}
        showsMyLocationButton={false}
      >
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            coordinate={{ latitude: clinic.lat, longitude: clinic.lng }}
            pinColor={markerColor(clinic)}
          >
            <Callout tooltip onPress={() => router.push(`/clinic/${clinic.id}`)}>
              <View
                style={{
                  backgroundColor: '#1f1f21',
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: PANEL_BORDER,
                  minWidth: 200,
                  maxWidth: 250,
                }}
              >
                <Text style={{ color: '#e4e2e3', fontWeight: 'bold', fontSize: 13 }} numberOfLines={2}>
                  {clinic.name}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <Text style={{ color: markerColor(clinic), fontSize: 11, fontWeight: '700' }}>
                    {clinic.status === 'open' || clinic.is_24_7 ? 'Açık' : clinic.status === 'closed' ? 'Kapalı' : 'Saat bilinmiyor'}
                  </Text>
                  {clinic.is_24_7 && <Text style={{ color: '#c4c6cc', fontSize: 11 }}>7/24</Text>}
                  {clinic.distance_km > 0 && (
                    <Text style={{ color: '#c4c6cc', fontSize: 11 }}>{formatDistance(clinic.distance_km)}</Text>
                  )}
                </View>
                <Text style={{ color: '#8e9196', fontSize: 10, marginTop: 6 }}>Detay ve arama için dokun →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Filtreler + konum */}
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 56 : 12,
          left: 12,
          right: 12,
          flexDirection: 'row',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {[
          { key: 'only_open' as const, label: 'Şu an açık' },
          { key: 'only_24_7' as const, label: '7/24' },
          { key: 'only_emergency' as const, label: 'Acil' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => toggleFilter(key)}
            style={{
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderWidth: 1,
              backgroundColor: filters[key] ? '#ff7f1c' : PANEL,
              borderColor: filters[key] ? '#ff7f1c' : PANEL_BORDER,
            }}
          >
            <Text style={{ color: filters[key] ? '#fff' : '#c4c6cc', fontSize: 12, fontWeight: '600' }}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => setPicker(true)}
          style={{ borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, backgroundColor: PANEL, borderColor: PANEL_BORDER }}
        >
          <Text style={{ color: '#c4c6cc', fontSize: 12 }}>📍 Konum</Text>
        </TouchableOpacity>
      </View>

      {/* Durum / sayı */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          alignSelf: 'center',
          backgroundColor: PANEL,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          maxWidth: '70%',
        }}
      >
        {loading && <ActivityIndicator color="#ff7f1c" size="small" />}
        <Text style={{ color: '#c4c6cc', fontSize: 12 }} numberOfLines={2}>
          {loading ? 'Yükleniyor…' : `${clinics.length} klinik`}
          {google ? ' · Google Maps' : ''}
          {osm ? ' · © OpenStreetMap katkıcıları' : ''}
        </Text>
      </View>

      {/* Klinik ekle FAB */}
      <TouchableOpacity
        onPress={() => router.push('/clinic/add')}
        activeOpacity={0.85}
        accessibilityLabel="Klinik ekle"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 16,
          backgroundColor: '#ff7f1c',
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#ff7f1c',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, marginTop: -2 }}>+</Text>
      </TouchableOpacity>

      <DistrictPicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(d) => setManual(d.lat, d.lng, d.name)}
        onUseGps={useGps}
      />
    </View>
  );
}
