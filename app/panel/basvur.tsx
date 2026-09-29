// Web'den hekim başvurusu: hesap aç (ya da gir) → kliniği seç ya da ekle →
// doğrulama bilgileri → başvuru alındı (+ tahsilat anketi). Yönetici telefonla
// doğrulayıp vets/{uid} belgesini oluşturunca aynı hesapla panel açılır
// (YONETICI_REHBERI.md, 6. bölüm). Mobil uygulamadaki "Bu klinik benim" ile aynı
// clinic_claims kaydını yazar.
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Linking } from 'react-native';
import { Redirect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Button, Card, Field, Segmented, SearchField, SwitchRow, Checkbox, Chip, LogoMark } from '@/components/ds';
import { InterestCard } from '@/components/panel/Interest';
import { useTheme, radius } from '@/lib/theme';
import { useSession } from '@/stores/session';
import { searchClinicsByName } from '@/lib/data/query';
import { submitClinicClaim, isFirebaseConfigured } from '@/lib/data/community';
import { CLINIC_SERVICES } from '@/lib/data/clinicServices';
import { LINKS } from '@/lib/links';
import { track } from '@/lib/analytics';
import type { SeedClinic } from '@/lib/data/types';

const CLAIM_KEY = 'patisos:panel_claim';
type Role = 'vet' | 'owner' | 'staff';
interface SentClaim {
  uid: string;
  clinic_name: string;
  at: number;
}

export default function PanelApply() {
  const t = useTheme();
  const { ready, uid, isAnonymous, role } = useSession();
  const signedIn = !!uid && !isAnonymous;
  const [sent, setSent] = useState<SentClaim | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLAIM_KEY)
      .then((raw) => {
        const c = raw ? (JSON.parse(raw) as SentClaim) : null;
        setSent(c && c.uid === uid ? c : null);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [uid]);

  if (ready && role === 'vet') return <Redirect href="/panel" />;
  const step = !signedIn ? 1 : sent ? 3 : 2;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>
        <Pressable onPress={() => Linking.openURL(LINKS.vets)} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <LogoMark size={36} />
          <Text variant="headline">Patiport Hekim</Text>
        </Pressable>
        <Text variant="title">Kliniğinizle katılın</Text>
        <Text variant="callout" tone="muted" style={{ marginTop: 4, marginBottom: 16 }}>
          Ücretsiz. Verdiğiniz numarayı arayarak kliniği doğruluyoruz; onaylanınca hekim paneliniz açılır ve kliniğiniz uygulamada "Klinik
          onaylı" görünür.
        </Text>
        <Steps step={step} />
        {!ready || !checked ? null : step === 1 ? (
          <AccountStep />
        ) : step === 2 ? (
          <ClinicStep onSent={(c) => setSent(c)} />
        ) : (
          <DoneStep sent={sent!} />
        )}
      </View>
    </ScrollView>
  );
}

function Steps({ step }: { step: number }) {
  const t = useTheme();
  const items = ['Hesap', 'Klinik', 'Tamam'];
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
      {items.map((label, i) => {
        const n = i + 1;
        const on = n <= step;
        return (
          <View key={label} style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: on ? t.primary : t.border }} />
            <Text variant="caption" tone={n === step ? undefined : 'muted'} style={{ fontWeight: n === step ? '700' : '500' }}>
              {n}. {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AccountStep() {
  const { signUp, signIn, resetPassword } = useSession();
  const [mode, setMode] = useState<'new' | 'have'>('new');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Vet. Hek.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const ok = mode === 'have' ? email.includes('@') && password.length >= 6 : name.trim().length > 1 && email.includes('@') && password.length >= 6;

  const submit = async () => {
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    const r =
      mode === 'new'
        ? await signUp({ role: 'vet_pending', name: name.trim(), email: email.trim(), password, title: title.trim() || null })
        : await signIn(email.trim(), password);
    setBusy(false);
    if (!r.ok) setMsg(r.message ?? 'Olmadı. Bilgileri kontrol edip tekrar deneyin.');
    else track('panel_apply_account', { mode });
  };

  return (
    <Card>
      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setMsg(null);
        }}
        options={[
          { key: 'new', label: 'Yeni hesap' },
          { key: 'have', label: 'Hesabım var' },
        ]}
      />
      {mode === 'new' ? (
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexGrow: 1, flexBasis: 120 }}>
            <Field label="Unvan" value={title} onChangeText={setTitle} placeholder="Vet. Hek." />
          </View>
          <View style={{ flexGrow: 3, flexBasis: 220 }}>
            <Field label="Adınız soyadınız" value={name} onChangeText={setName} autoComplete="name" />
          </View>
        </View>
      ) : null}
      <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === 'new' ? 'new-password' : 'password'}
        hint={mode === 'new' ? 'En az 6 karakter. Panele bu e-posta ve şifreyle gireceksiniz.' : undefined}
        onSubmitEditing={submit}
      />
      {msg ? (
        <Text variant="caption" tone="danger" style={{ marginBottom: 12 }}>
          {msg}
        </Text>
      ) : null}
      <Button title={mode === 'new' ? 'Hesabı aç ve devam et' : 'Giriş yap ve devam et'} full loading={busy} disabled={!ok} onPress={submit} />
      {mode === 'have' ? (
        <Button
          title="Şifremi unuttum"
          variant="ghost"
          size="sm"
          style={{ alignSelf: 'center', marginTop: 8 }}
          onPress={async () => {
            if (!email.includes('@')) return setMsg('Önce e-posta adresinizi yazın.');
            setMsg((await resetPassword(email.trim())) ? 'Şifre sıfırlama bağlantısı e-postanıza gönderildi.' : 'Gönderilemedi. Adresi kontrol edin.');
          }}
        />
      ) : null}
    </Card>
  );
}

