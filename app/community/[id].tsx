import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TextInput, Image, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Icon, IconButton, Avatar, Card, EmptyState, Button, IconBadge } from '@/components/ds';
import { ContentMenu, RulesSheet } from '@/components/community/Safety';
import { useTheme, radius, type } from '@/lib/theme';
import {
  subscribeQuestion,
  subscribeAnswers,
  postAnswer,
  deleteQuestion,
  deleteAnswer,
  toggleHelpful,
  getMyHelpful,
  markQuestionSeen,
  topicLabel,
  type Question,
  type Answer,
} from '@/lib/data/qa';
import { getBlockedUsers, hasAcceptedRules, acceptRules } from '@/lib/data/safety';
import { checkCommunityText } from '@/lib/utils/moderation';
import { timeAgo } from '@/lib/utils/time';
import { useSession } from '@/stores/session';
import { track } from '@/lib/analytics';

const SPECIES: Record<string, string> = { dog: 'Köpek', cat: 'Kedi', other: 'Diğer' };

type MenuTarget = { kind: 'question' | 'answer'; path: string; authorUid: string; authorName: string; isMine: boolean; onDelete: () => void };

export default function QuestionScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useSession((s) => s.uid);
  const vet = useSession((s) => s.vet);
  const [q, setQ] = useState<Question | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [helpful, setHelpful] = useState<Set<string>>(new Set());
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const [rules, setRules] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBlockedUsers().then((b) => setBlocked(new Set(b)));
    getMyHelpful().then((h) => setHelpful(new Set(h)));
    const u1 = subscribeQuestion(id, setQ);
    const u2 = subscribeAnswers(id, setAnswers);
    return () => {
      u1();
      u2();
    };
  }, [id]);

  useEffect(() => {
    if (q) markQuestionSeen(q);
  }, [q]);

  const visible = useMemo(() => answers.filter((a) => !blocked.has(a.author_uid)), [answers, blocked]);
  const vetAnswers = visible.filter((a) => a.is_vet);
  const others = visible.filter((a) => !a.is_vet);

  const send = async (skipRules = false) => {
    if (!q || !text.trim()) return;
    const problem = checkCommunityText(text);
    if (problem) {
      Alert.alert('Gönderilemedi', problem);
      return;
    }
    if (!skipRules && !(await hasAcceptedRules())) {
      setRules(true);
      return;
    }
    setSending(true);
    const res = await postAnswer(q, text);
    setSending(false);
    if (!res.ok) {
      Alert.alert('Gönderilemedi', res.message);
      return;
    }
    track('answer_posted', { question_id: q.id, vet: !!vet });
    setText('');
  };

  const onHelpful = async (a: Answer) => {
    const on = !helpful.has(a.id);
    setHelpful((s) => {
      const n = new Set(s);
      if (on) n.add(a.id);
      else n.delete(a.id);
      return n;
    });
    const ok = await toggleHelpful(a, on);
    if (!ok) {
      setHelpful((s) => {
        const n = new Set(s);
        if (on) n.delete(a.id);
        else n.add(a.id);
        return n;
      });
    }
  };

  const openAnswerMenu = (a: Answer) =>
    setMenu({
      kind: 'answer',
      path: `questions/${a.question_id}/answers/${a.id}`,
      authorUid: a.author_uid,
      authorName: a.author_name,
      isMine: a.author_uid === uid,
      onDelete: async () => {
        if (!(await deleteAnswer(a))) Alert.alert('Silinemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
      },
    });

  if (q === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} />
      </SafeAreaView>
    );
  }

  if (q === null || blocked.has(q.author_uid)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Geri" size={40} />
        </View>
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title={q === null ? 'Bu soru artık yok' : 'Bu kişiyi engelledin'}
          text={q === null ? 'Soru sahibi tarafından silinmiş ya da kurallara aykırı olduğu için kaldırılmış olabilir.' : 'Engellediğin kişilerin içeriklerini görmezsin.'}
          action={<Button title="Topluluğa dön" variant="secondary" onPress={() => router.replace('/community')} full />}
        />
      </SafeAreaView>
    );
  }

  const isMine = q.author_uid === uid;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 }}>
          <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))} accessibilityLabel="Geri" size={40} />
          <IconButton
            icon="ellipsis-horizontal"
            onPress={() =>
              setMenu({
                kind: 'question',
                path: `questions/${q.id}`,
                authorUid: q.author_uid,
                authorName: q.author_name,
                isMine,
                onDelete: async () => {
                  if (await deleteQuestion(q)) router.back();
                  else Alert.alert('Silinemedi', 'İnternet bağlantını kontrol edip tekrar dene.');
                },
              })
            }
            accessibilityLabel="Seçenekler"
            size={40}
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* Soru */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar label={q.author_name} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{q.author_name}</Text>
              <Text variant="caption" tone="subtle">
                {timeAgo(q.created_at)} · {topicLabel(q.topic)} · {SPECIES[q.species] ?? 'Diğer'}
              </Text>
            </View>
          </View>
          <Text variant="title" style={{ marginTop: 14, fontSize: 22, lineHeight: 28 }}>
            {q.title}
          </Text>
          {q.body ? (
            <Text variant="body" style={{ marginTop: 8 }}>
              {q.body}
            </Text>
          ) : null}
          {q.photo_url ? (
            <Image
              source={{ uri: q.photo_url }}
              style={{ width: width - 40, height: (width - 40) * 0.75, borderRadius: radius.lg, marginTop: 14, backgroundColor: t.surfaceAlt }}
              resizeMode="cover"
            />
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: t.surfaceAlt }}>
            <Icon name="information-circle-outline" size={18} color={t.textMuted} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              Yanıtlar bilgilendirme amaçlıdır, muayenenin yerini tutmaz. Durum kötüleşirse bir veterineri ara.
            </Text>
          </View>

          {/* Hekim yanıtları */}
          {vetAnswers.length > 0 ? (
            <View style={{ marginTop: 24 }}>
              <Text variant="headline" style={{ marginBottom: 10 }}>
                Veteriner hekim yanıtı
              </Text>
              {vetAnswers.map((a) => (
                <AnswerItem key={a.id} a={a} q={q} helpful={helpful.has(a.id)} onHelpful={() => onHelpful(a)} onMenu={() => openAnswerMenu(a)} />
              ))}
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Text variant="headline" style={{ marginBottom: 10 }}>
              {others.length > 0 ? `Yorumlar · ${others.length}` : 'Yorumlar'}
            </Text>
            {others.length === 0 ? (
              <Card tone="alt">
                <Text variant="callout" tone="muted">
                  {vetAnswers.length > 0
                    ? 'Benzer bir deneyimin varsa paylaşabilirsin.'
                    : isMine
                    ? 'Sorun toplulukta. Yanıt gelince ana sayfada ve Topluluk sekmesinde göreceksin.'
                    : 'Henüz yorum yok. Benzer bir deneyimin varsa ilk sen yaz.'}
                </Text>
              </Card>
            ) : (
              others.map((a) => (
                <AnswerItem key={a.id} a={a} q={q} helpful={helpful.has(a.id)} onHelpful={() => onHelpful(a)} onMenu={() => openAnswerMenu(a)} />
              ))
            )}
          </View>
        </ScrollView>

        {/* Yazma alanı */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.surface }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={vet ? 'Hekim olarak yanıtla…' : isMine ? 'Ek bilgi ya da teşekkür yaz…' : 'Yorum yaz…'}
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

      {menu ? (
        <ContentMenu
          visible
          onClose={() => setMenu(null)}
          kind={menu.kind}
          path={menu.path}
          authorUid={menu.authorUid}
          authorName={menu.authorName}
          isMine={menu.isMine}
          onDelete={menu.onDelete}
          onBlocked={() => getBlockedUsers().then((b) => setBlocked(new Set(b)))}
        />
      ) : null}
      <RulesSheet
        visible={rules}
        onClose={() => setRules(false)}
        onAccept={async () => {
          await acceptRules();
          setRules(false);
          send(true);
        }}
      />
    </SafeAreaView>
  );
}

