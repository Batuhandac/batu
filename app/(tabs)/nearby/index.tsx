import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { LocationBar } from '@/components/location/LocationBar';
import { DistrictList } from '@/components/location/DistrictPicker';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { track } from '@/lib/analytics';
import type { NearbyFilters } from '@/types';

const DEFAULT_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false };

export default function NearbyScreen() {
  const { clinics, loading, error, fetch } = useClinics();
  const { lat, lng, source, isStale, loading: locating, request, refresh, setManual } = useLocation();
  const [filters, setFilters] = useState<NearbyFilters>(DEFAULT_FILTERS);

  // Ekran her açıldığında GPS konumunu tazele — dün evdeyken alınan konumla
  // bugün başka yerde klinik önermeyelim. Elle seçilen ilçeye dokunma.
  useFocusEffect(
    useCallback(() => {
      if (source !== 'manual' && isStale) refresh();
    }, [source, isStale, refresh])
  );

  useEffect(() => {
    if (lat == null || lng == null) return;
    fetch(lat, lng, filters);
    track('clinic_list_view');
  }, [lat, lng, filters, fetch]);

  const onRefresh = async () => {
    if (source !== 'manual') await refresh();
    if (lat != null && lng != null) await fetch(lat, lng, filters);
  };

  const toggleFilter = (key: keyof NearbyFilters) => setFilters((f) => ({ ...f, [key]: !f[key] }));
  const anyFilter = filters.only_24_7 || filters.only_emergency || filters.only_open;

  // Konum yok: izin iste ya da ilçe seçtir
  if (lat == null || lng == null) {
    return (
      <Screen scroll>
        <View className="px-6 pt-10">
          <Text className="text-5xl text-center mb-4">📍</Text>
          <Text className="text-white text-xl font-bold text-center">Neredesin?</Text>
          <Text className="text-gray-text text-sm text-center mt-2 mb-6 leading-relaxed">
            Sana en yakın açık veterinerleri gösterebilmemiz için konumun gerekiyor. Konumun sadece
            cihazında kullanılır.
          </Text>
          <TouchableOpacity
            onPress={request}
            disabled={locating}
            className="rounded-2xl py-4 items-center mb-8"
            style={{ backgroundColor: '#ff7f1c' }}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">{locating ? 'Konum alınıyor…' : 'Konumumu kullan'}</Text>
          </TouchableOpacity>
          <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-3">
            Ya da ilçe / semt seç (Ankara)
          </Text>
          <DistrictList onPick={(d) => setManual(d.lat, d.lng, d.name)} />
        </View>
      </Screen>
    );
  }

  const header = (
    <View className="px-4 pt-6 pb-3">
      <Text className="text-white text-2xl font-bold" style={{ letterSpacing: -0.4 }}>Yakın Klinikler</Text>
      <Text className="text-gray-text text-sm mb-3 mt-0.5">
        {clinics.length > 0 ? `${clinics.length} klinik · açık ve yakın olanlar önce` : 'Sana en yakın açık veterinerler'}
      </Text>
      <LocationBar />
      <View className="flex-row gap-2 flex-wrap mt-3">
        <FilterChip label="Hepsi" active={!anyFilter} onPress={() => setFilters(DEFAULT_FILTERS)} />
        {[
          { key: 'only_open' as const, label: 'Şu an açık' },
          { key: 'only_24_7' as const, label: '7/24' },
          { key: 'only_emergency' as const, label: 'Acil' },
        ].map(({ key, label }) => (
          <FilterChip key={key} label={label} active={filters[key]} onPress={() => toggleFilter(key)} />
        ))}
      </View>
      {loading && clinics.length > 0 && (
        <View className="flex-row items-center gap-2 mt-3">
          <ActivityIndicator color="#ff7f1c" size="small" />
          <Text className="text-gray-muted text-xs">Güncel bilgiler alınıyor…</Text>
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={clinics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClinicCard clinic={item} />}
        ListHeaderComponent={header}
        ListFooterComponent={<DataAttribution clinics={clinics} />}
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#ff7f1c" size="large" />
              <Text className="text-gray-text mt-3">Klinikler aranıyor…</Text>
            </View>
          ) : error ? (
            <View className="items-center py-12 px-6 gap-4">
              <Text className="text-gray-text text-center">{error}</Text>
              <TouchableOpacity onPress={onRefresh} className="bg-card border border-border rounded-2xl py-3 px-6">
                <Text className="text-white font-semibold">Tekrar dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center py-12 px-6">
              <Text className="text-4xl mb-4">🔍</Text>
              <Text className="text-white font-bold text-lg text-center mb-2">
                {anyFilter ? 'Bu filtreye uyan klinik yok' : 'Yakınında kayıtlı klinik bulamadık'}
              </Text>
              <Text className="text-gray-text text-sm text-center leading-relaxed">
                {anyFilter
                  ? 'Filtreleri kaldırarak en yakın klinikleri gör. Kapalı görünen bir klinik de acil hattına yönlendirebilir — aramayı dene.'
                  : 'Konumunu kontrol et ya da başka bir ilçe seç. Bildiğin bir klinik varsa ekleyerek başkalarına yardım edebilirsin.'}
              </Text>
              <TouchableOpacity
                onPress={() => (anyFilter ? setFilters(DEFAULT_FILTERS) : router.push('/clinic/add'))}
                className="rounded-2xl py-3 px-6 mt-4"
                style={{ backgroundColor: '#ff7f1c' }}
              >
                <Text className="text-white font-semibold">{anyFilter ? 'Filtreleri temizle' : 'Klinik ekle'}</Text>
              </TouchableOpacity>
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#ff7f1c" />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
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
