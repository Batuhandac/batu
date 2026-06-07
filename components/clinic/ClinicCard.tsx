import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Clinic } from '@/types';

interface Props {
  clinic: Clinic;
}

export function ClinicCard({ clinic }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/clinic/${clinic.id}`)}
      className="bg-card border border-border rounded-2xl p-4 mb-3 mx-4"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-white font-bold text-base" numberOfLines={1}>{clinic.name}</Text>
          {clinic.district && (
            <Text className="text-gray-muted text-sm mt-0.5">{clinic.district}</Text>
          )}
        </View>
        <Text className="text-gray-text text-sm font-semibold">
          {clinic.distance_km < 1
            ? `${Math.round(clinic.distance_km * 1000)} m`
            : `${clinic.distance_km.toFixed(1)} km`}
        </Text>
      </View>

      <StatusBadge status={clinic.status} last_verified_at={clinic.last_verified_at} size="sm" />

      <View className="flex-row gap-2 mt-2.5 flex-wrap">
        {clinic.is_24_7 && (
          <View className="bg-green-open/20 border border-green-open/40 rounded-full px-2.5 py-0.5">
            <Text className="text-green-light text-xs font-medium">7/24</Text>
          </View>
        )}
        {clinic.accepts_emergency && (
          <View className="bg-red-sos/20 border border-red-sos/40 rounded-full px-2.5 py-0.5">
            <Text className="text-red-400 text-xs font-medium">Acil kabul</Text>
          </View>
        )}
        {clinic.is_verified && (
          <View className="bg-blue-900/40 border border-blue-700/40 rounded-full px-2.5 py-0.5">
            <Text className="text-blue-300 text-xs font-medium">Doğrulanmış</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
