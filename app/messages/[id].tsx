import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Icon, IconButton, Avatar, EmptyState, Button, Chip } from '@/components/ds';
import { ContentMenu } from '@/components/community/Safety';
import { useTheme, radius, type } from '@/lib/theme';
import {
  subscribeConversation,
  subscribeMessages,
  sendMessage,
  markConversationRead,
  fetchInbox,
  type Conversation,
  type Message,
} from '@/lib/data/messages';
import { containsProfanity } from '@/lib/utils/moderation';
import { getRegisteredClinic } from '@/lib/data/registry';
import { getClinicById } from '@/lib/data/query';
import { callClinic } from '@/lib/utils/call';
import { useSession } from '@/stores/session';
import { track } from '@/lib/analytics';

const QUICK = ['Merhaba, randevu almak istiyorum.', 'Bugün muayene için uygun musunuz?', 'Aşı takvimi hakkında bilgi almak istiyorum.'];

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugün';
  if (d.toDateString() === y.toDateString()) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export default function ChatScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useSession((s) => s.uid);
  const vet = useSession((s) => s.vet);
  const [conv, setConv] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    const u1 = subscribeConversation(id, setConv);
    const u2 = subscribeMessages(id, setMessages);
    return () => {
      u1();
      u2();
    };
  }, [id]);

  const asVet = !!vet && !!conv && vet.clinic_id === conv.clinic_id;

  useEffect(() => {
    if (conv) markConversationRead(conv, asVet ? 'vet' : 'user');
  }, [conv, asVet, messages.length]);

  useEffect(() => {
    if (conv && !asVet) fetchInbox(conv.clinic_id).then((i) => setHint(i?.response_hint ?? null));
  }, [conv?.clinic_id, asVet]);

  const clinicPhone = useMemo(() => {
    if (!conv) return null;
    return getRegisteredClinic(conv.clinic_id)?.phone ?? getClinicById(conv.clinic_id)?.phone ?? null;
  }, [conv?.clinic_id]);

  const send = async (body = text) => {
    if (!conv || !body.trim() || sending) return;
    if (containsProfanity(body)) {
      Alert.alert('Gönderilemedi', 'Mesajda uygunsuz bir ifade var. Lütfen saygılı bir dille yeniden yaz.');
      return;
    }
    setSending(true);
    const ok = await sendMessage(conv, body);
    setSending(false);
    if (!ok) {
      Alert.alert('Gönderilemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
      return;
    }
    track('message_sent', { role: asVet ? 'vet' : 'user' });
    setText('');
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/messages'));

  if (conv === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} />
      </SafeAreaView>
    );
  }
  if (conv === null || !uid) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <IconButton icon="chevron-back" onPress={back} accessibilityLabel="Geri" size={40} />
        </View>
        <EmptyState icon="chatbubbles-outline" title="Konuşma açılamadı" text="İnternet bağlantını kontrol edip tekrar dene." />
      </SafeAreaView>
    );
  }

  const title = asVet ? conv.user_name : conv.clinic_name;
  const subtitle = asVet ? conv.pet_summary ?? 'Hasta sahibi' : hint ?? 'Klinik mesajlarını ilk fırsatta yanıtlar';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Üst bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <IconButton icon="chevron-back" onPress={back} accessibilityLabel="Geri" size={40} variant="plain" />
          <Pressable
            onPress={() => !asVet && router.push(`/clinic/${conv.clinic_id}`)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
            accessibilityRole={asVet ? undefined : 'link'}
          >
            <Avatar label={title} size={38} background={asVet ? t.honeySoft : t.primarySoft} color={asVet ? t.honey : t.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {title}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </Pressable>
          {!asVet && clinicPhone ? (
            <IconButton icon="call" variant="soft" onPress={() => callClinic({ id: conv.clinic_id, name: conv.clinic_name, phone: clinicPhone }, 'chat')} accessibilityLabel="Kliniği ara" size={40} />
          ) : null}
          <IconButton icon="ellipsis-horizontal" variant="plain" onPress={() => setMenu(true)} accessibilityLabel="Seçenekler" size={40} />
        </View>

        <ScrollView
          ref={scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        >
          {!asVet ? (
            <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: t.sosSoft, marginBottom: 16 }}>
              <Icon name="alert-circle" size={18} color={t.sos} />
              <Text variant="caption" style={{ flex: 1 }}>
                Acil durumda mesaj yazma, {clinicPhone ? 'yukarıdan hemen ara' : 'hemen bir veterineri ara'}. Mesajlar geç yanıtlanabilir.
              </Text>
            </View>
          ) : conv.pet_summary ? (
            <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: t.primarySoft, marginBottom: 16 }}>
              <Icon name="paw" size={18} color={t.primary} />
              <Text variant="caption" style={{ flex: 1 }}>
                {conv.pet_summary}
              </Text>
            </View>
          ) : null}

          {messages.length === 0 && !asVet ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text variant="callout" tone="muted" center>
                {conv.clinic_name} ile ilk mesajını yaz.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 }}>
                {QUICK.map((q) => (
                  <Chip key={q} label={q} onPress={() => setText(q)} />
                ))}
              </View>
            </View>
          ) : null}

          {messages.map((m, i) => {
            const mine = m.sender_uid === uid;
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
            return (
              <View key={m.id}>
                {newDay ? (
                  <Text variant="caption" tone="subtle" center style={{ marginVertical: 10 }}>
                    {dayLabel(m.created_at)}
                  </Text>
                ) : null}
                <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                  <View
                    style={{
                      maxWidth: '82%',
                      backgroundColor: mine ? t.primary : t.surface,
                      borderWidth: mine ? 0 : 1,
                      borderColor: t.border,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 6 : 18,
                      borderBottomLeftRadius: mine ? 18 : 6,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                    }}
                  >
                    {!mine && m.sender_role === 'vet' && !asVet ? (
                      <Text variant="caption" tone="primary" style={{ marginBottom: 2 }}>
                        {m.sender_name}
                      </Text>
                    ) : null}
                    <Text variant="body" color={mine ? t.onPrimary : t.text}>
                      {m.text}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 2, opacity: mine ? 0.75 : 1 }}>
                      <Text variant="caption" color={mine ? t.onPrimary : t.textSubtle} style={{ fontSize: 11 }}>
                        {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {mine ? <Icon name={m.pending ? 'time-outline' : 'checkmark'} size={12} color={t.onPrimary} /> : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.surface }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Mesaj yaz…"
            placeholderTextColor={t.textSubtle}
            multiline
            maxLength={2000}
            style={[type.body, { flex: 1, maxHeight: 120, minHeight: 44, color: t.text, backgroundColor: t.bg, borderRadius: 22, borderWidth: 1, borderColor: t.border, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11 }]}
          />
          {sending ? (
            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={t.primary} />
            </View>
          ) : (
            <IconButton icon="arrow-up" variant={text.trim() ? 'primary' : 'soft'} onPress={() => send()} accessibilityLabel="Gönder" size={44} />
          )}
        </View>
      </KeyboardAvoidingView>

      <ContentMenu
        visible={menu}
        onClose={() => setMenu(false)}
        kind="message"
        path={`conversations/${conv.id}`}
        authorUid={asVet ? conv.user_uid : null}
        authorName={title}
        isMine={false}
      />
    </SafeAreaView>
  );
}
