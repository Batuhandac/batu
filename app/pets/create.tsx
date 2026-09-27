import React, { useEffect, useState } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header, Text, Field, Segmented, Button, DateField, SwitchRow, IconBadge } from '@/components/ds';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { usePets } from '@/lib/hooks/usePets';
import { getPet } from '@/lib/data/localStore';
import { savePetPhoto } from '@/lib/data/petPhoto';
import { useTheme } from '@/lib/theme';
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
  const [photo, setPhoto] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [sex, setSex] = useState<'female' | 'male' | null>(null);
  const [neutered, setNeutered] = useState(false);
  const [chipNo, setChipNo] = useState('');
  const t = useTheme();

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Galeri izni gerekli', 'Fotoğraf eklemek için Ayarlar’dan galeri erişimine izin ver.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0].uri);
  };

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
      setPhoto(p.photo_uri ?? null);
      setBirthDate(p.birth_date ?? null);
      setSex(p.sex ?? null);
      setNeutered(!!p.neutered);
      setChipNo(p.chip_no ?? '');
    });
  }, [id]);

  const save = async () => {
    if (!name.trim()) {
      setNameError('Dostunun adını yaz.');
      return;
    }
    setSaving(true);
    try {
      const existing = id ? await getPet(id) : null;
      const photoUri = photo && photo !== existing?.photo_uri ? await savePetPhoto(photo, id ?? 'new') : photo;
      if (photoUri && photoUri !== existing?.photo_uri) track('pet_photo_added');
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
        photo_uri: photoUri,
        birth_date: birthDate,
        sex,
        neutered: sex ? neutered : null,
        chip_no: chipNo.trim() || null,
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
            title={editing ? 'Profili düzenle' : 'Dost ekle'}
            subtitle="Profil, bakım takvimi ve acil kart için. Bilgiler yalnızca telefonunda saklanır."
            onBack={() => router.back()}
          />
          <View style={{ paddingHorizontal: 20 }}>
            <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Fotoğraf seç" style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 20 }}>
              {photo || name.trim() ? (
                <PetAvatar pet={{ name: name.trim() || ' ', photo_uri: photo }} size={96} />
              ) : (
                <IconBadge name="camera-outline" size={96} color={t.textSubtle} background={t.surfaceAlt} />
              )}
              <Text variant="callout" tone="primary" style={{ marginTop: 8 }}>
                {photo ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
              </Text>
            </Pressable>
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
            <DateField
              label="Doğum tarihi (biliyorsan)"
              value={birthDate}
              onChange={setBirthDate}
              maximumToday
              optional
              hint="Yaşını otomatik hesaplar, doğum gününü hatırlatırız."
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {!birthDate ? (
                <View style={{ flex: 1 }}>
                  <Field label="Yaşı (yaklaşık)" value={ageYears} onChangeText={setAgeYears} placeholder="3" keyboardType="decimal-pad" />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Field label="Kilosu (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="25" keyboardType="decimal-pad" />
              </View>
            </View>
            <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
              Cinsiyeti
            </Text>
            <Segmented
              value={sex}
              onChange={setSex}
              options={[
                { key: 'female', label: 'Dişi' },
                { key: 'male', label: 'Erkek' },
              ]}
            />
            {sex ? <SwitchRow label="Kısırlaştırıldı" value={neutered} onValueChange={setNeutered} /> : null}
            <Field label="Çip numarası" value={chipNo} onChangeText={setChipNo} placeholder="15 haneli numara" keyboardType="number-pad" maxLength={20} hint="Kaybolursa bulan kişi ya da klinik seni bununla bulur." />

            <Text variant="overline" tone="muted" style={{ marginTop: 8, marginBottom: 12 }}>
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

            <Text variant="overline" tone="muted" style={{ marginTop: 8, marginBottom: 12 }}>
              Sahibi
            </Text>
            <Field label="Adın" value={ownerName} onChangeText={setOwnerName} placeholder="Adın soyadın" />
            <Field label="Telefonun" value={ownerPhone} onChangeText={setOwnerPhone} placeholder="05xx xxx xx xx" keyboardType="phone-pad" />

            <Button title={editing ? 'Değişiklikleri kaydet' : 'Kaydet'} size="lg" full loading={saving} onPress={save} style={{ marginTop: 8 }} />
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </Screen>
  );
}
