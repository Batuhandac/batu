import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';

interface MockFriend {
  id: string;
  username: string;
  displayName: string;
  cardCount: number;
  tier: string;
  status: 'accepted' | 'pending_sent' | 'pending_received';
}

const MOCK_FRIENDS: MockFriend[] = [
  { id: '1', username: 'ahmetkaya', displayName: 'Ahmet K.', cardCount: 142, tier: 'Premium', status: 'accepted' },
  { id: '2', username: 'mehmetyil', displayName: 'Mehmet Y.', cardCount: 87, tier: 'Ücretsiz', status: 'accepted' },
  { id: '3', username: 'zeynep_tcg', displayName: 'Zeynep Kol.', cardCount: 310, tier: 'Pro', status: 'pending_sent' },
];

export default function FriendsScreen() {
  const { isGuest } = useAuthStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends');

  const accepted = MOCK_FRIENDS.filter((f) => f.status === 'accepted');
  const pendingSent = MOCK_FRIENDS.filter((f) => f.status === 'pending_sent');
  const pendingReceived = MOCK_FRIENDS.filter((f) => f.status === 'pending_received');

  const handleAdd = () => {
    if (!search.trim()) return;
    if (!isSupabaseConfigured || isGuest) {
      Alert.alert(
        'Demo Mod',
        'Arkadaş ekleme için gerçek bir hesap ve Supabase bağlantısı gereklidir.',
        [{ text: 'Tamam' }],
      );
      return;
    }
    Alert.alert('Arkadaş İsteği', `@${search.trim()} adlı kullanıcıya istek gönderildi.`);
    setSearch('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </Pressable>
        <Text style={styles.title}>Arkadaşlar</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabs}>
        {(
          [
            { key: 'friends', label: `Arkadaşlar (${accepted.length})` },
            { key: 'requests', label: `İstekler (${pendingReceived.length})` },
            { key: 'find', label: 'Bul' },
          ] as { key: typeof tab; label: string }[]
        ).map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {tab === 'friends' && (
          <>
            {accepted.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyTitle}>Henüz arkadaşın yok</Text>
                <Text style={styles.emptyText}>
                  Kullanıcı adıyla arkadaş bul ve koleksiyonlarınızı karşılaştırın.
                </Text>
              </View>
            ) : (
              accepted.map((friend) => (
                <FriendRow key={friend.id} friend={friend} />
              ))
            )}

            {pendingSent.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Gönderilen İstekler</Text>
                {pendingSent.map((friend) => (
                  <FriendRow key={friend.id} friend={friend} pending />
                ))}
              </>
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            {pendingReceived.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📬</Text>
                <Text style={styles.emptyTitle}>İstek yok</Text>
                <Text style={styles.emptyText}>Gelen arkadaşlık istekleri burada görünür.</Text>
              </View>
            ) : (
              pendingReceived.map((friend) => (
                <FriendRow key={friend.id} friend={friend} incoming />
              ))
            )}
          </>
        )}

        {tab === 'find' && (
          <View style={styles.findSection}>
            <Text style={styles.findTitle}>Kullanıcı Ara</Text>
            <Text style={styles.findSub}>
              Kullanıcı adıyla arkadaşlarını bul ve koleksiyonlarınızı karşılaştır.
            </Text>
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="kullanici_adi"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="none"
                />
              </View>
              <Pressable
                style={[styles.sendBtn, !search.trim() && styles.sendBtnDisabled]}
                onPress={handleAdd}
                disabled={!search.trim()}
              >
                <Text style={styles.sendBtnText}>Gönder</Text>
              </Pressable>
            </View>

            {isGuest && (
              <View style={styles.guestNote}>
                <Text style={styles.guestNoteText}>
                  ⚠️ Sosyal özellikler için gerçek hesap gereklidir. Misafir modundasınız.
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FriendRow({
  friend,
  pending,
  incoming,
}: {
  friend: MockFriend;
  pending?: boolean;
  incoming?: boolean;
}) {
  return (
    <View style={styles.friendRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{friend.displayName[0].toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.displayName}</Text>
        <Text style={styles.friendMeta}>
          @{friend.username} · {friend.cardCount} kart · {friend.tier}
        </Text>
      </View>
      {incoming && (
        <View style={styles.incomingBtns}>
          <Pressable style={styles.acceptBtn}>
            <Text style={styles.acceptBtnText}>✓</Text>
          </Pressable>
          <Pressable style={styles.rejectBtn}>
            <Text style={styles.rejectBtnText}>✕</Text>
          </Pressable>
        </View>
      )}
      {pending && (
        <View style={styles.pendingTag}>
          <Text style={styles.pendingText}>Bekliyor</Text>
        </View>
      )}
      {!pending && !incoming && (
        <Text style={styles.chevron}>›</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontSize: fontSize.md },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  tabLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
  content: { paddingHorizontal: spacing.xl },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '700' },
  friendInfo: { flex: 1 },
  friendName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  friendMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  incomingBtns: { flexDirection: 'row', gap: spacing.sm },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { color: colors.success, fontWeight: '700', fontSize: fontSize.md },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { color: colors.error, fontWeight: '700', fontSize: fontSize.md },
  pendingTag: {
    backgroundColor: colors.warningMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pendingText: { color: colors.warning, fontSize: fontSize.xs, fontWeight: '600' },
  chevron: { color: colors.textFaint, fontSize: 20 },
  findSection: { paddingTop: spacing.md, gap: spacing.lg },
  findTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  findSub: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 22 },
  searchRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  atSign: { color: colors.textMuted, fontSize: fontSize.md, marginRight: 2 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  guestNote: {
    backgroundColor: colors.warningMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  guestNoteText: { color: colors.warning, fontSize: fontSize.sm, lineHeight: 20 },
});
