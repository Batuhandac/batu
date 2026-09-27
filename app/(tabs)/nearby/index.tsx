import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Chip, Button, EmptyState, IconBadge } from '@/components/ds';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { LocationBar } from '@/components/location/LocationBar';
import { DistrictList } from '@/components/location/DistrictPicker';
import { useClinics } from '@/lib/hooks/useClinics';
import { useLocation } from '@/lib/hooks/useLocation';
import { useTheme } from '@/lib/theme';
import { track } from '@/lib/analytics';
import type { NearbyFilters } from '@/types';

const DEFAULT_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false };

export default function NearbyScreen() {
  const t = useTheme();
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
  const openCount = clinics.filter((c) => c.status === 'open' || c.is_24_7).length;

  // Konum yok: izin iste ya da ilçe seçtir
  if (lat == null || lng == null) {
    return (
      <Screen scroll contentStyle={{ paddingHorizontal: 24, paddingTop: 32 }}>
        <IconBadge name="location" size={64} />
        <Text variant="title" style={{ marginTop: 18 }}>
          Neredesin?
        </Text>
        <Text variant="body" tone="muted" style={{ marginTop: 6 }}>
          Sana en yakın açık veterinerleri gösterebilmemiz için konumun gerekiyor. Konumun yalnızca
          telefonunda kullanılır.
        </Text>
        <Button title="Konumumu kullan" icon="navigate" size="lg" full loading={locating} onPress={request} style={{ marginTop: 24 }} />
        <Text variant="overline" tone="subtle" style={{ marginTop: 32, marginBottom: 12 }}>
          Ya da ilçeni seç
        </Text>
        <DistrictList onPick={(d) => setManual(d.lat, d.lng, d.name)} />
      </Screen>
    );
  }

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Yakınındaki klinikler</Text>
          <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
            {clinics.length > 0 ? `${openCount} açık · toplam ${clinics.length} klinik` : 'Açık ve yakın olanlar önce gösterilir'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Harita" icon="map-outline" variant="secondary" size="sm" onPress={() => router.push('/map')} />
          <Button title="Acil" icon="medkit" variant="sos" size="sm" onPress={() => router.push('/emergency')} accessibilityLabel="Acil mod" />
        </View>
      </View>
      <LocationBar />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
        <Chip label="Tümü" active={!anyFilter} onPress={() => setFilters(DEFAULT_FILTERS)} />
        <Chip label="Şu an açık" icon="time-outline" active={filters.only_open} onPress={() => toggleFilter('only_open')} />
        <Chip label="7/24" icon="moon-outline" active={filters.only_24_7} onPress={() => toggleFilter('only_24_7')} />
        <Chip label="Acil kabul" icon="medkit-outline" active={filters.only_emergency} onPress={() => toggleFilter('only_emergency')} />
      </ScrollView>
      {loading && clinics.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ActivityIndicator color={t.primary} size="small" />
          <Text variant="caption" tone="subtle">
            Güncel bilgiler alınıyor…
          </Text>
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
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator color={t.primary} size="large" />
              <Text variant="callout" tone="muted" style={{ marginTop: 12 }}>
                Klinikler aranıyor…
              </Text>
            </View>
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Bağlantı sorunu"
              text={error}
              action={<Button title="Tekrar dene" variant="secondary" icon="refresh" onPress={onRefresh} full />}
            />
          ) : anyFilter ? (
            <EmptyState
              icon="funnel-outline"
              title="Bu filtreye uyan klinik yok"
              text="Filtreyi kaldırarak en yakın klinikleri gör. Kapalı görünen bir klinik de acil hattına yönlendirebilir."
              action={<Button title="Filtreleri temizle" variant="secondary" onPress={() => setFilters(DEFAULT_FILTERS)} full />}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Yakınında kayıtlı klinik yok"
              text="Konumunu kontrol et ya da başka bir ilçe seç. Bildiğin bir kliniği ekleyerek başkalarına da yardım edebilirsin."
              action={<Button title="Klinik ekle" variant="soft" icon="add" onPress={() => router.push('/clinic/add')} full />}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={t.primary} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
