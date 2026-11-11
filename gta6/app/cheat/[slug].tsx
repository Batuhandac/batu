import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Bullets, StatusBanner } from '@/components/Detail';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { GamePlatform } from '@/types';

const ORDER: Array<GamePlatform | 'phone'> = ['ps5', 'xbox', 'pc', 'phone'];

export default function CheatDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lang = useSettings((s) => s.lang);
  const cheat = useContent((s) => s.bundle.cheats.find((c) => c.slug === slug));
  const [copied, setCopied] = useState<string | null>(null);

  if (!cheat) {
    return (
      <Screen>
        <Header title="404" back />
      </Screen>
    );
  }

  const copy = async (key: string, value: string) => {
    try {
      // Clipboard is optional; web has navigator.clipboard, native needs expo-clipboard (not bundled to keep the app slim).
      const nav = (globalThis as any).navigator;
      if (nav?.clipboard?.writeText) await nav.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  const entries = ORDER.filter((k) => cheat.codes[k]);

  return (
    <Screen>
      <Header title={t(cheat.title, lang)} subtitle={t(cheat.effect, lang)} back />
      <StatusBanner status={cheat.status} updatedAt={cheat.updatedAt} />

      <View style={styles.codes}>
        {entries.length === 0 && <Text style={styles.none}>{STRINGS.common.noCodeYet[lang]}</Text>}
        {entries.map((k) => (
          <Pressable key={k} onPress={() => copy(k, cheat.codes[k]!)} style={styles.codeRow}>
            <Text style={styles.platform}>{k === 'phone' ? (lang === 'tr' ? 'Telefon' : 'Phone') : STRINGS.platform[k][lang]}</Text>
            <Text style={styles.code}>{cheat.codes[k]}</Text>
            <Text style={styles.copy}>{copied === k ? STRINGS.common.copied[lang] : '⧉'}</Text>
          </Pressable>
        ))}
      </View>

      {cheat.notes ? <Bullets title={lang === 'tr' ? 'Notlar' : 'Notes'} items={[t(cheat.notes, lang)]} /> : null}
      {cheat.source ? <Text style={styles.source}>{STRINGS.common.source[lang]}: {cheat.source}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  codes: { gap: spacing.sm },
  none: { color: colors.textFaint, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.lg },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceLow, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  platform: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '800', width: 48, textTransform: 'uppercase' },
  code: { flex: 1, color: colors.accent, fontFamily: 'monospace', fontSize: fontSize.md, fontWeight: '700', letterSpacing: 0.5 },
  copy: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  source: { color: colors.textFaint, fontSize: fontSize.xs },
});
