import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { callClinic } from '@/lib/utils/call';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

export function ClinicCard({ clinic }: Props) {
  const open = clinic.status === 'open' || clinic.is_24_7;
  const accentColor = open ? '#eac333' : clinic.accepts_emergency ? '#ff7f1c' : '#44474c';
  const statusColor = open ? '#eac333' : '#8e9196';
  // Kapalı bir kliniği asla "Acil" diye gösterme — gece yanlış adrese gidilmesin
  const statusLabel = open ? 'Açık' : clinic.status === 'closed' ? 'Kapalı' : 'Saat bilinmiyor';

  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/clinic/${clinic.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      className="mb-3 mx-4 rounded-2xl overflow-hidden flex-row"
      style={{
        backgroundColor: 'rgba(42,42,43,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
      accessibilityRole="button"
      accessibilityLabel={`${clinic.name}, ${statusLabel}${clinic.distance_km > 0 ? ', ' + formatDistance(clinic.distance_km) : ''}`}
    >
      {/* Sol durum şeridi */}
      <View style={{ width: 4, backgroundColor: accentColor }} />

      <View className="flex-1 p-4 flex-row items-center gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-white font-bold text-base flex-shrink" numberOfLines={1} style={{ letterSpacing: -0.2 }}>
              {clinic.name}
            </Text>
            {clinic.is_verified && <Text style={{ color: '#68D391', fontSize: 13 }}>✓</Text>}
          </View>

          <Text className="text-gray-text text-sm mt-0.5" numberOfLines={1}>
            {[clinic.distance_km > 0 ? formatDistance(clinic.distance_km) : null, clinic.district]
              .filter(Boolean)
              .join(' · ')}
            {clinic.rating != null && clinic.rating > 0 ? `  ★ ${clinic.rating.toFixed(1)}` : ''}
          </Text>

          <View className="flex-row flex-wrap items-center gap-2 mt-2">
            <View
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
              style={{ backgroundColor: `${statusColor}18`, borderWidth: 1, borderColor: `${statusColor}30` }}
            >
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700' }}>{statusLabel}</Text>
            </View>
            {clinic.is_24_7 && <Tag label="7/24" />}
            {clinic.accepts_emergency && !clinic.is_24_7 && <Tag label="Acil kabul" orange />}
            {clinic.source === 'community' && <Tag label="🐾 Topluluk" />}
          </View>
        </View>

        {/* Doğrudan ara — acilde detay sayfasına girmeye gerek kalmasın */}
        {clinic.phone ? (
          <TouchableOpacity
            onPress={() => callClinic(clinic, 'list')}
            activeOpacity={0.85}
            hitSlop={8}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: open ? '#38A169' : 'rgba(68,71,76,0.9)' }}
            accessibilityRole="button"
            accessibilityLabel={`${clinic.name} ara`}
          >
            <Text style={{ fontSize: 20 }}>📞</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(68,71,76,0.7)' }}>
            <Text className="text-gray-label text-base">›</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Tag({ label, orange }: { label: string; orange?: boolean }) {
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={
        orange
          ? { backgroundColor: 'rgba(255,127,28,0.12)', borderWidth: 1, borderColor: 'rgba(255,127,28,0.3)' }
          : { backgroundColor: 'rgba(68,71,76,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
      }
    >
      <Text style={{ color: orange ? '#ff7f1c' : '#e4e2e3', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
