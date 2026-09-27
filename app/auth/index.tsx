import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, Icon, IconButton, type IconName } from '@/components/ds';
import { useTheme, radius, hairline } from '@/lib/theme';
import { useAuthFlow } from '@/lib/hooks/useAuthFlow';
import { Peek, peekOffset } from '@/components/art';
import { PASTELS, PASTEL_INK, type PastelKey } from '@/lib/art/faces';

function RoleRow({ icon, tint, title, text, onPress, last }: { icon: IconName; tint: PastelKey; title: string; text: string; onPress: () => void; last?: boolean }) {
  const t = useTheme();
  const mode = t.dark ? 'dark' : 'light';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingLeft: 16, backgroundColor: pressed ? t.surfaceAlt : 'transparent' })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: PASTELS[mode][tint] }}>
        <Icon name={icon} size={22} color={PASTEL_INK[mode][tint]} />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginLeft: 14,
          paddingVertical: 16,
          paddingRight: 16,
          borderBottomWidth: last ? 0 : hairline,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="callout" tone="muted" style={{ marginTop: 2 }}>
            {text}
          </Text>
        </View>
        <Icon name="chevron-forward" size={17} color={t.textSubtle} />
      </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: 52 }}>
          {!onboarding ? <IconButton icon="close" onPress={continueAsGuest} accessibilityLabel="Kapat" size={30} color={t.textMuted} /> : null}
        </View>

        <Text variant="display" style={{ marginTop: 4 }}>
          Seni tanıyalım
        </Text>
        <Text variant="body" tone="muted" style={{ marginTop: 8 }}>
          Hesabınla acil kartların güvende kalır, toplulukta soru sorar ve kliniklerle mesajlaşırsın.
        </Text>

        <View style={{ marginTop: 72 }}>
          <View style={{ borderRadius: radius.lg, backgroundColor: t.surface, overflow: 'hidden' }}>
            <RoleRow
              icon="paw"
              tint="peach"
              title="Evcil hayvan sahibiyim"
              text="Acil kart, bakım takvimi, veterinere soru"
              onPress={() => router.push(`/auth/owner${q}` as never)}
            />
            <RoleRow
              icon="medkit"
              tint="mint"
              title="Veteriner hekimim"
              text="Kliniğini doğrula, sorulara yanıt ver, mesajları yönet"
              onPress={() => router.push(`/auth/vet${q}` as never)}
              last
            />
          </View>
          <Peek species="dog" fur="choco" seed="rol-kopek" width={104} style={{ position: 'absolute', right: 24, top: -peekOffset(104) }} />
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />

        <Pressable onPress={continueAsGuest} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 12 }}>
          <Text variant="body" tone="primary">
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
