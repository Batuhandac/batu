import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { submitClinicReport, isFirebaseConfigured } from '@/lib/data/community';
import { getRegisteredClinic } from '@/lib/data/registry';
import { track } from '@/lib/analytics';

const REPORT_TYPES = [
  { key: 'missing_phone', label: 'Telefon eksik — numarasını biliyorum' },
  { key: 'wrong_phone', label: 'Telefon yanlış / ulaşılamıyor' },
  { key: 'wrong_hours', label: 'Çalışma saatleri yanlış' },
  { key: 'not_emergency', label: 'Acil hasta kabul etmiyor' },
  { key: 'wrong_location', label: 'Konum / adres yanlış' },
  { key: 'closed_permanently', label: 'Kalıcı olarak kapandı' },
  { key: 'other', label: 'Diğer' },
];

export default function ReportScreen() {
  const { id, type: initialType } = useLocalSearchParams<{ id: string; type?: string }>();
  const [type, setType] = useState<string | null>(initialType ?? null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const needsPhone = type === 'missing_phone' || type === 'wrong_phone';

  const submit = async () => {
    if (!type) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Şu an gönderilemiyor', 'Bildirim sistemi henüz aktif değil.');
      return;
    }
    setSubmitting(true);
    const ok = await submitClinicReport({
      clinic_id: id,
      clinic_name: getRegisteredClinic(id)?.name ?? null,
      report_type: type,
      detail: detail.trim() || null,
    });
    setSubmitting(false);
    if (!ok) {
      Alert.alert('Gönderilemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
      return;
    }
    track('report_submitted', { clinic_id: id, type });
    Alert.alert('Teşekkürler 🐾', 'Bildirimin bize ulaştı. Kontrol edip düzelteceğiz.', [
      { text: 'Tamam', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-gray-text text-base">✕ Kapat</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-2">Bilgiyi düzelt</Text>
        <Text className="text-gray-text text-sm mb-6 leading-relaxed">
          Doğru bilgi, acildeki birinin boşuna yola çıkmamasını sağlar. Ne yanlış?
        </Text>

        {REPORT_TYPES.map((r) => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setType(r.key)}
            className={`border rounded-2xl px-5 py-4 mb-3 flex-row items-center gap-3 ${type === r.key ? 'border-orange-accent bg-orange-accent/10' : 'border-border bg-surface'}`}
          >
            <View className={`w-5 h-5 rounded-full border-2 ${type === r.key ? 'border-orange-accent bg-orange-accent' : 'border-gray-muted'}`} />
            <Text className="text-white flex-1">{r.label}</Text>
          </TouchableOpacity>
        ))}

        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder={needsPhone ? 'Doğru telefon numarası (ör. 0312 123 45 67)' : 'Doğrusu nedir? (isteğe bağlı)'}
          placeholderTextColor="#8e9196"
          keyboardType={needsPhone ? 'phone-pad' : 'default'}
          multiline={!needsPhone}
          maxLength={500}
          className="bg-surface border border-border rounded-2xl px-4 py-3 text-white mt-2 text-base"
          style={needsPhone ? undefined : { textAlignVertical: 'top', minHeight: 80 }}
        />

        <TouchableOpacity
          onPress={submit}
          disabled={!type || submitting}
          className={`rounded-2xl py-4 items-center mt-6 ${!type || submitting ? 'bg-surface opacity-50' : 'bg-orange-accent'}`}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Gönder</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
