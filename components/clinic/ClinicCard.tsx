import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Stars } from '@/components/ui/Stars';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: Props) {
  const open = clinic.status === 'open' || clinic.is_24_7;
  const accentColor = open ? '#eac333' : clinic.accepts_emergency ? '#ff7f1c' : '#44474c';
  const statusColor = open ? '#eac333' : clinic.accepts_emergency ? '#ff7f1c' : '#8e9196';
  const statusLabel = open ? 'Açık' : clinic.accepts_emergency ? 'Acil' : 'Kapalı';

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
    >
      {/* Sol durum şeridi */}
      <View style={{ width: 4, backgroundColor: accentColor, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />

      <View className="flex-1 p-4">
        {/* Başlık + puan */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-white font-bold text-base" numberOfLines={1} style={{ letterSpacing: -0.2 }}>
              {clinic.name}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              {clinic.district ? (
                <Text className="text-gray-text text-sm">{clinic.district}</Text>
              ) : null}
              {clinic.distance_km > 0 && clinic.district ? (
                <Text className="text-gray-muted text-sm"> · </Text>
              ) : null}
              {clinic.distance_km > 0 ? (
                <Text className="text-gray-text text-sm">
                  {clinic.distance_km < 1
                    ? `${Math.round(clinic.distance_km * 1000)} m`
                    : `${clinic.distance_km.toFixed(1)} km`}
                </Text>
              ) : null}
            </View>
          </View>
          {/* Puan pill */}
          {clinic.rating != null && clinic.rating > 0 ? (
            <View
              className="flex-row items-center gap-1 rounded-lg px-2 py-1"
              style={{ backgroundColor: 'rgba(52,53,54,0.9)' }}
            >
              <Text style={{ fontSize: 12, color: '#bac8dc' }}>★</Text>
              <Text className="text-white text-xs font-bold">{clinic.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Puan satırı (yıldız görseli) */}
        {clinic.rating != null && clinic.rating > 0 ? (
          <View className="flex-row items-center gap-1.5 mb-2">
            <Stars value={clinic.rating} size={11} />
          </View>
        ) : null}

        {/* Alt satır: status + ok */}
        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-2">
            {/* Durum badge */}
            <View
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                backgroundColor: `${statusColor}18`,
                borderWidth: 1,
                borderColor: `${statusColor}30`,
              }}
            >
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700' }}>{statusLabel}</Text>
            </View>
            {/* Etiketler */}
            {clinic.is_24_7 && !open && (
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(68,71,76,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Text className="text-gray-label text-xs font-semibold">7/24</Text>
              </View>
            )}
            {clinic.source === 'community' && (
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: 'rgba(68,71,76,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Text className="text-gray-text text-xs">🐾 Topluluk</Text>
              </View>
            )}
          </View>
          {/* Ok butonu */}
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(68,71,76,0.7)' }}
          >
            <Text className="text-gray-label text-base">›</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
