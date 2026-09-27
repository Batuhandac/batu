import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocation } from '@/lib/hooks/useLocation';
import { DistrictPicker } from './DistrictPicker';

function ago(ts: number): string {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'az önce güncellendi';
  if (min < 60) return `${min} dk önce güncellendi`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} saat önce güncellendi`;
  return `${Math.floor(h / 24)} gün önce güncellendi`;
}

// Listenin hangi konuma göre sıralandığını her zaman gösterir — yanlış
// konuma göre klinik önermek acilde en tehlikeli hatalardan biri.
export function LocationBar() {
  const { source, label, updatedAt, loading, granted, refresh, request, setManual } = useLocation();
  const [picker, setPicker] = useState(false);

  const useGps = async () => {
    const ok = granted ? await refresh() : await request();
    if (!ok) setPicker(true);
  };

  const title =
    source === 'manual' ? `${label ?? 'Seçilen bölge'}` : source === 'gps' ? 'Bulunduğun konum' : 'Konum seçilmedi';
  const sub = loading
    ? 'Konum güncelleniyor…'
    : source === 'manual'
    ? 'Elle seçildi'
    : updatedAt
    ? ago(updatedAt)
    : '';

  return (
    <View className="flex-row items-center bg-card border border-border rounded-2xl px-3 py-2.5 gap-2">
      <Text className="text-base">📍</Text>
      <View className="flex-1">
        <Text className="text-white text-sm font-semibold" numberOfLines={1}>{title}</Text>
        {sub ? <Text className="text-gray-muted text-xs">{sub}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator color="#ff7f1c" size="small" />
      ) : source === 'manual' || source === null ? (
        <TouchableOpacity onPress={useGps} hitSlop={8} className="rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(255,127,28,0.15)' }}>
          <Text style={{ color: '#ff7f1c', fontSize: 12, fontWeight: '700' }}>Konumumu kullan</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => refresh()} hitSlop={8} className="rounded-full px-3 py-1.5 bg-surface">
          <Text className="text-gray-label text-xs font-semibold">Yenile</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => setPicker(true)} hitSlop={8} className="rounded-full px-3 py-1.5 bg-surface">
        <Text className="text-gray-label text-xs font-semibold">Değiştir</Text>
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