function AnswerItem({ a, q, helpful, onHelpful, onMenu }: { a: Answer; q: Question; helpful: boolean; onHelpful: () => void; onMenu: () => void }) {
  const t = useTheme();
  const count = a.helpful;
  return (
    <View
      style={{
        backgroundColor: a.is_vet ? t.primarySoft : t.surface,
        borderRadius: radius.lg,
        borderWidth: a.is_vet ? 1.5 : 1,
        borderColor: a.is_vet ? t.primary : t.border,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {a.is_vet ? <IconBadge name="medkit" size={36} color={t.onPrimary} background={t.primary} /> : <Avatar label={a.author_name} size={32} />}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {a.author_name}
            </Text>
            {a.is_vet ? <Icon name="checkmark-circle" size={16} color={t.primary} /> : null}
            {!a.is_vet && a.author_uid === q.author_uid ? (
              <View style={{ backgroundColor: t.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1 }}>
                <Text variant="caption" tone="muted" style={{ fontSize: 11 }}>
                  Soru sahibi
                </Text>
              </View>
            ) : null}
          </View>
          {a.is_vet && a.vet_clinic_name ? (
            <Pressable onPress={() => a.vet_clinic_id && router.push(`/clinic/${a.vet_clinic_id}`)} accessibilityRole="link" hitSlop={6}>
              <Text variant="caption" tone="primary" numberOfLines={1}>
                Veteriner hekim · {a.vet_clinic_name}
              </Text>
            </Pressable>
          ) : (
            <Text variant="caption" tone="subtle">
              {timeAgo(a.created_at)}
            </Text>
          )}
        </View>
        <Pressable onPress={onMenu} hitSlop={10} accessibilityRole="button" accessibilityLabel="Seçenekler">
          <Icon name="ellipsis-horizontal" size={18} color={t.textSubtle} />
        </Pressable>
      </View>
      <Text variant="body" style={{ marginTop: 10 }}>
        {a.body}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <Pressable
          onPress={onHelpful}
          accessibilityRole="button"
          accessibilityState={{ selected: helpful }}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
        >
          <Icon name={helpful ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={helpful ? t.primary : t.textMuted} />
          <Text variant="caption" color={helpful ? t.primary : t.textMuted}>
            Faydalı{count > 0 ? ` · ${count}` : ''}
          </Text>
        </Pressable>
        {a.is_vet ? (
          <Text variant="caption" tone="subtle">
            {timeAgo(a.created_at)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
