import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { ANKARA_DISTRICTS } from '@/lib/utils/districts';
import { track } from '@/lib/analytics';
import type { NearbyFilters } from '@/types';

const DEFAULT_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_verified: false };

export default function NearbyScreen() {
  const { clinics, loading, error, offline, cacheTimestamp, fetch } = useClinics();
  const { lat, lng, granted, request, setManual } = useLocation();
  const [filters, setFilters] = useState<NearbyFilters>(DEFAULT_FILTERS);
  const [showDistricts, setShowDistricts] = useState(false);

  const loadClinics = useCallback(async (lt: number, ln: number, f: NearbyFilters) => {
    await fetch(lt, ln, f);
    await track('clinic_list_view');
  }, [fetch]);

  useEffect(() => {
    if (lat && lng) {
      loadClinics(lat, lng, filters);
    } else if (granted === false || granted === null) {
      setShowDistricts(true);
    }
  }, [lat, lng]);

  useEffect(() => {
    if (lat && lng) loadClinics(lat, lng, filters);
  }, [filters]);

  const handleRequestLocation = async () => {
    const ok = await request();
    if (!ok) setShowDistricts(true);
  };

  const toggleFilter = (key: keyof NearbyFilters) => {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  };

  if (!lat && !lng && !showDistricts) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-6 gap-6">
          <Text className="text-5xl">📍</Text>
          <Text className="text-white text-xl font-bold text-center">Konumuna ihtiyacımız var</Text>
          <TouchableOpacity onPress={handleRequestLocation} className="rounded-2xl py-4 px-8" style={{ backgroundColor: '#ff7f1c' }}>
            <Text className="text-white font-bold text-base">Konum İzni Ver</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDistricts(true)}>
            <Text className="text-gray-text text-sm underline">İlçe seç</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  if (showDistricts && !lat) {
    return (
      <Screen scroll>
        <View className="px-6 pt-8">
          <Text className="text-white text-xl font-bold mb-1">İlçe Seç</Text>
          <Text className="text-gray-text text-sm mb-6">Ankara'da hangi bölgedesiniz?</Text>
          {ANKARA_DISTRICTS.map(d => (
            <TouchableOpacity
              key={d.name}
              onPress={() => { setManual(d.lat, d.lng); setShowDistricts(false); loadClinics(d.lat, d.lng, filters); }}
              className="bg-card border border-border rounded-2xl px-5 py-4 mb-3 flex-row items-center justify-between"
            >
              <Text className="text-white font-medium">{d.name}</Text>
              <Text className="text-gray-muted">›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {offline && <OfflineBanner timestamp={cacheTimestamp} />}
      <View className="px-4 pt-6 pb-3">
        <Text className="text-white text-2xl font-bold" style={{ letterSpacing: -0.4 }}>Yakın Klinikler</Text>
        <Text className="text-gray-text text-sm mb-4 mt-0.5">
          {!loading && clinics.length > 0
            ? `${clinics.length} klinik · en yakın ve açık önce`
            : 'Sana en yakın açık veterinerler'}
        </Text>
        <View className="flex-row gap-2 flex-wrap">
          <FilterChip label="Hepsi" active={!filters.only_24_7 && !filters.only_emergency && !filters.only_verified} onPress={() => setFilters(DEFAULT_FILTERS)} />
          {[
            { key: 'only_24_7' as const, label: '7/24' },
            { key: 'only_emergency' as const, label: 'Acil' },
            { key: 'only_verified' as const, label: 'Doğrulanmış' },
          ].map(({ key, label }) => (
            <FilterChip key={key} label={label} active={filters[key]} onPress={() => toggleFilter(key)} />
          ))}
        </View>
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ff7f1c" size="large" />
          <Text className="text-gray-text mt-3">Klinikler yükleniyor…</Text>
        </View>
      )}

      {!loading && error && (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className="text-gray-text text-center">{error}</Text>
          <TouchableOpacity onPress={() => lat && lng && loadClinics(lat, lng, filters)} className="bg-card border border-border rounded-2xl py-3 px-6">
            <Text className="text-white font-semibold">Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && clinics.length === 0 && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-4">🔍</Text>
          <Text className="text-white font-bold text-lg text-center mb-2">
            Açık klinik bulunamadı
          </Text>
          <Text className="text-gray-text text-sm text-center">
            Hiç açık klinik bulunamadı, en yakın 7/24'leri görmek için filtreyi kaldır. Gitmeden önce ara.
          </Text>
          <TouchableOpacity
            onPress={() => setFilters(DEFAULT_FILTERS)}
            className="rounded-2xl py-3 px-6 mt-4"
            style={{ backgroundColor: '#ff7f1c' }}
          >
            <Text className="text-white font-semibold">Filtreleri Temizle</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && clinics.length > 0 && (
        <FlatList
          data={clinics}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ClinicCard clinic={item} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-full px-4 py-1.5"
      style={{
        backgroundColor: active ? '#ff7f1c' : 'rgba(42,42,43,0.9)',
        borderWidth: 1,
        borderColor: active ? '#ff7f1c' : 'rgba(255,255,255,0.07)',
      }}
    >
      <Text style={{ color: active ? '#fff' : '#c4c6cc', fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
