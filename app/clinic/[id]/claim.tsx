import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { submitClinicClaim, isFirebaseConfigured } from '@/lib/data/community';
import { getRegisteredClinic } from '@/lib/data/registry';
import { getClinicById } from '@/lib/data/query';
import { track } from '@/lib/analytics';

const ROLES = [
  { key: 'vet', label: 'Veteriner hekim' },
  { key: 'owner', label: 'Klinik sahibi' },
  { key: 'staff', label: 'Çalışan' },
] as const;

export const CLINIC_SERVICES = [
  'Kedi',
  'Köpek',
  'Egzotik hayvan',
  'Kuş',
  'Cerrahi',
  'Röntgen / Ultrason',
  'Laboratuvar',
  'Yoğun bakım',
  'Evde muayene',
];

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  phone?: boolean;
  multiline?: boolean;
  email?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-1.5">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor="#8e9196"
        keyboardType={props.phone ? 'phone-pad' : props.email ? 'email-address' : 'default'}
        autoCapitalize={props.email ? 'none' : 'sentences'}
        multiline={props.multiline}
        maxLength={props.multiline ? 500 : 120}
        className="bg-surface border border-border rounded-xl px-4 py-3 text-white text-base"
        style={props.multiline ? { textAlignVertical: 'top', minHeight: 72 } : undefined}
      />
      {props.hint ? <Text className="text-gray-muted text-xs mt-1">{props.hint}</Text> : null}
    </View>
  );
}

