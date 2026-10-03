// Hekim paneli (web) çerçevesi: giriş kapısı, üst çubuk ve geniş ekran sayfası.
import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
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

function NavLink({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: active ? t.primarySoft : pressed ? t.surfaceAlt : 'transparent',
      })}
    >
      <Text variant="callout" color={active ? t.primary : t.textMuted} style={{ fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function TopBar({ vet }: { vet: VetProfile }) {
  const t = useTheme();
  const signOut = useSession((s) => s.signOut);
  const width = useWindowDimensions().width;
  const wide = width >= 900;
  // Telefonda menü ikinci satıra iner; klinik adı tek satırda kalır
  const inlineNav = width >= 640;
  const path = usePathname();
  const onPos = path.endsWith('/panel/pos');
  const onSettings = path.endsWith('/panel/ayarlar');
  const nav = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <NavLink label="Hastalar" active={!onPos && !onSettings} onPress={() => router.replace('/panel')} />
      <NavLink label="Test POS" active={onPos} onPress={() => router.replace('/panel/pos')} />
      <NavLink label="Ayarlar" active={onSettings} onPress={() => router.replace('/panel/ayarlar')} />
    </View>
  );
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="headline" numberOfLines={1} style={{ fontSize: 19, lineHeight: 24 }}>
            {vet.clinic_name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            Patiport hekim paneli{wide ? ` · ${vetDisplayName(vet)}` : ''}
          </Text>
        </View>
        {inlineNav ? nav : null}
        <Button title="Çıkış" variant="ghost" size="sm" onPress={() => signOut()} />
      </View>
      {inlineNav ? null : <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>{nav}</View>}
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
                {signedEmail} hesabı henüz onaylı bir hekim hesabı değil. Klinik başvurunuz onaylanınca panel açılır.
              </Text>
              <Button title="Başvuru durumum" onPress={() => router.push('/panel/basvur')} />
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
        <View style={{ marginTop: 16, padding: 16, borderRadius: radius.lg, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, gap: 10 }}>
          <Text variant="bodyStrong">Hesabınız yok mu?</Text>
          <Text variant="caption" tone="muted">
            Kliniğinizle ücretsiz başvurun. Verdiğiniz numarayı arayarak doğruluyoruz; onaylanınca aynı e-posta ve şifreyle buradan girersiniz.
          </Text>
          <Button title="Ücretsiz başvur" variant="secondary" onPress={() => router.push('/panel/basvur')} />
        </View>
      </View>
    </ScrollView>
  );
}
