import React, { useState } from 'react';
import { View, Alert, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Screen, Header, Text, Field, Button, SwitchRow, Chip, Card } from '@/components/ds';
import { useTheme, radius, type } from '@/lib/theme';
import { useLocation } from '@/lib/hooks/useLocation';
import { submitCommunityClinic, isFirebaseConfigured } from '@/lib/data/community';
import { ANKARA_DISTRICTS } from '@/lib/utils/districts';
import { track } from '@/lib/analytics';
import type { DayHours } from '@/types';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function defaultHours(): DayHours[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    closed: weekday === 0, // Pazar varsayılan kapalı
    open: '09:00',
    close: '20:00',
  }));
}

export default function AddClinicScreen() {
  const t = useTheme();
  const { lat, lng } = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [is247, setIs247] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [hours, setHours] = useState<DayHours[]>(defaultHours());
  const [coord, setCoord] = useState<{ lat: number; lng: number }>({ lat: lat ?? 39.9334, lng: lng ?? 32.8597 });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const region: Region = { latitude: coord.lat, longitude: coord.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  const updateHour = (weekday: number, patch: Partial<DayHours>) =>
    setHours((hs) => hs.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));

  const save = async () => {
    if (!name.trim()) {
      setNameError('Kliniğin adını yaz.');
      return;
    }
    if (!isFirebaseConfigured) {
      Alert.alert('Şu an gönderilemiyor', 'Klinik ekleme henüz etkin değil.');
      return;
    }
    setSaving(true);
    const ok = await submitCommunityClinic({
      name: name.trim(),
      address: address.trim() || null,
      district,
      lat: coord.lat,
      lng: coord.lng,
      phone: phone.trim() || null,
      is_24_7: is247,
      accepts_emergency: emergency,
      hours,
    });
    setSaving(false);
    if (ok) {
      track('community_clinic_added');
      Alert.alert(
        'Teşekkürler',
        'Klinik bize ulaştı. Bilgileri kontrol ettikten sonra haritada görünecek. Acil anında yanlış numara gösterilmesin diye her kaydı kontrol ediyoruz.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Gönderilemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header
        title="Klinik ekle"
        subtitle="Bildiğin bir veteriner kliniğini ekle. Kontrol edildikten sonra yayınlanır ve acil anında başka pati sahiplerine yol gösterir."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <Field
          label="Klinik adı"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameError(undefined);
          }}
          placeholder="Örn. Pati Veteriner Kliniği"
          error={nameError}
          maxLength={120}
        />
        <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0312 xxx xx xx" maxLength={30} />
        <Field label="Adres" value={address} onChangeText={setAddress} placeholder="Mahalle, cadde, numara" maxLength={200} />

        <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
          İlçe
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ANKARA_DISTRICTS.map((d) => (
            <Chip
              key={d.name}
              label={d.name}
              active={district === d.name}
              onPress={() => {
                setDistrict(d.name);
                setCoord({ lat: d.lat, lng: d.lng });
              }}
            />
          ))}
        </View>

        <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
          Konum · haritaya dokunarak ya da iğneyi sürükleyerek işaretle
        </Text>
        <View style={{ height: 220, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
          <MapView
            style={{ flex: 1 }}
            region={region}
            userInterfaceStyle={t.dark ? 'dark' : 'light'}
            onPress={(e) => setCoord({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}
          >
            <Marker
              coordinate={{ latitude: coord.lat, longitude: coord.lng }}
              draggable
              onDragEnd={(e) => setCoord({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })}
              pinColor={t.primary}
            />
          </MapView>
        </View>

        <SwitchRow label="7/24 açık" value={is247} onValueChange={setIs247} />
        <SwitchRow label="Acil hasta kabul ediyor" value={emergency} onValueChange={setEmergency} />

        {!is247 && (
          <Card padded={false} style={{ marginBottom: 16 }}>
            <Text variant="bodyStrong" style={{ padding: 16, paddingBottom: 8 }}>
              Çalışma saatleri
            </Text>
            {WEEK_ORDER.map((wd) => {
              const h = hours.find((x) => x.weekday === wd)!;
              return (
                <View key={wd} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.border, gap: 8 }}>
                  <Text variant="callout" style={{ width: 88 }}>
                    {DAY_NAMES[wd]}
                  </Text>
                  {h.closed ? (
                    <Text variant="callout" tone="subtle" style={{ flex: 1 }}>
                      Kapalı
                    </Text>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
                      <TimeInput value={h.open} onChange={(v) => updateHour(wd, { open: v })} />
                      <Text variant="callout" tone="subtle">
                        –
                      </Text>
                      <TimeInput value={h.close} onChange={(v) => updateHour(wd, { close: v })} />
                    </View>
                  )}
                  <Switch
                    value={!h.closed}
                    onValueChange={(open) => updateHour(wd, { closed: !open })}
                    trackColor={{ true: t.primary, false: t.borderStrong }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </Card>
        )}

        <Button title="Kliniği gönder" size="lg" full loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="09:00"
      placeholderTextColor={t.textSubtle}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      style={[
        type.callout,
        {
          color: t.text,
          backgroundColor: t.surfaceAlt,
          borderRadius: radius.sm,
          paddingHorizontal: 8,
          paddingVertical: 6,
          width: 64,
          textAlign: 'center',
        },
      ]}
    />
  );
}
