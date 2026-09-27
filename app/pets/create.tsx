import React, { useEffect, useState } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Header, Text, Field, Segmented, Button } from '@/components/ds';
import { usePets } from '@/lib/hooks/usePets';
import { getPet } from '@/lib/data/localStore';
import { track } from '@/lib/analytics';

type Species = 'dog' | 'cat' | 'other';

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
  const [species, setSpecies] = useState<Species | null>(null);
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
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    if (!id) return;
    getPet(id).then((p) => {
      if (!p) return;
      setName(p.name);
      setSpecies((p.species as Species) ?? null);
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
      setNameError('Dostunun adını yaz.');
      return;
    }
    setSaving(true);
    try {
      const pet = await upsert({
        ...(id ? { id } : {}),
        name: name.trim(),
        species,
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
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Screen scroll edges={[]}>
          <Header
            title={editing ? 'Kartı düzenle' : 'Acil kart oluştur'}
            subtitle="Acil anında veterinere söylemen gerekenler burada durur ve Acil Mod'da otomatik gösterilir. Bilgiler yalnızca telefonunda saklanır."
            onBack={() => router.back()}
          />
          <View style={{ paddingHorizontal: 20 }}>
            <Field
              label="Adı"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setNameError(undefined);
              }}
              placeholder="Örn. Boncuk"
              error={nameError}
              maxLength={40}
            />
            <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
              Türü
            </Text>
            <Segmented<Species>
              value={species}
              onChange={setSpecies}
              options={[
                { key: 'dog', label: 'Köpek' },
                { key: 'cat', label: 'Kedi' },
                { key: 'other', label: 'Diğer' },
              ]}
            />
            <Field label="Irkı" value={breed} onChangeText={setBreed} placeholder="Örn. Golden Retriever" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Yaşı" value={ageYears} onChangeText={setAgeYears} placeholder="3" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Kilosu (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="25" keyboardType="decimal-pad" />
              </View>
            </View>

            <Text variant="overline" tone="subtle" style={{ marginTop: 8, marginBottom: 12 }}>
              Sağlık bilgileri · isteğe bağlı
            </Text>
            <Field label="Alerjileri" value={allergies} onChangeText={setAllergies} placeholder="Örn. Penisilin, tavuk" />
            <Field label="Kullandığı ilaçlar" value={medications} onChangeText={setMedications} placeholder="Örn. İnsülin, günde 2 ünite" multiline />
            <Field label="Kronik hastalık" value={chronic} onChangeText={setChronic} placeholder="Örn. Diyabet, kalp üfürümü" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Son aşı" value={vaccine} onChangeText={setVaccine} placeholder="Mart 2026" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Son parazit" value={parasite} onChangeText={setParasite} placeholder="Ağustos 2026" />
              </View>
            </View>
            <Field label="Acil not" value={emergencyNote} onChangeText={setEmergencyNote} placeholder="Kliniğe mutlaka söylenmesi gereken bir durum" multiline />

            <Text variant="overline" tone="subtle" style={{ marginTop: 8, marginBottom: 12 }}>
              Sahibi
            </Text>
            <Field label="Adın" value={ownerName} onChangeText={setOwnerName} placeholder="Adın soyadın" />
            <Field label="Telefonun" value={ownerPhone} onChangeText={setOwnerPhone} placeholder="05xx xxx xx xx" keyboardType="phone-pad" />

            <Button title={editing ? 'Değişiklikleri kaydet' : 'Kartı kaydet'} size="lg" full loading={saving} onPress={save} style={{ marginTop: 8 }} />
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </Screen>
  );
}
