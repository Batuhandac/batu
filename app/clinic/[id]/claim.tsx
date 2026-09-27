import React, { useMemo, useState } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Header, Text, Field, Button, Card, Segmented, SwitchRow, Checkbox, Chip, Divider } from '@/components/ds';
import { submitClinicClaim, isFirebaseConfigured } from '@/lib/data/community';
import { useSession } from '@/stores/session';
import { getRegisteredClinic } from '@/lib/data/registry';
import { getClinicById } from '@/lib/data/query';
import { track } from '@/lib/analytics';

type Role = 'vet' | 'owner' | 'staff';

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

export default function ClaimScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const known = useMemo(() => (isNew ? null : getRegisteredClinic(id) ?? getClinicById(id)), [id, isNew]);

  const [clinicName, setClinicName] = useState(known?.name ?? '');
  const account = useSession();
  const signedIn = !account.isAnonymous && !!account.uid;
  const [name, setName] = useState(signedIn ? account.name ?? '' : '');
  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(signedIn ? account.email ?? '' : '');
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
  const ready = clinicName.trim().length > 1 && name.trim().length > 1 && !!role && phoneOk && consent;

  const toggleService = (s: string) => setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async () => {
    if (!ready || !role) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Şu an gönderilemiyor', 'Başvuru sistemi henüz etkin değil.');
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
      // Hekim hesabıyla başvurduysa yönetici bu kimliği vets/{uid} olarak onaylar
      claimant_uid: signedIn ? account.uid : null,
    });
    setSubmitting(false);
    if (!ok) {
      Alert.alert('Gönderilemedi', 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
      return;
    }
    track('claim_submitted', { clinic_id: isNew ? undefined : id, new_clinic: isNew });
    Alert.alert(
      'Başvurunuz alındı',
      signedIn
        ? 'Verdiğiniz numarayı arayarak kliniği doğrulayacağız. Onaylandığında hekim paneliniz açılır ve kliniğiniz "Klinik onaylı" görünür.'
        : 'Verdiğiniz numarayı arayarak kliniği doğrulayacağız. Onaylandığında bilgileriniz uygulamada "Klinik onaylı" olarak görünecek. Teşekkür ederiz.',
      [{ text: 'Tamam', onPress: () => router.back() }]
    );
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header
        title="Klinik bilgilerinizi doğrulayın"
        subtitle="Ücretsizdir ve reklam değildir: sıralama satın alınamaz. Doğrulanan klinikler 'Klinik onaylı' görünür; hasta sahipleri size doğru numaradan ulaşır."
        onBack={() => router.back()}
      />
      <View style={{ paddingHorizontal: 20 }}>
        {isNew || !known ? (
          <Field label="Klinik adı" value={clinicName} onChangeText={setClinicName} placeholder="Örn. Pati Veteriner Kliniği" />
        ) : (
          <Card tone="alt" style={{ marginBottom: 16 }}>
            <Text variant="caption" tone="muted">
              Klinik
            </Text>
            <Text variant="bodyStrong" style={{ marginTop: 2 }}>
              {clinicName}
            </Text>
          </Card>
        )}

        <Text variant="overline" tone="muted" style={{ marginBottom: 12 }}>
          Başvuran
        </Text>
        <Field label="Adınız soyadınız" value={name} onChangeText={setName} placeholder="Vet. Hek. Ad Soyad" />
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
          Rolünüz
        </Text>
        <Segmented<Role>
          value={role}
          onChange={setRole}
          options={[
            { key: 'vet', label: 'Veteriner hekim' },
            { key: 'owner', label: 'Klinik sahibi' },
            { key: 'staff', label: 'Çalışan' },
          ]}
        />
        <Field
          label="Doğrulama telefonunuz"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="05xx xxx xx xx"
          hint="Bu numarayı arayarak doğrulayacağız; uygulamada gösterilmez."
          error={phone.length > 0 && !phoneOk ? 'Telefon numarası en az 10 haneli olmalı.' : undefined}
        />
        <Field label="E-posta (isteğe bağlı)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="ornek@klinik.com" />

        <Divider style={{ marginVertical: 12 }} />
        <Text variant="overline" tone="muted" style={{ marginBottom: 12 }}>
          Hasta sahiplerinin göreceği bilgiler
        </Text>
        <Field label="Klinik telefonu" value={clinicPhone} onChangeText={setClinicPhone} keyboardType="phone-pad" placeholder="0312 xxx xx xx" />
        <Field
          label="Mesai dışı acil hattı"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          keyboardType="phone-pad"
          placeholder="Varsa nöbet ya da cep hattı"
          hint="Gece arayan hasta sahibi doğrudan bu numarayı görür."
        />
        <SwitchRow label="7/24 açığız" value={is247} onValueChange={setIs247} />
        {!is247 && <Field label="Çalışma saatleri" value={hours} onChangeText={setHours} placeholder="Pzt–Cmt 09:00–20:00, Pazar kapalı" />}
        <SwitchRow label="Acil hasta kabul ediyoruz" value={emergency || is247} onValueChange={setEmergency} disabled={is247} />

        <Text variant="caption" tone="muted" style={{ marginTop: 4, marginBottom: 8 }}>
          Hizmetler
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CLINIC_SERVICES.map((s) => (
            <Chip key={s} label={s} active={services.includes(s)} onPress={() => toggleService(s)} />
          ))}
        </View>
        <Field label="Hasta sahiplerine not" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Örn. Gece gelmeden önce mutlaka arayın; egzotik hasta kabul etmiyoruz." />

        <Checkbox checked={consent} onPress={() => setConsent(!consent)}>
          <Text variant="callout" tone="muted">
            Verdiğim bilgilerin başvurumun doğrulanması ve klinik bilgilerinin uygulamada gösterilmesi amacıyla
            işlenmesini kabul ediyorum (KVKK). Doğrulama telefonum yayımlanmaz.
          </Text>
        </Checkbox>

        <Button title="Başvuruyu gönder" size="lg" full disabled={!ready} loading={submitting} onPress={submit} style={{ marginTop: 20 }} />
      </View>
    </Screen>
  );
}
