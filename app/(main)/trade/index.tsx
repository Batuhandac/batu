import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { TipsCard } from '@/components/trade/TipsCard';
import { InfoBanner } from '@/components/trade/InfoBanner';
import { Button } from '@/components/ui/Button';
import { GAME_CONFIG } from '@/constants/games';
import { useCollectionStore } from '@/stores/collectionStore';
import { useAuthStore } from '@/stores/authStore';

const MOCK_FRIENDS: DropdownOption[] = [
  { label: 'Tüm Arkadaşlar', value: 'all' },
  { label: 'Ahmet K.', value: 'friend-1' },
  { label: 'Mehmet Y.', value: 'friend-2' },
];

const EXPANSION_OPTIONS: DropdownOption[] = [
  { label: 'Set Seçilmedi', value: '' },
  ...Object.values(GAME_CONFIG).flatMap((g) =>
    g.sets.map((s) => ({ label: `${s}`, value: s })),
  ),
];

export default function TradeScreen() {
  const [showTips, setShowTips] = useState(true);
  const [goalExpansion, setGoalExpansion] = useState('');
  const [goalFolder, setGoalFolder] = useState('');
  const [friend, setFriend] = useState('all');
  const [scope, setScope] = useState('');

  const { folders } = useCollectionStore();
  const { user } = useAuthStore();

  const hasFriends = MOCK_FRIENDS.length > 1;

  const folderOptions: DropdownOption[] = [
    { label: 'Belirli Klasör Yok', value: '' },
    ...folders.map((f) => ({ label: f.name, value: f.id })),
  ];

  const myFolderOptions: DropdownOption[] = [
    { label: 'Set Seçilmedi', value: '' },
    ...folders.map((f) => ({ label: f.name, value: f.id })),
  ];

  const selectedFriendLabel = MOCK_FRIENDS.find((f) => f.value === friend)?.label ?? 'Tüm Arkadaşlar';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>Takas</Text>
        <Dropdown
          options={folderOptions}
          value={scope}
          placeholder="Belirli Klasör Yok"
          icon={<Text style={styles.dropIcon}>📁</Text>}
          onChange={setScope}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.subtitle}>
          Tamamlamak istediğini seç, ardından bir arkadaş seç ya da tümünde ara.
        </Text>

        {!hasFriends && (
          <InfoBanner
            title="Başlamak için arkadaş ekle"
            message="Takas fırsatlarını bulmak için en az bir arkadaşa ihtiyacın var."
            onAction={() => {}}
          />
        )}

        <TradeSection
          icon="✨"
          title="Hedef"
          subtitle="Arkadaşlarının kartlarıyla tamamlamak istediğin seti veya klasörü seç."
        >
          <View style={styles.twoCol}>
            <View style={styles.colWrap}>
              <Text style={styles.colLabel}>📚 Set</Text>
              <Dropdown
                options={EXPANSION_OPTIONS}
                value={goalExpansion}
                placeholder="Set"
                onChange={setGoalExpansion}
              />
            </View>
            <View style={styles.colWrap}>
              <Text style={styles.colLabel}>📁 Klasör</Text>
              <Dropdown
                options={myFolderOptions}
                value={goalFolder}
                placeholder="Klasör"
                onChange={setGoalFolder}
              />
            </View>
          </View>
        </TradeSection>

        <TradeSection
          icon="👥"
          title="Arkadaş"
          subtitle="Belirli bir arkadaşınla takas yap ya da arkadaş listende ara."
        >
          <Dropdown
            options={MOCK_FRIENDS}
            value={friend}
            placeholder="Tüm Arkadaşlar"
            icon={<Text>👥</Text>}
            onChange={setFriend}
          />
        </TradeSection>

        <TradeSection
          icon="📁"
          title="Kapsam"
          subtitle="İsteğe bağlı olarak sonuçları arkadaşının belirli bir klasörüne, örneğin takas klasörüne daralt."
        >
          <Dropdown
            options={folderOptions}
            value={scope}
            placeholder="Belirli Klasör Yok"
            icon={<Text>📁</Text>}
            onChange={setScope}
          />
        </TradeSection>

        {showTips && (
          <View>
            <TipsCard />
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Devam Et"
          variant="primary"
          size="lg"
          style={styles.continueBtn}
          onPress={() => {
            setShowTips(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function TradeSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionIconWrap}>
        <Text style={styles.sectionIcon}>{icon}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    flexShrink: 0,
  },
  dropIcon: { fontSize: 14 },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingBottom: 100,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  sectionContent: {
    marginTop: spacing.sm,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  colLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueBtn: { width: '100%' },
  bottomPad: { height: spacing.xxxl },
});
