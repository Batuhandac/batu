import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Sheet, Text, Button, Icon } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { submitCallFeedback } from '@/lib/data/community';
import { track } from '@/lib/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

type Step = 'phone' | 'emergency' | 'sending' | 'done' | 'failed';

// Aramadan ~10 dk sonra gelen bildirime dokununca açılır: "Telefonu açtılar mı?"
export function FeedbackModal({ visible, onClose, clinicId, clinicName }: Props) {
  const t = useTheme();
  const [step, setStep] = useState<Step>('phone');
  const [phoneAnswered, setPhoneAnswered] = useState<boolean | null>(null);

  const send = async (answered: boolean, acceptedEmergency: boolean | null) => {
    setStep('sending');
    const ok = await submitCallFeedback({ clinic_id: clinicId, phone_answered: answered, accepted_emergency: acceptedEmergency });
    track('feedback_submitted', { clinic_id: clinicId, saved: ok });
    setStep(ok ? 'done' : 'failed');
  };

  const reset = () => {
    setStep('phone');
    setPhoneAnswered(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={reset} title={clinicName}>
      <View style={{ paddingHorizontal: 20 }}>
        {step === 'phone' && (
          <>
            <Text variant="headline" style={{ marginBottom: 16 }}>
              Aradığında telefona çıktılar mı?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Evet" icon="checkmark" style={{ flex: 1 }} onPress={() => { setPhoneAnswered(true); setStep('emergency'); }} />
              <Button title="Hayır" icon="close" variant="secondary" style={{ flex: 1 }} onPress={() => send(false, null)} />
            </View>
          </>
        )}
        {step === 'emergency' && (
          <>
            <Text variant="headline" style={{ marginBottom: 16 }}>
              Acil hastayı kabul ettiler mi?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Evet" icon="checkmark" style={{ flex: 1 }} onPress={() => send(phoneAnswered ?? true, true)} />
              <Button title="Hayır" icon="close" variant="secondary" style={{ flex: 1 }} onPress={() => send(phoneAnswered ?? true, false)} />
            </View>
          </>
        )}
        {step === 'sending' && <ActivityIndicator color={t.primary} style={{ marginVertical: 28 }} />}
        {(step === 'done' || step === 'failed') && (
          <View style={{ alignItems: 'center' }}>
            <Icon name={step === 'done' ? 'checkmark-circle-outline' : 'cloud-offline-outline'} size={48} color={step === 'done' ? t.primary : t.textSubtle} />
            <Text variant="headline" center style={{ marginTop: 12 }}>
              {step === 'done' ? 'Teşekkürler' : 'Gönderilemedi'}
            </Text>
            <Text variant="callout" tone="muted" center style={{ marginTop: 4, marginBottom: 18 }}>
              {step === 'done'
                ? 'Cevabın, bir sonraki acilde başka bir pati sahibinin doğru kliniği bulmasına yardım edecek. Umarız dostun iyidir.'
                : 'İnternet bağlantını kontrol edip daha sonra tekrar deneyebilirsin.'}
            </Text>
            <Button title="Kapat" variant="secondary" full onPress={reset} />
          </View>
        )}
        {(step === 'phone' || step === 'emergency') && (
          <Button title="Şimdi değil" variant="ghost" onPress={reset} style={{ marginTop: 8, alignSelf: 'center' }} />
        )}
      </View>
    </Sheet>
  );
}
