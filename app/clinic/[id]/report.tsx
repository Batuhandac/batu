import React, { useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Header, Text, Field, Button, Icon } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { submitClinicReport, isFirebaseConfigured } from '@/lib/data/community';
import { getRegisteredClinic } from '@/lib/data/registry';
import { track } from '@/lib/analytics';

const REPORT_TYPES = [
  { key: 'missing_phone', label: 'Telefon eksik, numarasını biliyorum' },
  { key: 'wrong_phone', label: 'Telefon yanlış ya da ulaşılamıyor' },
  { key: 'wrong_hours', label: 'Çalışma saatleri yanlış' },
  { key: 'not_emergency', label: 'Acil hasta kabul etmiyor' },
  { key: 'wrong_location', label: 'Konum ya da adres yanlış' },
  { key: 'closed_permanently', label: 'Kalıcı olarak kapandı' },
  { key: 'other', label: 'Başka bir sorun' },
];

export default function ReportScreen() {
  const t = useTheme();
  const { id, type: initialType } = useLocalSearchParams<{ id: string; type?: string }>();
  const [type, setType] = useState<string | null>(initialType ?? null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const needsPhone = type === 'missing_phone' || type === 'wrong_phone';

  const submit = async () => {
    if (!type) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Şu an gönderilemiyor', 'Bildirim sistemi henüz etkin değil.');
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
    Alert.alert('Teşekkürler', 'Bildirimin bize ulaştı. Kontrol edip düzelteceğiz.', [{ text: 'Tamam', onPress: () => router.back() }]);
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Bilgiyi düzelt" subtitle="Doğru bilgi, acildeki birinin boşuna yola çıkmamasını sağlar. Ne yanlış?" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {REPORT_TYPES.map((r) => {
            const on = type === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setType(r.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: radius.lg,
                  backgroundColor: t.surface,
                }}
              >
                <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? t.primary : t.textSubtle} />
                <Text variant="body" style={{ flex: 1 }}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Field
          label={needsPhone ? 'Doğru telefon numarası' : 'Doğrusu nedir? (isteğe bağlı)'}
          value={detail}
          onChangeText={setDetail}
          placeholder={needsPhone ? '0312 123 45 67' : 'Kısaca yaz'}
          keyboardType={needsPhone ? 'phone-pad' : 'default'}
          multiline={!needsPhone}
          maxLength={500}
        />
        <Button title="Gönder" size="lg" full disabled={!type} loading={submitting} onPress={submit} />
      </View>
    </Screen>
  );
}
