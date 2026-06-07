import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

const ROLES = [
  { key: 'owner', label: 'Klinik sahibi' },
  { key: 'staff', label: 'Çalışan' },
];

export default function ClaimScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !role) return;
    setSubmitting(true);
    await supabase.from('clinic_claims').insert({ clinic_id: id, claimant_name: name.trim(), claimant_phone: phone.trim(), claimant_role: role, message: message.trim() || null });
    await track('claim_submitted', { clinic_id: id });
    Alert.alert('Talebiniz Alındı', 'Ekibimiz sizi inceleme sonrası arayacak.', [{ text: 'Tamam', onPress: () => router.back() }]);
    setSubmitting(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-gray-text text-base">✕ Kapat</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-6">Bu Klinik Benim</Text>

        <TextInput value={name} onChangeText={setName} placeholder="Ad Soyad *" placeholderTextColor="#718096" className="bg-surface border border-border rounded-2xl px-4 py-3 text-white mb-3 text-base" />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Telefon *" placeholderTextColor="#718096" keyboardType="phone-pad" className="bg-surface border border-border rounded-2xl px-4 py-3 text-white mb-3 text-base" />

        <View className="flex-row gap-3 mb-3">
          {ROLES.map(r => (
            <TouchableOpacity key={r.key} onPress={() => setRole(r.key)} className={`flex-1 border rounded-2xl py-3 items-center ${role === r.key ? 'border-red-sos bg-red-sos/10' : 'border-border bg-surface'}`}>
              <Text className="text-white text-sm">{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput value={message} onChangeText={setMessage} placeholder="Mesaj (isteğe bağlı)…" placeholderTextColor="#718096" multiline numberOfLines={3} className="bg-surface border border-border rounded-2xl px-4 py-3 text-white text-base" style={{ textAlignVertical: 'top', minHeight: 80 }} />

        <TouchableOpacity onPress={submit} disabled={!name.trim() || !phone.trim() || !role || submitting} className={`rounded-2xl py-4 items-center mt-6 ${!name.trim() || !phone.trim() || !role || submitting ? 'bg-surface opacity-50' : 'bg-red-sos'}`}>
          <Text className="text-white font-bold text-base">{submitting ? 'Gönderiliyor…' : 'Talep Gönder'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
