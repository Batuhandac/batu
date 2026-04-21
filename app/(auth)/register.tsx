import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, fontSize, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp, loading } = useAuthStore();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    if (username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setError('');
    try {
      await signUp(email.trim().toLowerCase(), password, username.trim());
      router.replace('/(main)/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Geri</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Hesap oluştur</Text>
            <Text style={styles.subtitle}>Koleksiyonunla tanışmaya hazır mısın?</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Kullanıcı Adı"
              placeholder="kullaniciadi"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              hint="En az 3 karakter, sadece harf/rakam/_"
            />
            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Şifre"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              hint="En az 6 karakter"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Button
            label="Ücretsiz Kayıt Ol"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleRegister}
            style={styles.btn}
          />

          <Text style={styles.terms}>
            Kayıt olarak{' '}
            <Text style={styles.termsLink}>Kullanım Koşulları</Text>'nı ve{' '}
            <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı kabul etmiş olursunuz.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}>Giriş yap</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  backBtn: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backText: {
    color: colors.primary,
    fontSize: fontSize.md,
  },
  header: {
    marginBottom: spacing.xxxl,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  btn: { width: '100%' },
  terms: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
  termsLink: { color: colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textMuted, fontSize: fontSize.md },
  footerLink: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
});
