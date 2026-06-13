import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Stars } from '@/components/ui/Stars';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: Props) {
  const open = clinic.status === 'open' || clinic.is_24_7;
  const accent = open ? '#38A169' : clinic.accepts_emergency ? '#E53E3E' : '#243B55';

  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/clinic/${clinic.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-card rounded-2xl mb-3 mx-4 overflow-hidden flex-row"
      style={{ borderWidth: 1, borderColor: '#243B55' }}
    >
      {/* Sol durum şeridi */}
      <View style={{ width: 4, backgroundColor: accent }} />

      <View className="flex-1 p-4">
        <View className="flex-row items-start justify-between mb-1.5">
          <View className="flex-1 mr-3">
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {clinic.name}
            </Text>
            {clinic.district && (
              <Text className="text-gray-muted text-sm mt-0.5">{clinic.district}</Text>
            )}
          </View>
          {clinic.distance_km > 0 && (
            <View className="bg-surface rounded-lg px-2.5 py-1">
              <Text className="text-gray-label text-sm font-semibold">
                {clinic.distance_km < 1
                  ? `${Math.round(clinic.distance_km * 1000)} m`
                  : `${clinic.distance_km.toFixed(1)} km`}
              </Text>
            </View>
          )}
        </View>

        <StatusBadge status={clinic.status} last_verified_at={clinic.last_verified_at} size="sm" />

        {/* Puan */}
        {clinic.rating != null && clinic.rating > 0 && (
          <View className="flex-row items-center gap-1.5 mt-2">
            <Stars value={clinic.rating} size={12} />
            <Text className="text-gray-muted text-xs">
              {clinic.rating.toFixed(1)}
              {clinic.rating_count ? ` · ${clinic.rating_count}` : ''}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2 mt-2.5 flex-wrap">
          {clinic.is_24_7 && (
            <Badge text="7/24" cls="bg-green-open/20 border-green-open/40" textCls="text-green-light" />
          )}
          {clinic.accepts_emergency && (
            <Badge text="Acil kabul" cls="bg-red-sos/20 border-red-sos/40" textCls="text-red-400" />
          )}
          {clinic.is_verified && (
            <Badge text="✓ Doğrulanmış" cls="bg-blue-900/40 border-blue-700/40" textCls="text-blue-300" />
          )}
          {clinic.source === 'community' && (
            <Badge text="🐾 Topluluk" cls="bg-surface border-border" textCls="text-gray-label" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Badge({ text, cls, textCls }: { text: string; cls: string; textCls: string }) {
  return (
    <View className={`border rounded-full px-2.5 py-0.5 ${cls}`}>
      <Text className={`text-xs font-medium ${textCls}`}>{text}</Text>
    </View>
  );
}
