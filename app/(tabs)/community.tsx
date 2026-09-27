import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Chip, Button, IconButton, EmptyState, Icon } from '@/components/ds';
import { QuestionCard } from '@/components/community/QuestionCard';
import { useTheme } from '@/lib/theme';
import { fetchQuestions, type Question, type QuestionCursor } from '@/lib/data/qa';
import { getBlockedUsers } from '@/lib/data/safety';
import { useMyQuestions, useUnreadMessages } from '@/lib/hooks/useCommunity';
import { useSession } from '@/stores/session';
import { vetDisplayName } from '@/lib/auth';

type Filter = 'all' | 'dog' | 'cat' | 'vet' | 'open' | 'mine';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'dog', label: 'Köpek' },
  { key: 'cat', label: 'Kedi' },
  { key: 'vet', label: 'Hekim yanıtladı' },
  { key: 'open', label: 'Yanıt bekleyen' },
  { key: 'mine', label: 'Sorularım' },
];

export default function CommunityScreen() {
  const t = useTheme();
  const vet = useSession((s) => s.vet);
  const unreadMessages = useUnreadMessages();
  const my = useMyQuestions();
  const [filter, setFilter] = useState<Filter>(vet ? 'open' : 'all');
  const [items, setItems] = useState<Question[]>([]);
  const [cursor, setCursor] = useState<QuestionCursor>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [res, b] = await Promise.all([fetchQuestions(), getBlockedUsers()]);
    setBlocked(new Set(b));
    if (!res) {
      setState((s) => (s === 'ready' ? s : 'error'));
      return;
    }
    setItems(res.items);
    setCursor(res.cursor);
    setState('ready');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      my.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, my.reload])
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), my.reload()]);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!cursor || loadingMore || filter === 'mine') return;
    setLoadingMore(true);
    const res = await fetchQuestions(cursor);
    if (res) {
      setItems((prev) => [...prev, ...res.items.filter((q) => !prev.some((p) => p.id === q.id))]);
      setCursor(res.cursor);
    }
    setLoadingMore(false);
  };

  const visible = useMemo(() => {
    const base = filter === 'mine' ? my.mine : items;
    return base.filter((q) => {
      if (blocked.has(q.author_uid)) return false;
      switch (filter) {
        case 'dog':
        case 'cat':
          return q.species === filter;
        case 'vet':
          return q.has_vet_answer;
        case 'open':
          return q.answer_count === 0;
        default:
          return true;
      }
    });
  }, [filter, items, my.mine, blocked]);

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, paddingHorizontal: 20, paddingTop: 4, minHeight: 44 }}>
        <View>
          <IconButton icon="chatbubbles-outline" variant="plain" onPress={() => router.push('/messages')} accessibilityLabel="Mesajlar" size={36} />
          {unreadMessages > 0 ? (
            <View style={{ position: 'absolute', top: -2, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.sos, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text variant="caption" color={t.onSos} style={{ fontSize: 11, lineHeight: 13, fontWeight: '600' }}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Text>
            </View>
          ) : null}
        </View>
        <Button title="Soru sor" size="sm" icon="create-outline" onPress={() => router.push('/community/ask')} />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="display">Topluluk</Text>
        <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
          {vet
            ? `Hoş geldiniz, ${vetDisplayName(vet)}. Yanıtlarınız kliniğinizin adıyla ve "Veteriner hekim" etiketiyle görünür.`
            : 'Acil olmayan soruların için. Onaylı veteriner hekimler ve pati sahipleri yanıtlar.'}
        </Text>
        <Pressable
          onPress={() => router.push('/emergency')}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, opacity: pressed ? 0.6 : 1 })}
        >
          <Icon name="alert-circle-outline" size={17} color={t.sos} />
          <Text variant="callout" tone="sos" style={{ flex: 1 }}>
            Acil bir durum mu? Soru yazma, hemen ara.
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 16 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.key === 'mine' && my.total > 0 ? `${f.label} · ${my.total} yeni` : f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const empty =
    state === 'loading' ? (
      <ActivityIndicator color={t.primary} style={{ marginTop: 32 }} />
    ) : state === 'error' && filter !== 'mine' ? (
      <EmptyState
        icon="cloud-offline-outline"
        title="Topluluğa şu anda ulaşılamıyor"
        text="İnternet bağlantını kontrol edip tekrar dene."
        action={<Button title="Tekrar dene" variant="secondary" onPress={() => { setState('loading'); load(); }} full />}
      />
    ) : filter === 'mine' ? (
      <EmptyState
        icon="chatbubble-ellipses-outline"
        title="Henüz soru sormadın"
        text="Sorduğun sorular ve gelen yanıtlar burada görünür."
        action={<Button title="İlk sorunu sor" onPress={() => router.push('/community/ask')} full />}
      />
    ) : (
      <EmptyState
        icon="chatbubbles-outline"
        title={filter === 'all' ? 'İlk soruyu sen sor' : 'Bu filtrede soru yok'}
        text={filter === 'all' ? 'Sorun, senden sonra gelen pati sahiplerine de yol gösterecek.' : 'Başka bir filtre seçebilir ya da yeni bir soru sorabilirsin.'}
        action={<Button title="Soru sor" onPress={() => router.push('/community/ask')} full />}
      />
    );

  return (
    <Screen>
      <FlatList
        data={visible}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <QuestionCard q={item} unread={my.unread[item.id] ?? 0} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={t.primary} style={{ marginVertical: 16 }} /> : <View style={{ height: 24 }} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
