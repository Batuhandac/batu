import React, { useState } from 'react';
import { View, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen, Text, Group, ListRow, LogoMark, Wordmark, Card, Avatar, IconBadge, Icon } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { RulesSheet } from '@/components/community/Safety';
import { unblockAll } from '@/lib/data/safety';
import { useSession } from '@/stores/session';
import { vetDisplayName } from '@/lib/auth';

function GroupTitle({ children }: { children: string }) {
  return (
    <Text variant="overline" tone="subtle" style={{ marginTop: 24, marginBottom: 8, marginLeft: 4 }}>
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const t = useTheme();
  const { vet, role, name, email } = useSession();
  const [rules, setRules] = useState(false);
  const guest = role === 'guest';
  const displayName = vet ? vetDisplayName(vet) : name ?? 'Hesabım';
  return (
    <Screen scroll contentStyle={{ paddingHorizontal: 20 }}>
      <Text variant="title" style={{ marginTop: 12 }}>
        Ayarlar
      </Text>

      {/* Hesap */}
      <Card onPress={() => router.push(guest ? '/auth' : '/account')} style={{ marginTop: 16 }} accessibilityLabel={guest ? 'Hesap oluştur ya da giriş yap' : 'Hesabım'}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {guest ? (
            <IconBadge name="person-outline" size={52} />
          ) : (
            <Avatar label={displayName} size={52} background={vet ? t.honeySoft : t.primarySoft} color={vet ? t.honey : t.primary} />
          )}
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {guest ? 'Hesap oluştur ya da giriş yap' : displayName}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={2}>
              {guest ? 'Acil kartların güvende kalsın, toplulukta soru sor, kliniklerle mesajlaş.' : email ?? ''}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={t.textSubtle} />
        </View>
      </Card>

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

      <GroupTitle>Topluluk</GroupTitle>
      <Group>
        <ListRow icon="chatbubbles-outline" title="Mesajlar" subtitle="Kliniklerle yazışmaların" onPress={() => router.push('/messages')} />
        <ListRow icon="shield-checkmark-outline" title="Topluluk kuralları" onPress={() => setRules(true)} />
        <ListRow
          icon="ban-outline"
          title="Engellediğin kişiler"
          subtitle="Engellemeleri kaldır"
          onPress={() =>
            Alert.alert('Engellemeler kaldırılsın mı?', 'Engellediğin kişilerin soru ve yorumlarını yeniden görürsün.', [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Kaldır', onPress: () => unblockAll() },
            ])
          }
          last
        />
      </Group>

      <GroupTitle>Veteriner hekimler</GroupTitle>
      <Group>
        {vet ? (
          <ListRow icon="medkit" title="Hekim paneli" subtitle={vet.clinic_name} onPress={() => router.push('/vet')} last />
        ) : (
          <ListRow icon="medkit-outline" title="Veteriner hekim misiniz?" subtitle="Ücretsiz klinik hesabı, reklam değil" onPress={() => router.push('/vet')} last />
        )}
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
              'Acil kartların, favorilerin ve konumun yalnızca bu telefonda saklanır; uygulamayı silmek hepsini siler. Topluluktaki soru ve yorumlarını kendin silebilirsin. Mesajların, fotoğrafların ya da diğer gönderilerinin silinmesi için support@patisos.app adresine yaz; KVKK kapsamında 30 gün içinde yanıtlanır.'
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
      <RulesSheet visible={rules} onClose={() => setRules(false)} onAccept={() => setRules(false)} />
    </Screen>
  );
}
