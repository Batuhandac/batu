import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Section } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Bullets, StatusBanner } from '@/components/Detail';
import { ButtonGlyphs } from '@/components/ButtonGlyphs';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { CHEAT_PHOTO } from '@/content/media';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

type Kind = 'ps5' | 'xbox' | 'pc' | 'phone';
const ROWS: Array<{ k: Kind; icon: keyof typeof Ionicons.glyphMap; tr: string; en: string }> = [
  { k: 'ps5', icon: 'logo-playstation', tr: 'PlayStation', en: 'PlayStation' },
  { k: 'xbox', icon: 'logo-xbox', tr: 'Xbox', en: 'Xbox' },
  { k: 'pc', icon: 'desktop-outline', tr: 'PC (~ tuşu ile konsol)', en: 'PC (console with ~ key)' },
  { k: 'phone', icon: 'call', tr: 'Oyun içi telefon', en: 'In-game phone' },
];

export default function CheatDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lang = useSettings((s) => s.lang);
  const cheat = useContent((s) => s.bundle.cheats.find((c) => c.slug === slug));
  const [copied, setCopied] = useState<string | null>(null);

  if (!cheat) return <Screen><Header title="404" back /></Screen>;

  const copy = async (key: string, value: string) => {
    try {
      const nav = (globalThis as any).navigator;
      if (nav?.clipboard?.writeText) await nav.clipboard.writeText(value);
      setCopied(key); setTimeout(() => setCopied(null), 1200);
    } catch { /* clipboard is optional */ }
  };
  const rows = ROWS.filter((r) => cheat.codes[r.k] && cheat.codes[r.k] !== '—');

  return (
    <Screen bleed>
      <PhotoHeader photo={CHEAT_PHOTO[cheat.category]} title={t(cheat.title, lang)} eyebrow={`${STRINGS.game[cheat.game][lang]} · ${STRINGS.cheatCategory[cheat.category][lang]}`} subtitle={t(cheat.effect, lang)} height={300} back />
      <Section>
        <StatusBanner status={cheat.status} updatedAt={cheat.updatedAt} />
        {rows.length === 0 && (
          <View style={styles.locked}>
            <Ionicons name="lock-closed" size={22} color={colors.textFaint} />
            <Text style={styles.lockedTitle}>{STRINGS.common.locked[lang]}</Text>
            <Text style={styles.lockedText}>{STRINGS.common.codePending[lang]}</Text>
          </View>
        )}
        {rows.map((r) => (
          <Pressable key={r.k} onPress={() => copy(r.k, cheat.codes[r.k]!)} style={styles.block}>
            <View style={styles.blockTop}>
              <Ionicons name={r.icon} size={16} color={colors.textMuted} />
              <Text style={styles.platform}>{lang === 'tr' ? r.tr : r.en}</Text>
              <Text style={styles.copy}>{copied === r.k ? STRINGS.common.copied[lang] : ''}</Text>
            </View>
            <ButtonGlyphs code={cheat.codes[r.k]!} kind={r.k} size={r.k === 'pc' ? 34 : 33} />
          </Pressable>
        ))}
        {cheat.notes ? <Bullets title={lang === 'tr' ? 'Notlar' : 'Notes'} items={[t(cheat.notes, lang)]} /> : null}
        {cheat.source ? <Text style={styles.source}>{STRINGS.common.source[lang]}: {cheat.source}</Text> : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 12, borderWidth: 1, borderColor: colors.border },
  blockTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platform: { flex: 1, color: colors.textMuted, fontFamily: fonts.black, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  copy: { color: colors.success, fontFamily: fonts.bold, fontSize: 12 },
  locked: { alignItems: 'center', gap: 6, padding: spacing.xxl, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong },
  lockedTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 24, textTransform: 'uppercase' },
  lockedText: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  source: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 12 },
});
