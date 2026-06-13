import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useLocation } from '@/lib/hooks/useLocation';
import { submitCommunityClinic, isFirebaseConfigured } from '@/lib/data/community';
import { ANKARA_DISTRICTS } from '@/lib/utils/districts';
import { track } from '@/lib/analytics';
import type { DayHours } from '@/types';

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function defaultHours(): DayHours[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    closed: weekday === 0, // Pazar varsayılan kapalı
    open: '09:00',
    close: '20:00',
  }));
}

export default function AddClinicScreen() {
  const { lat, lng } = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [is247, setIs247] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [hours, setHours] = useState<DayHours[]>(defaultHours());
  const [coord, setCoord] = useState<{ lat: number; lng: number }>({
    lat: lat ?? 39.9334,
    lng: lng ?? 32.8597,
  });
  const [saving, setSaving] = useState(false);

  const region: Region = {
    latitude: coord.lat,
    longitude: coord.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const updateHour = (weekday: number, patch: Partial<DayHours>) => {
    setHours((hs) => hs.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  };

  const save = async () => {
    if (!name.trim()) { Alert.alert('Eksik bilgi', 'Klinik adı zorunlu.'); return; }
    if (!isFirebaseConfigured) {
      Alert.alert(
        'Yakında',
        'Klinik ekleme için sunucu bağlantısı henüz aktif değil. Çok yakında açılacak!'
      );
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
      await track('community_clinic_added');
      Alert.alert('Teşekkürler! 🎉', 'Klinik eklendi ve haritada görünmeye başlayacak.', [
        { text: 'Harika', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Gönderilemedi', 'Klinik kaydedilemedi. İnternet bağlantını kontrol et.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4 pb-12">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-gray-text text-base">✕ İptal</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-base">Klinik Ekle</Text>
            <View style={{ width: 50 }} />
          </View>

          <Text className="text-gray-muted text-sm mb-6 leading-relaxed">
            Bildiğin bir veteriner kliniğini ekle. Diğer pati sahipleri acil anında bu bilgiyle
            doğru yere ulaşacak. 🐾
          </Text>

          {/* Ad */}
          <Field label="Klinik Adı *">
            <TextInput
              value={name} onChangeText={setName}
              placeholder="Örn. Çankaya Acil Veteriner"
              placeholderTextColor="#718096"
              className="bg-card border border-border rounded-2xl px-4 py-3 text-white"
            />
          </Field>

          {/* Telefon */}
          <Field label="Telefon">
            <TextInput
              value={phone} onChangeText={setPhone}
              placeholder="+90 312 ..." keyboardType="phone-pad"
              placeholderTextColor="#718096"
              className="bg-card border border-border rounded-2xl px-4 py-3 text-white"
            />
          </Field>

          {/* Adres */}
          <Field label="Adres">
            <TextInput
              value={address} onChangeText={setAddress}
              placeholder="Mahalle, cadde, no"
              placeholderTextColor="#718096"
              className="bg-card border border-border rounded-2xl px-4 py-3 text-white"
            />
          </Field>

          {/* İlçe */}
          <Field label="İlçe">
            <View className="flex-row flex-wrap gap-2">
              {ANKARA_DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d.name}
                  onPress={() => { setDistrict(d.name); setCoord({ lat: d.lat, lng: d.lng }); }}
                  className={`rounded-full px-3.5 py-1.5 border ${district === d.name ? 'bg-red-sos border-red-sos' : 'bg-card border-border'}`}
                >
                  <Text className={`text-sm ${district === d.name ? 'text-white font-semibold' : 'text-gray-text'}`}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Konum seçici */}
          <Field label="Konum — haritaya dokunarak işaretle">
            <View className="rounded-2xl overflow-hidden border border-border" style={{ height: 220 }}>
              <MapView
                style={{ flex: 1 }}
                region={region}
                userInterfaceStyle="dark"
                onPress={(e) =>
                  setCoord({
                    lat: e.nativeEvent.coordinate.latitude,
                    lng: e.nativeEvent.coordinate.longitude,
                  })
                }
              >
                <Marker
                  coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                  draggable
                  onDragEnd={(e) =>
                    setCoord({
                      lat: e.nativeEvent.coordinate.latitude,
                      lng: e.nativeEvent.coordinate.longitude,
                    })
                  }
                  pinColor="#E53E3E"
                />
              </MapView>
            </View>
            <Text className="text-gray-muted text-xs mt-1.5">
              📍 {coord.lat.toFixed(4)}, {coord.lng.toFixed(4)}
            </Text>
          </Field>

          {/* Toggle'lar */}
          <ToggleRow label="7/24 açık" value={is247} onChange={setIs247} />
          <ToggleRow label="Acil kabul ediyor" value={emergency} onChange={setEmergency} />

          {/* Çalışma saatleri */}
          {!is247 && (
            <Field label="Çalışma Saatleri">
              <View className="bg-card border border-border rounded-2xl px-4 py-2">
                {hours.map((h) => (
                  <View key={h.weekday} className="flex-row items-center py-2 border-b border-border/50">
                    <Text className="text-white text-sm w-24">{DAY_NAMES[h.weekday]}</Text>
                    {h.closed ? (
                      <Text className="text-gray-muted text-sm flex-1">Kapalı</Text>
                    ) : (
                      <View className="flex-row items-center flex-1 gap-2">
                        <TimeInput value={h.open} onChange={(v) => updateHour(h.weekday, { open: v })} />
                        <Text className="text-gray-muted">–</Text>
                        <TimeInput value={h.close} onChange={(v) => updateHour(h.weekday, { close: v })} />
                      </View>
                    )}
                    <Switch
                      value={!h.closed}
                      onValueChange={(open) => updateHour(h.weekday, { closed: !open })}
                      trackColor={{ false: '#243B55', true: '#38A169' }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            </Field>
          )}

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            className={`bg-red-sos rounded-2xl py-4 items-center mt-4 ${saving ? 'opacity-50' : ''}`}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Kliniği Ekle</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-gray-muted text-xs font-bold uppercase tracking-wide mb-2">{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between bg-card border border-border rounded-2xl px-4 py-3.5 mb-3">
      <Text className="text-white text-base">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#243B55', true: '#E53E3E' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="09:00"
      placeholderTextColor="#718096"
      maxLength={5}
      keyboardType="numbers-and-punctuation"
      className="bg-surface border border-border rounded-lg px-2 py-1 text-white text-sm text-center"
      style={{ width: 56 }}
    />
  );
}
