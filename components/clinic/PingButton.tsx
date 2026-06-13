import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

interface Props {
  clinicId: string;
}

export function PingButton({ clinicId }: Props) {
  const [sent, setSent] = useState(false);

  const ping = async (isOpen: boolean) => {
    if (sent) return;
    // Backend opsiyonel — bağlanamasa bile kullanıcıya teşekkür göster
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('clinic_pings').insert({
        clinic_id: clinicId,
        user_id: user?.id ?? null,
        is_open_now: isOpen,
      });
    } catch {
      // sessizce geç
    }
    await track('open_ping_submitted', { clinic_id: clinicId, is_open: isOpen });
    setSent(true);
  };

  if (sent) {
    return (
      <View className="bg-surface border border-border rounded-2xl p-4 items-center">
        <Text className="text-green-light text-sm font-semibold">
          Teşekkürler, başka sahiplere yardım ettin.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface border border-border rounded-2xl p-4">
      <Text className="text-gray-label text-sm font-semibold mb-3 text-center">
        Şu an açık mı?
      </Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => ping(true)}
          className="flex-1 bg-green-open/20 border border-green-open rounded-xl py-3 items-center"
        >
          <Text className="text-green-light text-xl">👍</Text>
          <Text className="text-green-light text-xs mt-1">Açık</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => ping(false)}
          className="flex-1 bg-red-sos/20 border border-red-sos rounded-xl py-3 items-center"
        >
          <Text className="text-red-400 text-xl">👎</Text>
          <Text className="text-red-400 text-xs mt-1">Kapalı</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
