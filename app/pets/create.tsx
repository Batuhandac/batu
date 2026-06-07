import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePets } from '@/lib/hooks/usePets';
import { track } from '@/lib/analytics';

const SPECIES = [{ key: 'dog', label: '🐶 Köpek' }, { key: 'cat', label: '🐱 Kedi' }, { key: 'other', label: '🐾 Diğer' }];

function Field({ label, value, onChange, placeholder, keyboardType, required, multiline }: any) {
  return (
    <View className="mb-4">
      <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-1.5">
        {label}{required && ' *'}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#718096"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        className="bg-surface border border-border rounded-xl px-4 py-3 text-white text-base"
        style={multiline ? { textAlignVertical: 'top', minHeight: 80 } : undefined}
      />
    </View>
  );
}

export default function CreatePetScreen() {
  const { upsert } = usePets();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronic, setChronic] = useState('');
  const [medications, setMedications] = useState('');
  const [emergencyNote, setEmergencyNote] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Hata', 'Pet adı zorunlu.'); return; }
    setSaving(true);
    const pet = await upsert({
      name: name.trim(), species: species || null, breed: breed || null,
      age_years: ageYears ? parseFloat(ageYears) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      allergies: allergies || null, chronic_conditions: chronic || null,
      medications: medications || null, emergency_note: emergencyNote || null,
      owner_name: ownerName || null, owner_phone: ownerPhone || null,
      is_primary: false,
    });
    if (pet) {
      await track('pet_card_created', { pet_id: pet.id });
      router.back();
    } else {
      Alert.alert('Hata', 'Pet kaydedilemedi. Lütfen giriş yap.');
    }
    setSaving(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-12">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-gray-text text-base">✕ İptal</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Acil Kart Oluştur</Text>
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text className={`text-base font-bold ${saving ? 'text-gray-muted' : 'text-red-sos'}`}>
                {saving ? '…' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>

          <Field label="Pet Adı" value={name} onChange={setName} placeholder="Örn. Boncuk" required />

          <View className="mb-4">
            <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-1.5">Tür</Text>
            <View className="flex-row gap-2">
              {SPECIES.map(s => (
                <TouchableOpacity key={s.key} onPress={() => setSpecies(s.key)} className={`flex-1 border rounded-xl py-3 items-center ${species === s.key ? 'border-red-sos bg-red-sos/10' : 'border-border bg-surface'}`}>
                  <Text className="text-white text-sm">{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label="Irk" value={breed} onChange={setBreed} placeholder="Örn. Golden Retriever" />
          <View className="flex-row gap-3">
            <View className="flex-1"><Field label="Yaş" value={ageYears} onChange={setAgeYears} placeholder="3" keyboardType="decimal-pad" /></View>
            <View className="flex-1"><Field label="Kilo (kg)" value={weightKg} onChange={setWeightKg} placeholder="25" keyboardType="decimal-pad" /></View>
          </View>

          <Text className="text-gray-muted text-xs uppercase tracking-wide font-bold mb-3 mt-2">Tıbbi Bilgi (isteğe bağlı)</Text>
          <Field label="Alerji" value={allergies} onChange={setAllergies} placeholder="Örn. Penisilin, tavuk" />
          <Field label="Kronik Hastalık" value={chronic} onChange={setChronic} placeholder="Örn. Diyabet" />
          <Field label="Kullandığı İlaçlar" value={medications} onChange={setMedications} placeholder="Örn. İnsülin 2 ü/gün" multiline />
          <Field label="Acil Not" value={emergencyNote} onChange={setEmergencyNote} placeholder="Kliniğe söylenmesi gereken özel durum…" multiline />

          <Text className="text-gray-muted text-xs uppercase tracking-wide font-bold mb-3 mt-2">Sahip Bilgisi</Text>
          <Field label="Sahip Adı" value={ownerName} onChange={setOwnerName} placeholder="Adınız" />
          <Field label="Telefon" value={ownerPhone} onChange={setOwnerPhone} placeholder="+90 5xx xxx xx xx" keyboardType="phone-pad" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
