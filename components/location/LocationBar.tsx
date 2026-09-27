import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text, Icon } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
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
  const t = useTheme();
  const { source, label, updatedAt, loading, granted, refresh, request, setManual } = useLocation();
  const [picker, setPicker] = useState(false);

  const useGps = async () => {
    const ok = granted ? await refresh() : await request();
    if (!ok) setPicker(true);
  };

  const title = source === 'manual' ? label ?? 'Seçilen bölge' : source === 'gps' ? 'Bulunduğun konum' : 'Konum seçilmedi';
  const sub = loading ? 'Konum güncelleniyor…' : source === 'manual' ? 'Elle seçildi' : updatedAt ? ago(updatedAt) : '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: radius.md,
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 6,
      }}
    >
      <Icon name={source === 'gps' ? 'navigate' : 'location-outline'} size={18} color={t.primary} />
      <Pressable style={{ flex: 1 }} onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel="Konumu değiştir">
        <Text variant="callout" numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text variant="caption" tone="subtle" style={{ fontSize: 12 }}>
            {sub}
          </Text>
        ) : null}
      </Pressable>
      {loading ? (
        <ActivityIndicator color={t.primary} style={{ marginRight: 8 }} />
      ) : (
        <Pressable
          onPress={source === 'gps' ? () => refresh() : useGps}
          hitSlop={8}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            height: 34,
            borderRadius: radius.pill,
            backgroundColor: pressed ? t.primarySoft : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 4,
          })}
        >
          <Icon name={source === 'gps' ? 'refresh' : 'navigate-outline'} size={15} color={t.primary} />
          <Text variant="caption" tone="primary">
            {source === 'gps' ? 'Yenile' : 'Konumumu kullan'}
          </Text>
        </Pressable>
      )}
      <DistrictPicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(d) => setManual(d.lat, d.lng, d.name)}
        onUseGps={useGps}
      />
    </View>
  );
}
