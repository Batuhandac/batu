import React, { useState } from 'react';
import { View, Pressable, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Field, Button, Segmented, Chip } from '@/components/ds';
import { useSession } from '@/stores/session';

export type AuthMode = 'signup' | 'signin';

const TITLES = ['Vet. Hek.', 'Uzm. Vet. Hek.', 'Dr. Vet. Hek.', 'Prof. Dr.'];

/** Pet sahibi ve hekim için ortak kayıt/giriş formu. */
export function AuthForm({
  role,
  initialMode = 'signup',
  onDone,
}: {
  role: 'owner' | 'vet';
  initialMode?: AuthMode;
  onDone: () => void;
}) {
  const { signUp, signIn, resetPassword } = useSession();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Vet. Hek.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const ready = emailOk && password.length >= 6 && (mode === 'signin' || name.trim().length >= 2);

  const submit = async () => {
    setError(null);
    setBusy(true);
    const res =
      mode === 'signup'
        ? await signUp({ role: role === 'vet' ? 'vet_pending' : 'owner', name, email, password, title: role === 'vet' ? title : null })
        : await signIn(email, password);
    setBusy(false);
    if (res.ok) onDone();
    else setError(res.message ?? 'İşlem tamamlanamadı.');
  };

  const forgot = async () => {
    if (!emailOk) {
      setError('Önce e-posta adresini yaz.');
      return;
    }
    const ok = await resetPassword(email);
    Alert.alert(
      ok ? 'E-posta gönderildi' : 'Gönderilemedi',
      ok ? 'Şifre yenileme bağlantısını e-postana gönderdik. İstenmeyen klasörünü de kontrol et.' : 'Adresi kontrol edip tekrar dene.'
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Segmented
        options={[
          { key: 'signup', label: 'Hesap oluştur' },
          { key: 'signin', label: 'Giriş yap' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
      />

      {mode === 'signup' ? (
        <>
          <Field
            label={role === 'vet' ? 'Ad soyad' : 'Adın'}
            value={name}
            onChangeText={setName}
            maxLength={60}
            autoComplete="name"
            textContentType="name"
            placeholder={role === 'vet' ? 'Ayşe Yılmaz' : 'Deniz'}
          />
          {role === 'vet' ? (
            <View style={{ marginBottom: 16 }}>
              <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>
                Unvan
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TITLES.map((x) => (
                  <Chip key={x} label={x} active={title === x} onPress={() => setTitle(x)} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      <Field
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder={role === 'vet' ? 'ornek@klinik.com' : 'ornek@eposta.com'}
      />
      <Field
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === 'signup' ? 'new-password' : 'password'}
        textContentType={mode === 'signup' ? 'newPassword' : 'password'}
        placeholder="En az 6 karakter"
      />

      {error ? (
        <Text variant="callout" tone="danger" style={{ marginBottom: 12 }}>
          {error}
        </Text>
      ) : null}

      <Button title={mode === 'signup' ? 'Hesap oluştur' : 'Giriş yap'} size="lg" full loading={busy} disabled={!ready} onPress={submit} />

      {mode === 'signin' ? (
        <Pressable onPress={forgot} hitSlop={10} accessibilityRole="button" style={{ alignSelf: 'center', marginTop: 16 }}>
          <Text variant="callout" tone="primary">
            Şifremi unuttum
          </Text>
        </Pressable>
      ) : (
        <Text variant="caption" tone="subtle" center style={{ marginTop: 14 }}>
          Devam ederek{' '}
          <Text variant="caption" tone="primary" onPress={() => Linking.openURL('https://patisos.app/kullanim-kosullari')}>
            Kullanım Koşulları
          </Text>{' '}
          ve{' '}
          <Text variant="caption" tone="primary" onPress={() => Linking.openURL('https://patisos.app/gizlilik-politikasi')}>
            Gizlilik Politikası
          </Text>
          'nı kabul edersin.
        </Text>
      )}
    </KeyboardAvoidingView>
  );
}
