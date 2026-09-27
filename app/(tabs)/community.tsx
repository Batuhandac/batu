import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Text, Chip, Button, IconButton, EmptyState, Icon } from '@/components/ds';
import { Art } from '@/components/art';
import { QuestionCard } from '@/components/community/QuestionCard';
import { useTheme, radius, palette, shadow } from '@/lib/theme';
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Topluluk</Text>
          <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
            Pati sahipleri ve veteriner hekimler
          </Text>
        </View>
        <View>
          <IconButton icon="chatbubbles-outline" onPress={() => router.push('/messages')} accessibilityLabel="Mesajlar" size={42} />
          {unreadMessages > 0 ? (
            <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.sos, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: t.bg }}>
              <Text variant="caption" color={t.onSos} style={{ fontSize: 10, lineHeight: 12 }}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Tanıtım kartı */}
      <View style={{ marginHorizontal: 20, marginTop: 16, borderRadius: radius.xl, backgroundColor: palette.teal[700], overflow: 'hidden', flexDirection: 'row' }}>
        <View style={{ flex: 1, padding: 18, paddingRight: 4 }}>
          <Text variant="headline" color="#FFFFFF">
            {vet ? `Hoş geldiniz, ${vetDisplayName(vet)}` : 'Veterinere sor'}
          </Text>
          <Text variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>
            {vet
              ? 'Yanıtlarınız kliniğinizin adıyla ve "Veteriner hekim" rozetiyle görünür.'
              : 'Acil olmayan soruların için. Onaylı hekimler ve deneyimli pati sahipleri yanıtlar.'}
          </Text>
          <Pressable
            onPress={() => router.push('/community/ask')}
            accessibilityRole="button"
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FFFFFF',
              borderRadius: radius.pill,
              paddingHorizontal: 16,
              height: 38,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Icon name="create-outline" size={17} color={palette.teal[700]} />
            <Text variant="caption" color={palette.teal[700]} style={{ fontSize: 14 }}>
              Soru sor
            </Text>
          </Pressable>
        </View>
        <View style={{ justifyContent: 'center', marginRight: -8 }}>
          <Art name="community" width={130} onColor />
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/emergency')}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: t.sosSoft }}
      >
        <Icon name="alert-circle" size={18} color={t.sos} />
        <Text variant="caption" style={{ flex: 1 }}>
          Acil bir durum mu? Soru yazma, <Text variant="caption" tone="sos">hemen bir veterineri ara.</Text>
        </Text>
        <Icon name="chevron-forward" size={16} color={t.sos} />
      </Pressable>

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
          loadingMore ? <ActivityIndicator color={t.primary} style={{ marginVertical: 16 }} /> : <View style={{ height: 90 }} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
        showsVerticalScrollIndicator={false}
      />
      <Pressable
        onPress={() => router.push('/community/ask')}
        accessibilityRole="button"
        accessibilityLabel="Soru sor"
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 52,
          paddingHorizontal: 20,
          borderRadius: 26,
          backgroundColor: pressed ? t.primaryPressed : t.primary,
          ...shadow(t, 2),
        })}
      >
        <Icon name="create" size={19} color={t.onPrimary} />
        <Text variant="button" color={t.onPrimary}>
          Soru sor
        </Text>
      </Pressable>
    </Screen>
  );
}