function ClinicStep({ onSent }: { onSent: (c: SentClaim) => void }) {
  const t = useTheme();
  const account = useSession();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<SeedClinic | null>(null);
  const [manual, setManual] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [role, setRole] = useState<Role | null>('vet');
  const [phone, setPhone] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [hours, setHours] = useState('');
  const [is247, setIs247] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const results = useMemo(() => (query.trim().length >= 2 ? searchClinicsByName(query, 8) : []), [query]);
  const chosen = picked || manual;
  const name = picked ? picked.name : clinicName.trim();
  const phoneOk = phone.replace(/\D/g, '').length >= 10;
  const ready = !!chosen && name.length > 1 && !!role && phoneOk && consent;

  const pick = (c: SeedClinic) => {
    setPicked(c);
    setManual(false);
    setClinicPhone(c.phone ?? '');
  };

  const submit = async () => {
    if (!ready || !role || !account.uid) return;
    if (!isFirebaseConfigured) return setMsg('Başvuru sistemi şu anda kapalı.');
    setBusy(true);
    setMsg(null);
    const ok = await submitClinicClaim({
      clinic_id: picked?.id ?? null,
      clinic_name: name,
      claimant_name: (account.name ?? '').trim() || 'Hekim',
      claimant_role: role,
      claimant_phone: phone.trim(),
      claimant_email: account.email ?? null,
      clinic_phone: clinicPhone.trim() || null,
      emergency_phone: emergencyPhone.trim() || null,
      hours_text: is247 ? '7/24' : hours.trim() || null,
      is_24_7: is247,
      accepts_emergency: emergency || is247,
      services,
      note: 'Web panelinden başvuru',
      consent: true,
      claimant_uid: account.uid,
    });
    setBusy(false);
    if (!ok) return setMsg('Gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.');
    track('claim_submitted', { clinic_id: picked?.id, new_clinic: !picked, source: 'web' });
    const sent = { uid: account.uid, clinic_name: name, at: Date.now() };
    await AsyncStorage.setItem(CLAIM_KEY, JSON.stringify(sent)).catch(() => {});
    onSent(sent);
  };

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Text variant="headline" style={{ marginBottom: 4 }}>
          Kliniğiniz
        </Text>
        {picked ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: t.surfaceAlt }}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{picked.name}</Text>
              <Text variant="caption" tone="muted">
                {[picked.address, picked.district, picked.city].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Button title="Değiştir" variant="ghost" size="sm" onPress={() => setPicked(null)} />
          </View>
        ) : manual ? (
          <>
            <Field label="Klinik adı" value={clinicName} onChangeText={setClinicName} placeholder="Örn. Pati Veteriner Kliniği" />
            <Button title="Listeden seçeyim" variant="ghost" size="sm" onPress={() => setManual(false)} style={{ alignSelf: 'flex-start', marginLeft: -8 }} />
          </>
        ) : (
          <>
            <Text variant="callout" tone="muted" style={{ marginBottom: 12 }}>
              Kliniğiniz büyük ihtimalle listemizde: adını ya da ilçesini yazın.
            </Text>
            <SearchField value={query} onChangeText={setQuery} placeholder="Klinik adı ya da ilçe" />
            {results.length > 0 ? (
              <View style={{ marginTop: 8, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
                {results.map((c, i) => (
                  <Pressable
                    key={c.id}
                    onPress={() => pick(c)}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      padding: 12,
                      backgroundColor: pressed ? t.surfaceAlt : t.surface,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.border,
                    })}
                  >
                    <Text variant="bodyStrong">{c.name}</Text>
                    <Text variant="caption" tone="muted">
                      {[c.district, c.city].filter(Boolean).join(', ') || 'Konum bilgisi var'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : query.trim().length >= 2 ? (
              <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>
                Bu adla kayıt bulamadık.
              </Text>
            ) : null}
            <Button title="Kliniğim listede yok" variant="ghost" size="sm" icon="add-circle-outline" onPress={() => setManual(true)} style={{ alignSelf: 'flex-start', marginTop: 8, marginLeft: -8 }} />
          </>
        )}
      </Card>

      {chosen ? (
        <Card>
          <Text variant="headline" style={{ marginBottom: 12 }}>
            Doğrulama ve bilgiler
          </Text>
          <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
            Kliniğe göre rolünüz
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
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <View style={{ flexGrow: 1, flexBasis: 200 }}>
              <Field label="Klinik telefonu" value={clinicPhone} onChangeText={setClinicPhone} keyboardType="phone-pad" hint="Uygulamada görünür" />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 200 }}>
              <Field label="Acil hat (varsa)" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
            </View>
          </View>
          <SwitchRow label="7/24 açığız" value={is247} onValueChange={setIs247} />
          {!is247 ? <Field label="Çalışma saatleri" value={hours} onChangeText={setHours} placeholder="Hafta içi 09.00-19.00, Cumartesi 10.00-17.00" /> : null}
          <SwitchRow label="Acil hasta kabul ediyoruz" value={emergency || is247} onValueChange={setEmergency} disabled={is247} />
          <Text variant="caption" tone="muted" style={{ marginTop: 12, marginBottom: 8 }}>
            Hizmetler
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {CLINIC_SERVICES.map((s) => (
              <Chip key={s} label={s} active={services.includes(s)} onSurface onPress={() => setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))} />
            ))}
          </View>
          <Checkbox checked={consent} onPress={() => setConsent(!consent)}>
            <Text variant="callout">
              Bilgilerin doğrulama için kullanılmasını ve kliniğin Patiport'ta gösterilmesini kabul ediyorum.{' '}
              <Text variant="callout" tone="primary" onPress={() => Linking.openURL(LINKS.privacy)}>
                Gizlilik
              </Text>
            </Text>
          </Checkbox>
          {msg ? (
            <Text variant="caption" tone="danger" style={{ marginTop: 12 }}>
              {msg}
            </Text>
          ) : null}
          <Button title="Başvuruyu gönder" full loading={busy} disabled={!ready} onPress={submit} style={{ marginTop: 16 }} />
        </Card>
      ) : null}
      <Text variant="caption" tone="subtle">
        {account.email} hesabıyla başvuruyorsunuz.{' '}
        <Text variant="caption" tone="primary" onPress={() => account.signOut()}>
          Başka hesap
        </Text>
      </Text>
    </View>
  );
}

function DoneStep({ sent }: { sent: SentClaim }) {
  const account = useSession();
  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 8 }}>
        <Text variant="headline">Başvurunuz alındı</Text>
        <Text variant="body">
          {sent.clinic_name} için verdiğiniz numarayı arayarak doğrulayacağız. Onaylanınca {account.email ?? 'bu'} hesabıyla hekim paneline
          girersiniz; kliniğiniz uygulamada "Klinik onaylı" görünür.
        </Text>
        <Text variant="caption" tone="muted">
          Başvuru tarihi: {new Date(sent.at).toLocaleDateString('tr-TR')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <Button title="Panele git" variant="secondary" onPress={() => router.replace('/panel')} />
          <Button title="Çıkış" variant="ghost" onPress={() => account.signOut()} />
        </View>
      </Card>
      {account.uid ? <InterestCard uid={account.uid} clinicName={sent.clinic_name} /> : null}
    </View>
  );
}
