import React from 'react';
import { View, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen, Text, Group, ListRow, LogoMark, Wordmark } from '@/components/ds';
import { Disclaimer } from '@/components/ui/Disclaimer';

function GroupTitle({ children }: { children: string }) {
  return (
    <Text variant="overline" tone="subtle" style={{ marginTop: 24, marginBottom: 8, marginLeft: 4 }}>
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  return (
    <Screen scroll contentStyle={{ paddingHorizontal: 20 }}>
      <Text variant="title" style={{ marginTop: 12 }}>
        Ayarlar
      </Text>

      <GroupTitle>Uygulama</GroupTitle>
      <Group>
        <ListRow icon="paw-outline" title="Acil kartlarım" subtitle="Dostlarının sağlık bilgileri" onPress={() => router.push('/(tabs)/pets')} />
        <ListRow icon="bandage-outline" title="İlk yardım rehberi" subtitle="Veterinere ulaşana kadar" onPress={() => router.push('/first-aid')} />
        <ListRow icon="add-circle-outline" title="Bildiğin bir kliniği ekle" subtitle="Kontrol edildikten sonra yayınlanır" onPress={() => router.push('/clinic/add')} last />
      </Group>

      <GroupTitle>İzinler</GroupTitle>
      <Group>
        <ListRow icon="location-outline" title="Konum izni" onPress={() => Linking.openSettings()} />
        <ListRow icon="notifications-outline" title="Bildirim izni" onPress={() => Linking.openSettings()} last />
      </Group>

      <GroupTitle>Veteriner hekimler</GroupTitle>
      <Group>
        <ListRow icon="medical-outline" title="Kliniğinizi doğrulayın" subtitle="Ücretsiz, reklam değil" onPress={() => router.push('/vets')} last />
      </Group>

      <GroupTitle>Hakkında</GroupTitle>
      <Group>
        <ListRow icon="document-text-outline" title="Kullanım koşulları" onPress={() => Linking.openURL('https://patisos.app/kullanim-kosullari')} />
        <ListRow icon="lock-closed-outline" title="Gizlilik politikası" onPress={() => Linking.openURL('https://patisos.app/gizlilik-politikasi')} />
        <ListRow
          icon="layers-outline"
          title="Veri kaynakları"
          onPress={() =>
            Alert.alert(
              'Veri kaynakları',
              'Klinik bilgileri: © OpenStreetMap katkıcıları (ODbL lisansı), Google Maps ve kliniklerin kendi onayladığı bilgiler. Kullanıcıların eklediği klinikler kontrol edildikten sonra yayınlanır.'
            )
          }
        />
        <ListRow
          icon="trash-outline"
          title="Verilerim ve silme talebi"
          onPress={() =>
            Alert.alert(
              'Verilerin',
              'Acil kartların, favorilerin ve konumun yalnızca bu telefonda saklanır; uygulamayı silmek hepsini siler. Gönderdiğin yorum, fotoğraf ya da bildirimlerin silinmesi için support@patisos.app adresine yaz; KVKK kapsamında 30 gün içinde yanıtlanır.'
            )
          }
          last
        />
      </Group>

      <Disclaimer />

      <View style={{ alignItems: 'center', marginTop: 28, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LogoMark size={22} />
          <Wordmark size={15} />
        </View>
        <Text variant="caption" tone="subtle">
          Sürüm {Constants.expoConfig?.version ?? '1.0.0'} · Türkiye'de sevgiyle yapıldı
        </Text>
      </View>
    </Screen>
  );
}
