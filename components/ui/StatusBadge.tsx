import React from 'react';
import { View, Text } from 'react-native';
import type { ClinicStatus } from '@/types';
import { formatVerifiedAt } from '@/lib/utils/time';

interface Props {
  status: ClinicStatus;
  last_verified_at: string | null;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, last_verified_at, size = 'md' }: Props) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  if (status === 'open') {
    return (
      <View className="flex-row items-center gap-1.5">
        <View className="w-2 h-2 rounded-full bg-green-open" />
        <Text className={`${textSize} text-green-light font-semibold`}>
          Açık · {formatVerifiedAt(last_verified_at)}
        </Text>
      </View>
    );
  }
  if (status === 'closed') {
    return (
      <View className="flex-row items-center gap-1.5">
        <View className="w-2 h-2 rounded-full bg-red-sos" />
        <Text className={`${textSize} text-red-400 font-semibold`}>Kapalı</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-2 h-2 rounded-full bg-gray-muted" />
      <Text className={`${textSize} text-gray-text`}>
        Durum bilinmiyor — aramadan gitme
      </Text>
    </View>
  );
}
