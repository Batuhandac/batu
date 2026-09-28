// Hekim paneli (web) çerçevesi: giriş kapısı, üst çubuk ve geniş ekran sayfası.
import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Text, Button, Field, LogoMark, Card } from '@/components/ds';
import { useTheme, radius } from '@/lib/theme';
import { useSession } from '@/stores/session';
import { vetDisplayName, type VetProfile } from '@/lib/auth';

export const PANEL_MAX = 1120;

export function useWide() {
  return useWindowDimensions().width >= 900;
}

export function PanelPage({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: PANEL_MAX, alignSelf: 'center', paddingHorizontal: 20 }}>{children}</View>
    </ScrollView>
  );
}

function TopBar({ vet }: { vet: VetProfile }) {
  const t = useTheme();
  const signOut = useSession((s) => s.signOut);
  const wide = useWide();
  return (
    <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border }}>
      <View
        style={{
          width: '100%',
          maxWidth: PANEL_MAX,
          alignSelf: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <LogoMark size={30} />
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontSize: 19, lineHeight: 24 }}>
            {vet.clinic_name}
          </Text>
          <Text variant="caption" tone="muted">
            Patiport hekim paneli{wide ? ` · ${vetDisplayName(vet)}` : ''}
          </Text>
        </View>
        <Button title="Çıkış" variant="ghost" size="sm" onPress={() => signOut()} />
      </View>
    </View>
  );
}

/** Onaylı hekim değilse giriş formunu, hekimse paneli gösterir. */
export function PanelGate({ children }: { children: (vet: VetProfile) => React.ReactNode }) {
  const t = useTheme();
  const { ready, vet } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }
  if (!vet) return <PanelLogin />;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TopBar vet={vet} />
      {children(vet)}
    </View>
  );
}

function PanelLogin() {
  const t = useTheme();
  const { signIn, resetPassword, email: signedEmail, role, signOut } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const notVet = !!signedEmail && role !== 'vet';

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const r = await signIn(email.trim(), password);
    setBusy(false);
    if (!r.ok) setMsg(r.message ?? 'Giriş yapılamadı.');
  };
  const forgot = async () => {
    if (!email.trim()) return setMsg('Önce e-posta adresini yaz.');
    const ok = await resetPassword(email.trim());
    setMsg(ok ? 'Şifre sıfırlama bağlantısı e-postana gönderildi.' : 'Gönderilemedi. Adresi kontrol et.');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <LogoMark size={40} />
          <View>
            <Text variant="title">Hekim paneli</Text>
            <Text variant="caption" tone="muted">
              Patiport · hasta takibi, aşı ve hatırlatmalar
            </Text>
          </View>
        </View>
        <Card>
          {notVet ? (
            <View style={{ gap: 12 }}>
              <Text variant="body">
                {signedEmail} hesabı henüz onaylı bir hekim hesabı değil. Klinik başvurun onaylanınca panel açılır.
              </Text>
              <Button title="Başka hesapla gir" variant="secondary" onPress={() => signOut()} />
            </View>
          ) : (
            <>
              <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
              <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} />
              {msg ? (
                <Text variant="caption" tone="danger" style={{ marginBottom: 12 }}>
                  {msg}
                </Text>
              ) : null}
              <Button title="Giriş yap" full loading={busy} disabled={!email || !password} onPress={submit} />
              <Button title="Şifremi unuttum" variant="ghost" size="sm" onPress={forgot} style={{ alignSelf: 'center', marginTop: 8 }} />
            </>
          )}
        </Card>
        <View style={{ marginTop: 16, padding: 14, borderRadius: radius.md, backgroundColor: t.surfaceAlt }}>
          <Text variant="caption" tone="muted">
            Hesabın yoksa Patiport uygulamasında Ayarlar → "Veteriner hekim misiniz?" bölümünden ücretsiz başvur. Kliniğin doğrulanınca aynı
            e-posta ve şifreyle buradan girersin.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
