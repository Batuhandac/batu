import React, { useEffect, useState } from 'react';
import { View, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Text, Field, Button, Card, Group, ListRow, SwitchRow, IconBadge } from '@/components/ds';
import { Art } from '@/components/art';
import { useTheme } from '@/lib/theme';
import { useSession } from '@/stores/session';
import { vetDisplayName } from '@/lib/auth';
import { fetchInbox, setInboxOpen, registerVetDevice, unregisterVetDevice, type ClinicInbox } from '@/lib/data/messages';
import { useUnreadMessages } from '@/lib/hooks/useCommunity';
import { track } from '@/lib/analytics';

export default function VetPanelScreen() {
  const vet = useSession((s) => s.vet);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings'));
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title={vet ? 'Hekim paneli' : 'Hekim girişi'} subtitle={vet ? vet.clinic_name : 'Doğrulanmış klinik hesapları için'} onBack={back} />
      {vet ? <Panel /> : <Login />}
    </Screen>
  );
}

function Login() {
  const t = useTheme();
  const { vetSignIn, resetPassword } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await vetSignIn(email, password);
    setBusy(false);
    if (!res.ok) setError(res.message ?? 'Giriş yapılamadı.');
    else track('vet_login');
  };

  const forgot = async () => {
    if (!email.includes('@')) {
      setError('Önce kayıtlı e-posta adresinizi yazın.');
      return;
    }
    const ok = await resetPassword(email);
    Alert.alert(
      ok ? 'E-posta gönderildi' : 'Gönderilemedi',
      ok ? 'Şifre oluşturma bağlantısını e-posta adresinize gönderdik. Gelen kutunuzu ve istenmeyen klasörünü kontrol edin.' : 'Adresi kontrol edip tekrar deneyin.'
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ paddingHorizontal: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Art name="vet" width={200} />
      </View>
      <Text variant="callout" tone="muted" style={{ marginBottom: 18 }}>
        Kliniğiniz doğrulandıktan sonra size bir hesap tanımlıyoruz. Giriş yaptığınızda hasta sahiplerinin mesajlarını
        yanıtlayabilir, topluluktaki sorulara kliniğinizin adıyla ve "Veteriner hekim" rozetiyle cevap verebilirsiniz.
      </Text>
      <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="ornek@klinik.com" />
      <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="••••••••" />
      {error ? (
        <Text variant="callout" tone="danger" style={{ marginBottom: 12 }}>
          {error}
        </Text>
      ) : null}
      <Button title="Giriş yap" size="lg" full loading={busy} disabled={!email || !password} onPress={submit} />
      <Pressable onPress={forgot} style={{ alignSelf: 'center', marginTop: 16 }} hitSlop={10} accessibilityRole="button">
        <Text variant="callout" tone="primary">
          Şifremi unuttum / şifre oluştur
        </Text>
      </Pressable>

      <Card tone="alt" style={{ marginTop: 28 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <IconBadge name="shield-checkmark-outline" size={40} color={t.primary} background={t.surface} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Hesabınız yok mu?</Text>
            <Text variant="caption" tone="muted">
              Önce kliniğinizi ücretsiz doğrulayın; telefonla teyit edip hesabınızı açalım.
            </Text>
          </View>
        </View>
        <Button title="Kliniğimi doğrula" variant="secondary" onPress={() => router.push('/vets')} style={{ marginTop: 12 }} full />
      </Card>
    </KeyboardAvoidingView>
  );
}

function Panel() {
  const t = useTheme();
  const vet = useSession((s) => s.vet)!;
  const vetSignOut = useSession((s) => s.vetSignOut);
  const unread = useUnreadMessages();
  const [inbox, setInbox] = useState<ClinicInbox | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    registerVetDevice(vet.clinic_id);
    fetchInbox(vet.clinic_id).then((i) => {
      setInbox(i);
      setOpen(!!i?.open);
      setHint(i?.response_hint ?? '');
    });
  }, [vet.clinic_id]);

  const save = async (nextOpen = open) => {
    setSaving(true);
    const ok = await setInboxOpen(vet.clinic_id, nextOpen, hint.trim() || null);
    setSaving(false);
    if (!ok) Alert.alert('Kaydedilemedi', 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
  };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Card>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <IconBadge name="medkit" size={52} color={t.onPrimary} background={t.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">{vetDisplayName(vet)}</Text>
            <Text variant="caption" tone="muted">
              {vet.clinic_name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <IconBadge name="checkmark" size={16} color={t.onPrimary} background={t.primary} />
              <Text variant="caption" tone="primary">
                Doğrulanmış hekim hesabı
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Text variant="overline" tone="subtle" style={{ marginTop: 24, marginBottom: 8, marginLeft: 4 }}>
        Mesajlar
      </Text>
      {inbox === null ? (
        <Card tone="honey">
          <Text variant="callout">
            Kliniğinizin gelen kutusu henüz açılmadı. support@patisos.app adresine yazın, aynı gün etkinleştirelim.
          </Text>
        </Card>
      ) : (
        <>
          <SwitchRow
            label="Mesaj kabul ediyorum"
            hint={open ? 'Kliniğinizin sayfasında "Mesaj gönder" düğmesi görünür.' : 'Kapalıyken hasta sahipleri size yazamaz.'}
            value={open}
            disabled={inbox === undefined || saving}
            onValueChange={(v) => {
              setOpen(v);
              save(v);
            }}
          />
          <Field
            label="Yanıt süresi notu (isteğe bağlı)"
            value={hint}
            onChangeText={setHint}
            onBlur={() => save()}
            maxLength={60}
            placeholder="Ör. Genelde 1 saat içinde yanıtlarız"
          />
        </>
      )}

      <Group>
        <ListRow icon="chatbubbles-outline" title="Gelen mesajlar" subtitle={unread > 0 ? `${unread} okunmamış konuşma` : 'Hasta sahipleriyle yazışmalar'} onPress={() => router.push('/messages')} />
        <ListRow icon="help-circle-outline" title="Yanıt bekleyen sorular" subtitle="Topluluktaki soruları yanıtlayın" onPress={() => router.push('/community')} />
        <ListRow icon="business-outline" title="Klinik sayfanız" onPress={() => router.push(`/clinic/${vet.clinic_id}`)} last />
      </Group>

      <Text variant="caption" tone="subtle" style={{ marginTop: 14 }}>
        Yanıtlarınız bilgilendirme amaçlıdır; meslek kuralları gereği reklam ve tanıtım içeriğinden kaçının. Muayene
        gerektiren durumlarda hasta sahibini kliniğe yönlendirin.
      </Text>

      <Button
        title="Çıkış yap"
        variant="danger"
        full
        style={{ marginTop: 24 }}
        onPress={() =>
          Alert.alert('Çıkış yapılsın mı?', 'Bu cihaz artık kliniğinize gelen mesajların bildirimini almaz.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Çıkış yap',
              style: 'destructive',
              onPress: async () => {
                await unregisterVetDevice(vet.clinic_id);
                await vetSignOut();
              },
            },
          ])
        }
      />
    </View>
  );
}