export default function ClaimScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const known = useMemo(() => (isNew ? null : getRegisteredClinic(id) ?? getClinicById(id)), [id, isNew]);

  const [clinicName, setClinicName] = useState(known?.name ?? '');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'vet' | 'owner' | 'staff' | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState(known?.phone ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [hours, setHours] = useState('');
  const [is247, setIs247] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneOk = phone.replace(/\D/g, '').length >= 10;
  const ready = clinicName.trim().length > 1 && name.trim().length > 1 && role && phoneOk && consent;

  const toggleService = (s: string) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async () => {
    if (!ready || !role) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Şu an gönderilemiyor', 'Başvuru sistemi henüz aktif değil.');
      return;
    }
    setSubmitting(true);
    const ok = await submitClinicClaim({
      clinic_id: isNew ? null : id,
      clinic_name: clinicName.trim(),
      claimant_name: name.trim(),
      claimant_role: role,
      claimant_phone: phone.trim(),
      claimant_email: email.trim() || null,
      clinic_phone: clinicPhone.trim() || null,
      emergency_phone: emergencyPhone.trim() || null,
      hours_text: is247 ? '7/24' : hours.trim() || null,
      is_24_7: is247,
      accepts_emergency: emergency || is247,
      services,
      note: note.trim() || null,
      consent: true,
    });
    setSubmitting(false);
    if (!ok) {
      Alert.alert('Gönderilemedi', 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
      return;
    }
    track('claim_submitted', { clinic_id: isNew ? undefined : id, new_clinic: isNew });
    Alert.alert(
      'Başvurunuz alındı',
      'Verdiğiniz numarayı arayarak kliniği doğrulayacağız. Onaylandığında bilgileriniz uygulamada "Klinik onaylı" olarak görünecek. Teşekkürler!',
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mb-5">
          <Text className="text-gray-text text-base">✕ Kapat</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold">Klinik bilgilerinizi doğrulayın</Text>
        <Text className="text-gray-text text-sm mt-2 leading-relaxed">
          Ücretsizdir. Reklam değildir: sıralama satın alınamaz; açık olma, mesafe ve acil kabul belirler.
          Doğrulanan klinikler "Klinik onaylı" görünür ve hasta sahipleri size doğru numaradan ulaşır.
        </Text>

        <View className="h-px bg-border my-6" />

        {isNew || !known ? (
          <Field label="Klinik adı *" value={clinicName} onChange={setClinicName} placeholder="Örn. Pati Veteriner Kliniği" />
        ) : (
          <View className="bg-card border border-border rounded-xl px-4 py-3 mb-4">
            <Text className="text-gray-muted text-xs">Klinik</Text>
            <Text className="text-white font-semibold text-base mt-0.5">{clinicName}</Text>
          </View>
        )}

        <Field label="Adınız soyadınız *" value={name} onChange={setName} placeholder="Vet. Hek. Ad Soyad" />

        <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-1.5">Rolünüz *</Text>
        <View className="flex-row gap-2 mb-4">
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRole(r.key)}
              className={`flex-1 border rounded-xl py-3 items-center ${role === r.key ? 'border-orange-accent bg-orange-accent/10' : 'border-border bg-surface'}`}
            >
              <Text className="text-white text-xs font-semibold">{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Doğrulama telefonunuz *" value={phone} onChange={setPhone} phone placeholder="05xx xxx xx xx" hint="Bu numarayı arayarak doğrulayacağız; uygulamada gösterilmez." />
        <Field label="E-posta" value={email} onChange={setEmail} email placeholder="isteğe bağlı" />

        <View className="h-px bg-border my-4" />
        <Text className="text-white font-bold text-base mb-3">Hasta sahiplerinin göreceği bilgiler</Text>

        <Field label="Klinik telefonu" value={clinicPhone} onChange={setClinicPhone} phone placeholder="0312 xxx xx xx" />
        <Field label="Mesai dışı acil hattı" value={emergencyPhone} onChange={setEmergencyPhone} phone placeholder="varsa (nöbet / cep)" hint="Gece arayan hasta sahibi doğrudan bu numarayı görür." />

        <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 mb-3">
          <Text className="text-white text-base">7/24 açığız</Text>
          <Switch value={is247} onValueChange={setIs247} trackColor={{ true: '#ff7f1c', false: '#44474c' }} />
        </View>
        {!is247 && (
          <Field
            label="Çalışma saatleri"
            value={hours}
            onChange={setHours}
            placeholder="Pzt–Cmt 09:00–20:00, Pazar kapalı"
          />
        )}
        <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 mb-4">
          <Text className="text-white text-base flex-1 mr-3">Acil hasta kabul ediyoruz</Text>
          <Switch value={emergency || is247} onValueChange={setEmergency} disabled={is247} trackColor={{ true: '#ff7f1c', false: '#44474c' }} />
        </View>

        <Text className="text-gray-label text-xs font-semibold uppercase tracking-wide mb-2">Hizmetler</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CLINIC_SERVICES.map((s) => {
            const on = services.includes(s);
            return (
              <TouchableOpacity
                key={s}
                onPress={() => toggleService(s)}
                className={`rounded-full px-3.5 py-2 border ${on ? 'border-orange-accent bg-orange-accent/10' : 'border-border bg-surface'}`}
              >
                <Text className={`text-sm ${on ? 'text-white font-semibold' : 'text-gray-text'}`}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Field label="Hasta sahiplerine not" value={note} onChange={setNote} multiline placeholder="Örn. Gece gelmeden önce mutlaka arayın; egzotik hasta kabul etmiyoruz." />

        <TouchableOpacity onPress={() => setConsent(!consent)} className="flex-row items-start gap-3 mt-2" activeOpacity={0.7}>
          <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${consent ? 'bg-orange-accent border-orange-accent' : 'border-border bg-surface'}`}>
            {consent && <Text className="text-white text-sm font-bold">✓</Text>}
          </View>
          <Text className="text-gray-text text-sm flex-1 leading-relaxed">
            Verdiğim bilgilerin başvurumun doğrulanması ve klinik bilgilerinin uygulamada gösterilmesi
            amacıyla işlenmesini kabul ediyorum (KVKK). Doğrulama telefonum yayımlanmaz.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={submit}
          disabled={!ready || submitting}
          className={`rounded-2xl py-4 items-center mt-6 ${!ready || submitting ? 'bg-surface opacity-50' : 'bg-orange-accent'}`}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Başvuruyu gönder</Text>}
        </TouchableOpacity>
        {!phoneOk && phone.length > 0 && (
          <Text className="text-gray-muted text-xs text-center mt-2">Telefon numarası en az 10 haneli olmalı.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
