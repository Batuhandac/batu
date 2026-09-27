import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { submitCallFeedback } from '@/lib/data/community';
import { track } from '@/lib/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

type Step = 'phone' | 'emergency' | 'sending' | 'done' | 'failed';

// Aramadan ~10 dk sonra gelen bildirime dokununca açılır: "Telefonu açtı mı?"
export function FeedbackModal({ visible, onClose, clinicId, clinicName }: Props) {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl p-6 pb-10">
          {step === 'phone' && (
            <>
              <Text className="text-white text-lg font-bold text-center mb-1">{clinicName}</Text>
              <Text className="text-gray-text text-sm text-center mb-6">Aradığında telefonu açtılar mı?</Text>
              <View className="flex-row gap-3">
                <Choice label="Açtı" good onPress={() => { setPhoneAnswered(true); setStep('emergency'); }} />
                <Choice label="Açmadı" onPress={() => send(false, null)} />
              </View>
            </>
          )}
          {step === 'emergency' && (
            <>
              <Text className="text-white text-lg font-bold text-center mb-6">Acil hastayı kabul ettiler mi?</Text>
              <View className="flex-row gap-3">
                <Choice label="Evet" good onPress={() => send(phoneAnswered ?? true, true)} />
                <Choice label="Hayır" onPress={() => send(phoneAnswered ?? true, false)} />
              </View>
            </>
          )}
          {step === 'sending' && <ActivityIndicator color="#ff7f1c" className="my-8" />}
          {(step === 'done' || step === 'failed') && (
            <>
              <Text className={`text-xl font-bold text-center mb-2 ${step === 'done' ? 'text-green-light' : 'text-red-400'}`}>
                {step === 'done' ? 'Teşekkürler!' : 'Gönderilemedi'}
              </Text>
              <Text className="text-gray-text text-sm text-center mb-6">
                {step === 'done'
                  ? 'Cevabın, bir sonraki acilde başka bir pati sahibinin doğru kliniği bulmasına yardım edecek. Umarız dostun iyidir. 🐾'
                  : 'İnternet bağlantını kontrol edip daha sonra tekrar deneyebilirsin.'}
              </Text>
              <TouchableOpacity onPress={reset} className="bg-card border border-border rounded-2xl py-4 items-center">
                <Text className="text-white font-semibold">Kapat</Text>
              </TouchableOpacity>
            </>
          )}
          {(step === 'phone' || step === 'emergency') && (
            <TouchableOpacity onPress={reset} className="py-3 items-center mt-2">
              <Text className="text-gray-muted text-sm">Şimdi değil</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Choice({ label, good, onPress }: { label: string; good?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 rounded-2xl py-4 items-center border ${good ? 'bg-green-open/20 border-green-open' : 'bg-red-sos/20 border-red-sos'}`}
    >
      <Text className={`text-base font-semibold ${good ? 'text-green-light' : 'text-red-400'}`}>{label}</Text>
    </TouchableOpacity>
  );
}
