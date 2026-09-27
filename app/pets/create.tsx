import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePets } from '@/lib/hooks/usePets';
import { getPet } from '@/lib/data/localStore';
import { track } from '@/lib/analytics';

const SPECIES = [
  { key: 'dog', label: '🐶 Köpek' },
  { key: 'cat', label: '🐱 Kedi' },
  { key: 'other', label: '🐾 Diğer' },
];

function Field({ label, value, onChange, placeholder, keyboardType, required, multiline }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'decimal-pad' | 'phone-pad';
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-1.5">
        {label}{required && ' *'}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#8e9196"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        className="bg-surface border border-border rounded-xl px-4 py-3 text-white text-base"
        style={multiline ? { textAlignVertical: 'top', minHeight: 80 } : undefined}
      />
    </View>
  );
}

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Acil kart oluştur / düzenle (?id= verilirse düzenleme)
export default function PetFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const { upsert } = usePets();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronic, setChronic] = useState('');
  const [medications, setMedications] = useState('');
  const [vaccine, setVaccine] = useState('');
  const [parasite, setParasite] = useState('');
  const [emergencyNote, setEmergencyNote] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPet(id).then((p) => {
      if (!p) return;
      setName(p.name);
      setSpecies(p.species ?? '');
      setBreed(p.breed ?? '');
      setAgeYears(p.age_years != null ? String(p.age_years) : '');
      setWeightKg(p.weight_kg != null ? String(p.weight_kg) : '');
      setAllergies(p.allergies ?? '');
      setChronic(p.chronic_conditions ?? '');
      setMedications(p.medications ?? '');
      setVaccine(p.last_vaccine_date ?? '');
      setParasite(p.last_parasite_date ?? '');
      setEmergencyNote(p.emergency_note ?? '');
      setOwnerName(p.owner_name ?? '');
      setOwnerPhone(p.owner_phone ?? '');
    });
  }, [id]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Eksik bilgi', 'Petinin adını yaz.');
      return;
    }
    setSaving(true);
    try {
      const pet = await upsert({
        ...(id ? { id } : {}),
        name: name.trim(),
        species: species || null,
        breed: breed.trim() || null,
        age_years: num(ageYears),
        weight_kg: num(weightKg),
        allergies: allergies.trim() || null,
        chronic_conditions: chronic.trim() || null,
        medications: medications.trim() || null,
        last_vaccine_date: vaccine.trim() || null,
        last_parasite_date: parasite.trim() || null,
        emergency_note: emergencyNote.trim() || null,
        owner_name: ownerName.trim() || null,
        owner_phone: ownerPhone.trim() || null,
      });
      if (!editing) track('pet_card_created', { pet_id: pet.id });
      router.back();
    } catch {
      Alert.alert('Kaydedilemedi', 'Telefonunda yer kalmamış olabilir. Tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-6 pb-12">
            <View className="flex-row items-center justify-between mb-2">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-gray-text text-base">✕ İptal</Text>
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold">{editing ? 'Kartı Düzenle' : 'Acil Kart Oluştur'}</Text>
              <TouchableOpacity onPress={save} disabled={saving}>
                <Text className={`text-base font-bold ${saving ? 'text-gray-muted' : 'text-orange-accent'}`}>
                  {saving ? '…' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-muted text-sm mb-6 leading-relaxed">
              Acil anında veterinere söylemen gerekenler burada durur ve Acil Mod'da otomatik gösterilir.
              Bilgiler sadece telefonunda saklanır.
            </Text>

            <Field label="Adı" value={name} onChange={setName} placeholder="Örn. Boncuk" required />

            <View className="mb-4">
              <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-1.5">Tür</Text>
              <View className="flex-row gap-2">
                {SPECIES.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSpecies(s.key)}
                    className={`flex-1 border rounded-xl py-3 items-center ${species === s.key ? 'border-orange-accent bg-orange-accent/10' : 'border-border bg-surface'}`}
                  >
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

            <Text className="text-gray-muted text-xs uppercase tracking-wide font-bold mb-3 mt-2">Sağlık (isteğe bağlı)</Text>
            <Field label="Alerji" value={allergies} onChange={setAllergies} placeholder="Örn. Penisilin, tavuk" />
            <Field label="Kronik hastalık" value={chronic} onChange={setChronic} placeholder="Örn. Diyabet, kalp yetmezliği" />
            <Field label="Kullandığı ilaçlar" value={medications} onChange={setMedications} placeholder="Örn. İnsülin 2 ü/gün" multiline />
            <View className="flex-row gap-3">
              <View className="flex-1"><Field label="Son aşı" value={vaccine} onChange={setVaccine} placeholder="Mart 2026" /></View>
              <View className="flex-1"><Field label="Son parazit" value={parasite} onChange={setParasite} placeholder="Ağustos 2026" /></View>
            </View>
            <Field label="Acil not" value={emergencyNote} onChange={setEmergencyNote} placeholder="Kliniğe söylenmesi gereken özel durum…" multiline />

            <Text className="text-gray-muted text-xs uppercase tracking-wide font-bold mb-3 mt-2">Sahip</Text>
            <Field label="Adın" value={ownerName} onChange={setOwnerName} placeholder="Adın" />
            <Field label="Telefonun" value={ownerPhone} onChange={setOwnerPhone} placeholder="05xx xxx xx xx" keyboardType="phone-pad" />

            <TouchableOpacity
              onPress={save}
              disabled={saving}
              className="rounded-2xl py-4 items-center mt-2"
              style={{ backgroundColor: '#ff7f1c', opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-white font-bold text-base">{editing ? 'Değişiklikleri kaydet' : 'Kartı kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
