import React, { useEffect } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Text, Card, Avatar, Badge, Group, ListRow } from '@/components/ds';
import { useSession } from '@/stores/session';
import { vetDisplayName } from '@/lib/auth';
import { unregisterVetDevice } from '@/lib/data/messages';
import { track } from '@/lib/analytics';
import { SUPPORT_EMAIL } from '@/lib/links';

const ROLE_LABEL = { owner: 'Evcil hayvan sahibi', vet: 'Veteriner hekim', vet_pending: 'Hekim · doğrulama bekliyor', guest: 'Misafir' } as const;

export default function AccountScreen() {
  const s = useSession();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  // Misafirse bu sayfa yerine giriş seçeneklerini göster
  useEffect(() => {
    if (s.ready && s.role === 'guest') router.replace('/auth');
  }, [s.ready, s.role]);

  if (s.role === 'guest') return <Screen>{null}</Screen>;

  const displayName = s.vet ? vetDisplayName(s.vet) : s.name ?? 'Pati dostu';

  const signOut = () =>
    Alert.alert('Çıkış yapılsın mı?', 'Acil kartların bu telefonda kalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: async () => {
          if (s.vet) await unregisterVetDevice(s.vet.clinic_id);
          await s.signOut();
          router.replace('/(tabs)');
        },
      },
    ]);

  const remove = () =>
    Alert.alert(
      'Hesabın silinsin mi?',
      'Hesabın ve profil bilgilerin kalıcı olarak silinir. Acil kartların bu telefonda kalmaya devam eder. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı sil',
          style: 'destructive',
          onPress: async () => {
            const res = await s.deleteAccount();
            if (res.ok) {
              track('account_deleted');
              Alert.alert('Hesabın silindi', `Topluluktaki gönderilerinin de silinmesini istersen ${SUPPORT_EMAIL} adresine yaz.`);
              router.replace('/(tabs)');
            } else Alert.alert('Silinemedi', res.message);
          },
        },
      ]
    );

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Hesabım" onBack={back} />
      <View style={{ paddingHorizontal: 20 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar label={displayName} size={60} />
          <View style={{ flex: 1 }}>
            <Text variant="headline" numberOfLines={1}>
              {displayName}
            </Text>
            {s.email ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {s.email}
              </Text>
            ) : null}
            <View style={{ marginTop: 6 }}>
              <Badge label={ROLE_LABEL[s.role]} tone={s.role === 'vet' ? 'primary' : s.role === 'vet_pending' ? 'honey' : 'neutral'} />
            </View>
          </View>
        </Card>

        <Group style={{ marginTop: 20 }}>
          {s.role === 'vet' || s.role === 'vet_pending' ? (
            <ListRow icon="medkit-outline" title="Hekim paneli" subtitle={s.vet?.clinic_name ?? 'Doğrulama durumu'} onPress={() => router.push('/vet')} />
          ) : null}
          <ListRow icon="chatbubbles-outline" title="Mesajlar" onPress={() => router.push('/messages')} />
          <ListRow icon="help-circle-outline" title="Topluluk" subtitle="Sorular ve yanıtlar" onPress={() => router.push('/community')} />
          <ListRow icon="id-card-outline" title="Acil kartlarım" onPress={() => router.push('/pets')} last />
        </Group>

        <Group style={{ marginTop: 20 }}>
          <ListRow
            icon="key-outline"
            title="Şifremi değiştir"
            subtitle="E-postana bağlantı gönderilir"
            onPress={async () => {
              const ok = s.email ? await s.resetPassword(s.email) : false;
              Alert.alert(ok ? 'E-posta gönderildi' : 'Gönderilemedi', ok ? 'Şifre yenileme bağlantısını e-postana gönderdik.' : 'Biraz sonra tekrar dene.');
            }}
          />
          <ListRow icon="log-out-outline" title="Çıkış yap" onPress={signOut} last />
        </Group>

        <Pressable onPress={remove} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', marginTop: 20, padding: 8 }}>
          <Text variant="callout" tone="danger">
            Hesabımı sil
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
