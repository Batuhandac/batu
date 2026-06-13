import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { router } from 'expo-router';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { ANKARA_DISTRICTS } from '@/lib/utils/districts';
import type { Clinic, NearbyFilters } from '@/types';

const DEFAULT_REGION: Region = {
  latitude: 39.9334,
  longitude: 32.8597,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const DEFAULT_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_verified: false };

function markerColor(clinic: Clinic): string {
  if (clinic.status === 'open' || clinic.is_24_7) return '#22c55e';
  if (clinic.accepts_emergency) return '#E53E3E';
  return '#718096';
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { clinics, loading, fetch } = useClinics();
  const { lat, lng, request, setManual } = useLocation();
  const [filters, setFilters] = useState<NearbyFilters>(DEFAULT_FILTERS);
  const [showDistricts, setShowDistricts] = useState(false);
  const [selected, setSelected] = useState<Clinic | null>(null);

  const loadClinics = useCallback(async (lt: number, ln: number, f: NearbyFilters) => {
    await fetch(lt, ln, f);
  }, [fetch]);

  useEffect(() => {
    if (lat && lng) {
      loadClinics(lat, lng, filters);
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }, 800);
    } else {
      loadClinics(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude, filters);
    }
  }, [lat, lng]);

  useEffect(() => {
    const lt = lat ?? DEFAULT_REGION.latitude;
    const ln = lng ?? DEFAULT_REGION.longitude;
    loadClinics(lt, ln, filters);
  }, [filters]);

  const toggleFilter = (key: keyof NearbyFilters) => {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  };

  const handleRequestLocation = async () => {
    const ok = await request();
    if (!ok) setShowDistricts(true);
  };

  if (showDistricts) {
    return (
      <View className="flex-1 bg-bg pt-14 px-6">
        <Text className="text-white text-xl font-bold mb-1">İlçe Seç</Text>
        <Text className="text-gray-text text-sm mb-4">Konumunuza göre haritayı merkezle</Text>
        <View className="flex-row flex-wrap gap-2">
          {ANKARA_DISTRICTS.map(d => (
            <TouchableOpacity
              key={d.name}
              onPress={() => {
                setManual(d.lat, d.lng);
                setShowDistricts(false);
              }}
              className="bg-card border border-border rounded-full px-4 py-2"
            >
              <Text className="text-white text-sm">{d.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        userInterfaceStyle="dark"
        showsUserLocation={!!lat}
        showsMyLocationButton={false}
        onPress={() => setSelected(null)}
      >
        {clinics.map(clinic => (
          <Marker
            key={clinic.id}
            coordinate={{ latitude: clinic.lat, longitude: clinic.lng }}
            pinColor={markerColor(clinic)}
            onPress={() => setSelected(clinic)}
          >
            <Callout tooltip onPress={() => router.push(`/clinic/${clinic.id}`)}>
              <View
                style={{
                  backgroundColor: '#1a2f47',
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: '#243B55',
                  minWidth: 200,
                  maxWidth: 250,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }} numberOfLines={2}>
                  {clinic.name}
                </Text>
                {clinic.district && (
                  <Text style={{ color: '#718096', fontSize: 11, marginTop: 2 }}>
                    {clinic.district}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {clinic.is_24_7 && (
                    <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '600' }}>7/24</Text>
                  )}
                  {clinic.accepts_emergency && (
                    <Text style={{ color: '#E53E3E', fontSize: 10, fontWeight: '600' }}>Acil</Text>
                  )}
                  {clinic.distance_km > 0 && (
                    <Text style={{ color: '#a0aec0', fontSize: 10 }}>
                      {clinic.distance_km < 1
                        ? `${Math.round(clinic.distance_km * 1000)} m`
                        : `${clinic.distance_km.toFixed(1)} km`}
                    </Text>
                  )}
                </View>
                <Text style={{ color: '#718096', fontSize: 10, marginTop: 6 }}>
                  Detay için dokun →
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Filtreler */}
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
          { key: 'only_24_7' as const, label: '7/24' },
          { key: 'only_emergency' as const, label: 'Acil' },
          { key: 'only_verified' as const, label: 'Doğrulanmış' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => toggleFilter(key)}
            style={{
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderWidth: 1,
              backgroundColor: filters[key] ? '#E53E3E' : 'rgba(21,35,54,0.92)',
              borderColor: filters[key] ? '#E53E3E' : '#243B55',
            }}
          >
            <Text style={{ color: filters[key] ? '#fff' : '#a0aec0', fontSize: 12, fontWeight: '600' }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}

        {!lat && (
          <TouchableOpacity
            onPress={handleRequestLocation}
            style={{
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderWidth: 1,
              backgroundColor: 'rgba(21,35,54,0.92)',
              borderColor: '#243B55',
            }}
          >
            <Text style={{ color: '#a0aec0', fontSize: 12 }}>📍 Konumum</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Yükleniyor */}
      {loading && (
        <View
          style={{
            position: 'absolute',
            bottom: 24,
            alignSelf: 'center',
            backgroundColor: 'rgba(21,35,54,0.9)',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ActivityIndicator color="#E53E3E" size="small" />
          <Text style={{ color: '#fff', fontSize: 13 }}>Yükleniyor…</Text>
        </View>
      )}

      {/* Klinik sayısı */}
      {!loading && clinics.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 24,
            alignSelf: 'center',
            backgroundColor: 'rgba(21,35,54,0.9)',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#a0aec0', fontSize: 12 }}>
            {clinics.length} klinik gösteriliyor
          </Text>
        </View>
      )}

      {/* Klinik ekle FAB */}
      <TouchableOpacity
        onPress={() => router.push('/clinic/add')}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 16,
          backgroundColor: '#E53E3E',
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#E53E3E',
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
