import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

type Step = 'phone' | 'emergency' | 'done';

export function FeedbackModal({ visible, onClose, clinicId, clinicName }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneAnswered, setPhoneAnswered] = useState<boolean | null>(null);

  const submitFeedback = async (acceptedEmergency: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('clinic_feedback').insert({
      clinic_id: clinicId,
      user_id: user?.id ?? null,
      phone_answered: phoneAnswered,
      accepted_emergency: acceptedEmergency,
    });
    await track('feedback_submitted', { clinic_id: clinicId });
    setStep('done');
  };

  const reset = () => { setStep('phone'); setPhoneAnswered(null); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface rounded-t-3xl p-6 pb-10">
          {step === 'phone' && (
            <>
              <Text className="text-white text-lg font-bold text-center mb-2">{clinicName}</Text>
              <Text className="text-gray-text text-sm text-center mb-6">Telefonu açtı mı?</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => { setPhoneAnswered(true); setStep('emergency'); }} className="flex-1 bg-green-open/20 border border-green-open rounded-2xl py-4 items-center">
                  <Text className="text-green-light text-2xl">👍</Text>
                  <Text className="text-green-light text-xs mt-1">Açtı</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setPhoneAnswered(false); setStep('emergency'); }} className="flex-1 bg-red-sos/20 border border-red-sos rounded-2xl py-4 items-center">
                  <Text className="text-red-400 text-2xl">👎</Text>
                  <Text className="text-red-400 text-xs mt-1">Açmadı</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {step === 'emergency' && (
            <>
              <Text className="text-white text-lg font-bold text-center mb-2">Acil kabul etti mi?</Text>
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity onPress={() => submitFeedback(true)} className="flex-1 bg-green-open/20 border border-green-open rounded-2xl py-4 items-center">
                  <Text className="text-green-light text-2xl">👍</Text>
                  <Text className="text-green-light text-xs mt-1">Evet</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => submitFeedback(false)} className="flex-1 bg-red-sos/20 border border-red-sos rounded-2xl py-4 items-center">
                  <Text className="text-red-400 text-2xl">👎</Text>
                  <Text className="text-red-400 text-xs mt-1">Hayır</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {step === 'done' && (
            <>
              <Text className="text-green-light text-xl font-bold text-center mb-2">Teşekkürler!</Text>
              <Text className="text-gray-text text-sm text-center mb-6">Geribildiriminiz diğer evcil hayvan sahiplerine yardımcı olacak.</Text>
              <TouchableOpacity onPress={reset} className="bg-card border border-border rounded-2xl py-4 items-center">
                <Text className="text-white font-semibold">Kapat</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
