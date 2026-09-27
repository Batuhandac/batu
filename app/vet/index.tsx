import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Text, Field, Button, Card, Group, ListRow, SwitchRow, IconBadge, Icon } from '@/components/ds';
import { Art } from '@/components/art';
import { useTheme } from '@/lib/theme';
import { useSession } from '@/stores/session';
import { vetDisplayName } from '@/lib/auth';
import { fetchInbox, setInboxOpen, registerVetDevice, unregisterVetDevice, type ClinicInbox } from '@/lib/data/messages';
import { useUnreadMessages } from '@/lib/hooks/useCommunity';

export default function VetPanelScreen() {
  const role = useSession((s) => s.role);
  const vet = useSession((s) => s.vet);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings'));
  const title = role === 'vet' ? 'Hekim paneli' : role === 'vet_pending' ? 'Doğrulama' : 'Veteriner hekimler';
  const subtitle = vet ? vet.clinic_name : role === 'vet_pending' ? 'Hesabınız oluşturuldu' : 'Ücretsiz, reklamsız klinik hesabı';
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title={title} subtitle={subtitle} onBack={back} />
      {role === 'vet' ? <Panel /> : role === 'vet_pending' ? <Pending /> : <Intro />}
    </Screen>
  );
}

function Intro() {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Art name="vet" width={220} />
      </View>
      <Text variant="body" tone="muted" style={{ marginBottom: 20 }}>
        Doğrulanan klinikler hasta sahiplerinin mesajlarını yanıtlar, topluluktaki sorulara kliniğinin adıyla ve
        "Veteriner hekim" rozetiyle cevap verir. Ücretsizdir; sıralama satın alınamaz.
      </Text>
      <Button title="Hekim hesabı oluştur" size="lg" full onPress={() => router.push('/auth/vet')} />
      <Button title="Giriş yap" variant="secondary" full onPress={() => router.push('/auth/vet?mode=signin')} style={{ marginTop: 10 }} />
      <Card tone="alt" style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <IconBadge name="call-outline" size={40} color={t.primary} background={t.surface} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Hesap açmadan yalnızca klinik bilgilerinizi düzeltmek isterseniz de başvurabilirsiniz.
          </Text>
        </View>
        <Button title="Klinik bilgilerini doğrula" variant="ghost" onPress={() => router.push('/vets')} style={{ alignSelf: 'flex-start', marginLeft: -12, marginTop: 4 }} />
      </Card>
    </View>
  );
}

function Pending() {
  const t = useTheme();
  const { refreshRole, signOut, name } = useSession();
  const [checking, setChecking] = useState(false);
  const steps = [
    { title: 'Hesap oluşturuldu', done: true },
    { title: 'Kliniğinizi seçip başvurun', done: false, action: true },
    { title: 'Telefonla doğrulama', done: false },
  ];
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Card>
        <Text variant="bodyStrong">Hoş geldiniz{name ? `, ${name}` : ''}</Text>
        <Text variant="callout" tone="muted" style={{ marginTop: 4 }}>
          Başvurunuzu aldıktan sonra kliniğin numarasını arayarak doğruluyoruz; genelde aynı gün tamamlanır. Onaylanınca
          bu sayfa hekim panelinize dönüşür.
        </Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          {steps.map((st, i) => (
            <View key={st.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: st.done ? t.primary : t.surfaceAlt,
                }}
              >
                {st.done ? (
                  <Icon name="checkmark" size={15} color={t.onPrimary} />
                ) : (
                  <Text variant="caption" color={t.textMuted} style={{ fontSize: 12 }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text variant="callout" style={{ flex: 1 }}>
                {st.title}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      <Button title="Kliniğimi seç ve başvur" size="lg" full onPress={() => router.push('/vets')} style={{ marginTop: 20 }} />
      <Button
        title="Durumu yenile"
        variant="secondary"
        full
        loading={checking}
        onPress={async () => {
          setChecking(true);
          await refreshRole();
          setChecking(false);
        }}
        style={{ marginTop: 10 }}
      />
      <Button title="Çıkış yap" variant="ghost" onPress={() => signOut()} style={{ marginTop: 16 }} />
    </View>
  );
}

function Panel() {
  const t = useTheme();
  const vet = useSession((s) => s.vet)!;
  const signOut = useSession((s) => s.signOut);
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
                await signOut();
              },
            },
          ])
        }
      />
    </View>
  );
}
