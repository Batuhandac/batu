import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

const REPORT_TYPES = [
  { key: 'wrong_hours', label: 'Yanlış saatler' },
  { key: 'closed_permanently', label: 'Kalıcı kapalı' },
  { key: 'wrong_phone', label: 'Yanlış telefon' },
  { key: 'not_emergency', label: 'Acil kabul etmiyor' },
  { key: 'other', label: 'Diğer' },
];

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [type, setType] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!type) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('clinic_reports').insert({ clinic_id: id, user_id: user?.id ?? null, report_type: type, detail: detail.trim() || null });
    await track('report_submitted', { clinic_id: id });
    Alert.alert('Teşekkürler', 'Bildiriminiz alındı, inceliyeceğiz.', [{ text: 'Tamam', onPress: () => router.back() }]);
    setSubmitting(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-gray-text text-base">✕ Kapat</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-2">Hatalı Bilgi Bildir</Text>
        <Text className="text-gray-text text-sm mb-6">Ne sorun var?</Text>

        {REPORT_TYPES.map(r => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setType(r.key)}
            className={`border rounded-2xl px-5 py-4 mb-3 flex-row items-center gap-3 ${type === r.key ? 'border-red-sos bg-red-sos/10' : 'border-border bg-surface'}`}
          >
            <View className={`w-5 h-5 rounded-full border-2 ${type === r.key ? 'border-red-sos bg-red-sos' : 'border-gray-muted'}`} />
            <Text className="text-white">{r.label}</Text>
          </TouchableOpacity>
        ))}

        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="Ek bilgi (isteğe bağlı)…"
          placeholderTextColor="#718096"
          multiline
          numberOfLines={3}
          className="bg-surface border border-border rounded-2xl px-4 py-3 text-white mt-2 text-base"
          style={{ textAlignVertical: 'top', minHeight: 80 }}
        />

        <TouchableOpacity
          onPress={submit}
          disabled={!type || submitting}
          className={`rounded-2xl py-4 items-center mt-6 ${!type || submitting ? 'bg-surface opacity-50' : 'bg-red-sos'}`}
        >
          <Text className="text-white font-bold text-base">{submitting ? 'Gönderiliyor…' : 'Gönder'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
