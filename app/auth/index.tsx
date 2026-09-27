import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, IconBadge, Icon, IconButton, LogoMark, Wordmark, type IconName } from '@/components/ds';
import { useTheme, radius, shadow } from '@/lib/theme';
import { useAuthFlow } from '@/lib/hooks/useAuthFlow';

function RoleCard({ icon, title, text, tone, onPress }: { icon: IconName; title: string; text: string; tone: 'primary' | 'honey'; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 18,
        borderRadius: radius.xl,
        backgroundColor: pressed ? t.surfaceAlt : t.surface,
        borderWidth: 1,
        borderColor: t.border,
        ...shadow(t, 1),
      })}
    >
      <IconBadge
        name={icon}
        size={56}
        color={tone === 'primary' ? t.primary : t.honey}
        background={tone === 'primary' ? t.primarySoft : t.honeySoft}
      />
      <View style={{ flex: 1 }}>
        <Text variant="headline">{title}</Text>
        <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
          {text}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={t.textSubtle} />
    </Pressable>
  );
}

export default function AuthRoleScreen() {
  const t = useTheme();
  const { onboarding, from, continueAsGuest } = useAuthFlow();
  const q = from ? `?from=${from}` : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LogoMark size={32} />
            <Wordmark size={20} />
          </View>
          {!onboarding ? <IconButton icon="close" onPress={continueAsGuest} accessibilityLabel="Kapat" size={40} /> : null}
        </View>

        <Text variant="display" style={{ marginTop: 24 }}>
          Seni tanıyalım
        </Text>
        <Text variant="body" tone="muted" style={{ marginTop: 8 }}>
          Hesabınla acil kartların güvende kalır, toplulukta soru sorar ve kliniklerle mesajlaşırsın.
        </Text>

        <View style={{ gap: 12, marginTop: 28 }}>
          <RoleCard
            icon="paw"
            tone="primary"
            title="Evcil hayvan sahibiyim"
            text="Acil kart, veterinere soru, kliniklerle mesajlaşma"
            onPress={() => router.push(`/auth/owner${q}` as never)}
          />
          <RoleCard
            icon="medkit"
            tone="honey"
            title="Veteriner hekimim"
            text="Kliniğini doğrula, sorulara yanıt ver, mesajları yönet"
            onPress={() => router.push(`/auth/vet${q}` as never)}
          />
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />

        <Pressable onPress={continueAsGuest} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 12 }}>
          <Text variant="bodyStrong" tone="primary">
            Şimdilik hesapsız devam et
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="shield-checkmark-outline" size={15} color={t.textSubtle} />
          <Text variant="caption" tone="subtle">
            Acil veteriner bulmak için hesap gerekmez.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
