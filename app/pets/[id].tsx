import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPet, removePet } from '@/lib/data/localStore';
import { sharePetCard, shareViaWhatsApp, buildPetCardText } from '@/lib/utils/share';
import { track } from '@/lib/analytics';
import type { Pet } from '@/types';

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View className="mb-3">
      <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide">{label}</Text>
      <Text className="text-white text-sm mt-0.5">{value}</Text>
    </View>
  );
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);

  useEffect(() => { loadPet(); }, [id]);

  const loadPet = async () => {
    const data = await getPet(id);
    if (data) setPet(data);
  };

  const handleDelete = () => {
    Alert.alert('Sil', 'Bu pet kartı silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await removePet(id);
          router.back();
        }
      },
    ]);
  };

  const handleShare = async () => {
    if (!pet) return;
    if (!pet.name) { Alert.alert('Önce kartı doldur'); return; }
    await track('pet_card_shared', { pet_id: id });
    await sharePetCard(pet);
  };

  const handleWhatsApp = async () => {
    if (!pet) return;
    await track('pet_card_shared', { pet_id: id, via: 'whatsapp' });
    await shareViaWhatsApp(pet);
  };

  if (!pet) return null;

  const emoji = pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-12">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-gray-text text-base">‹ Geri</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Text className="text-red-400 text-sm">Sil</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-6">
            <Text className="text-6xl mb-3">{emoji}</Text>
            <Text className="text-white text-2xl font-bold">{pet.name}</Text>
            {(pet.species || pet.breed) && (
              <Text className="text-gray-text mt-1">{[pet.species, pet.breed].filter(Boolean).join(' · ')}</Text>
            )}
          </View>

          <View className="bg-card border border-border rounded-2xl p-5 mb-4">
            <InfoRow label="Yaş" value={pet.age_years ? `${pet.age_years} yaş` : null} />
            <InfoRow label="Kilo" value={pet.weight_kg ? `${pet.weight_kg} kg` : null} />
            <InfoRow label="Alerji" value={pet.allergies} />
            <InfoRow label="Kronik Hastalık" value={pet.chronic_conditions} />
            <InfoRow label="İlaçlar" value={pet.medications} />
            <InfoRow label="Son Aşı" value={pet.last_vaccine_date} />
            <InfoRow label="Son Parazit" value={pet.last_parasite_date} />
            {pet.emergency_note && (
              <View className="mt-2 bg-yellow-900/30 border border-yellow-700/40 rounded-xl p-3">
                <Text className="text-yellow-300 text-xs font-bold mb-1">⚠️ ACİL NOT</Text>
                <Text className="text-yellow-100 text-sm">{pet.emergency_note}</Text>
              </View>
            )}
          </View>

          {(pet.owner_name || pet.owner_phone) && (
            <View className="bg-card border border-border rounded-2xl p-5 mb-4">
              <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-2">Sahip</Text>
              <InfoRow label="Ad" value={pet.owner_name} />
              <InfoRow label="Telefon" value={pet.owner_phone} />
            </View>
          )}

          <View className="gap-3 mt-2">
            <TouchableOpacity onPress={handleWhatsApp} className="bg-green-800/60 border border-green-700 rounded-2xl py-4 items-center">
              <Text className="text-white font-bold text-base">💬 WhatsApp ile Paylaş</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} className="bg-card border border-border rounded-2xl py-4 items-center">
              <Text className="text-white font-semibold text-base">📤 SMS / Diğer</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4 bg-surface border border-border rounded-2xl p-4">
            <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-2">Önizleme</Text>
            <Text className="text-gray-text text-xs leading-relaxed font-mono">{buildPetCardText(pet)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
