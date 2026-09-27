import React, { useEffect, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, Text, Avatar, Button, Icon } from '@/components/ds';
import { Art } from '@/components/art';
import { useTheme, radius, fonts } from '@/lib/theme';
import { subscribeMyConversations, subscribeClinicConversations, type Conversation } from '@/lib/data/messages';
import { getBlockedUsers } from '@/lib/data/safety';
import { useSession } from '@/stores/session';
import { shortTime } from '@/lib/utils/time';

export default function MessagesScreen() {
  const t = useTheme();
  const uid = useSession((s) => s.uid);
  const vet = useSession((s) => s.vet);
  const [list, setList] = useState<Conversation[] | null>(null);

  useEffect(() => {
    if (!uid) {
      setList([]);
      return;
    }
    if (!vet) return subscribeMyConversations(uid, setList);
    // Hekim, engellediği kullanıcıların konuşmalarını görmez
    return subscribeClinicConversations(vet.clinic_id, (all) =>
      getBlockedUsers().then((b) => setList(all.filter((c) => !b.has(c.user_uid))))
    );
  }, [uid, vet]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <Screen>
      <Header
        title={vet ? 'Klinik gelen kutusu' : 'Mesajlar'}
        subtitle={vet ? vet.clinic_name : 'Kliniklerle yazışmaların'}
        onBack={back}
      />
      <FlatList
        data={list ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          const unread = vet ? item.vet_unread : item.user_unread;
          const name = vet ? item.user_name : item.clinic_name;
          return (
            <Pressable
              onPress={() => router.push(`/messages/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${name}${unread ? ', okunmamış mesaj' : ''}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: pressed ? t.surfaceAlt : 'transparent',
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: t.border,
              })}
            >
              <Avatar label={name} size={48} background={vet ? t.honeySoft : t.primarySoft} color={vet ? t.honey : t.primary} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {name}
                  </Text>
                  <Text variant="caption" color={unread ? t.primary : t.textSubtle}>
                    {shortTime(item.last_at)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Text variant="callout" tone={unread ? 'default' : 'muted'} numberOfLines={1} style={[{ flex: 1 }, unread ? { fontFamily: fonts.bold } : null]}>
                    {(item.last_sender === (vet ? 'vet' : 'user') ? 'Sen: ' : '') + item.last_text}
                  </Text>
                  {unread > 0 ? (
                    <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                      <Text variant="caption" color={t.onPrimary} style={{ fontSize: 11, lineHeight: 13 }}>
                        {unread > 9 ? '9+' : unread}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          list === null ? null : (
            <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 24 }}>
              <Art name="chat" width={220} />
              <Text variant="headline" center style={{ marginTop: 12 }}>
                {vet ? 'Henüz mesaj yok' : 'Henüz mesajın yok'}
              </Text>
              <Text variant="callout" tone="muted" center style={{ marginTop: 6 }}>
                {vet
                  ? 'Hasta sahipleri kliniğinizin sayfasındaki "Mesaj gönder" düğmesiyle size yazabilir. Yeni mesajda bildirim alırsınız.'
                  : 'Mesajlaşmaya açık kliniklerin sayfasında "Mesaj gönder" düğmesini görürsün. Randevu, aşı ya da acil olmayan soruların için yazabilirsin.'}
              </Text>
              {!vet ? <Button title="Klinikleri gör" variant="soft" onPress={() => router.push('/nearby')} style={{ marginTop: 18 }} /> : null}
            </View>
          )
        }
        ListFooterComponent={
          !vet ? (
            <View style={{ flexDirection: 'row', gap: 10, margin: 20, padding: 14, borderRadius: radius.md, backgroundColor: t.sosSoft }}>
              <Icon name="alert-circle-outline" size={18} color={t.sos} />
              <Text variant="caption" style={{ flex: 1 }}>
                Mesajlar acil durumlar için değildir; klinik geç yanıt verebilir. Acil durumda hemen ara.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
