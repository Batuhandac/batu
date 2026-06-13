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
          <TouchableOpacity onPress={handleRequestLocation} className="bg-red-sos rounded-2xl py-4 px-8">
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
        <Text className="text-white text-2xl font-bold">Yakın Klinikler</Text>
        <Text className="text-gray-muted text-sm mb-4 mt-0.5">
          {!loading && clinics.length > 0
            ? `${clinics.length} klinik · en yakın ve açık önce`
            : 'Sana en yakın açık veterinerler'}
        </Text>
        <View className="flex-row gap-2 flex-wrap">
          {[
            { key: 'only_24_7' as const, label: '7/24' },
            { key: 'only_emergency' as const, label: 'Acil kabul' },
            { key: 'only_verified' as const, label: 'Doğrulanmış' },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => toggleFilter(key)}
              className={`rounded-full px-4 py-1.5 border ${filters[key] ? 'bg-red-sos border-red-sos' : 'bg-surface border-border'}`}
            >
              <Text className={`text-sm font-semibold ${filters[key] ? 'text-white' : 'text-gray-text'}`}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E53E3E" size="large" />
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
            className="bg-red-sos rounded-2xl py-3 px-6 mt-4"
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
