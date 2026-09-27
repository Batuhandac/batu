import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { submitOpenPing, isFirebaseConfigured } from '@/lib/data/community';
import { track } from '@/lib/analytics';

interface Props {
  clinicId: string;
}

// "Şu an açık mı?" — kliniği az önce arayan / önünden geçen kullanıcının teyidi.
export function PingButton({ clinicId }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const ping = async (isOpen: boolean) => {
    if (state === 'sending' || state === 'sent') return;
    setState('sending');
    const ok = await submitOpenPing(clinicId, isOpen);
    track('open_ping_submitted', { clinic_id: clinicId, is_open: isOpen, saved: ok });
    setState(ok ? 'sent' : 'failed');
  };

  if (!isFirebaseConfigured) return null;

  if (state === 'sent') {
    return (
      <View className="bg-surface border border-border rounded-2xl p-4 items-center">
        <Text className="text-green-light text-sm font-semibold">Teşekkürler, başka pati sahiplerine yardım ettin.</Text>
      </View>
    );
  }

  return (
    <View className="bg-surface border border-border rounded-2xl p-4">
      <Text className="text-gray-label text-sm font-semibold mb-1 text-center">Bu klinik şu an açık mı?</Text>
      <Text className="text-gray-muted text-xs mb-3 text-center">Az önce aradıysan ya da oradaysan bildir.</Text>
      {state === 'sending' ? (
        <ActivityIndicator color="#ff7f1c" />
      ) : (
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={() => ping(true)} className="flex-1 bg-green-open/20 border border-green-open rounded-xl py-3 items-center">
            <Text className="text-green-light text-sm font-semibold">👍 Açık</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => ping(false)} className="flex-1 bg-red-sos/20 border border-red-sos rounded-xl py-3 items-center">
            <Text className="text-red-400 text-sm font-semibold">👎 Kapalı</Text>
          </TouchableOpacity>
        </View>
      )}
      {state === 'failed' && (
        <Text className="text-red-400 text-xs text-center mt-2">Gönderilemedi — internet bağlantını kontrol edip tekrar dene.</Text>
      )}
    </View>
  );
}
