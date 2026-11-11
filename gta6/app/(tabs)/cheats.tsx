import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Section } from '@/components/ui/Screen';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Chip } from '@/components/ui/Chip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GameSwitch } from '@/components/GameSwitch';
import { ButtonGlyphs } from '@/components/ButtonGlyphs';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { CheatCategory, ContentStatus } from '@/types';

type Kind = 'ps5' | 'xbox' | 'pc' | 'phone';
const KINDS: Array<{ k: Kind; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { k: 'ps5', icon: 'logo-playstation', label: 'PS' },
  { k: 'xbox', icon: 'logo-xbox', label: 'Xbox' },
  { k: 'pc', icon: 'desktop-outline', label: 'PC' },
  { k: 'phone', icon: 'call', label: 'Tel' },
];
const CATEGORIES: Array<CheatCategory | 'all'> = ['all', 'player', 'weapon', 'vehicle', 'world', 'misc'];
const STATUSES: ContentStatus[] = ['verified', 'unverified', 'rumor', 'debunked'];

export default function Cheats() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const game = useSettings((s) => s.game);
  const platform = useSettings((s) => s.platform);
  const setPlatform = useSettings((s) => s.setPlatform);
  const all = useContent((s) => s.bundle.cheats);
  const cheats = useMemo(() => all.filter((c) => c.game === game), [all, game]);
  const [cat, setCat] = useState<CheatCategory | 'all'>('all');
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [kind, setKind] = useState<Kind>(platform ?? 'ps5');

  const list = useMemo(() => cheats.filter((c) => (cat === 'all' || c.category === cat) && (status === 'all' || c.status === status)), [cheats, cat, status]);
  const verified = cheats.filter((c) => c.status === 'verified').length;
  const pick = (k: Kind) => { setKind(k); if (k !== 'phone') setPlatform(k); };

  return (
    <Screen bleed>
      <PhotoHeader photo="chase" title={STRINGS.tabs.cheats[lang]} eyebrow={lang === 'tr' ? `${verified} doğrulandı · ${cheats.length} toplam` : `${verified} verified · ${cheats.length} total`} right={<GameSwitch />} />
      <Section style={{ marginTop: spacing.md }}>
        <View style={styles.kinds}>
          {KINDS.map(({ k, icon, label }) => (
            <Pressable key={k} onPress={() => pick(k)} style={[styles.kind, kind === k && styles.kindActive]}>
              <Ionicons name={icon} size={18} color={kind === k ? colors.text : colors.textFaint} />
              <Text style={[styles.kindLabel, kind === k && { color: colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => <Chip key={c} label={c === 'all' ? STRINGS.common.all[lang] : STRINGS.cheatCategory[c][lang]} active={cat === c} onPress={() => setCat(c)} />)}
        <View style={styles.sep} />
        {STATUSES.map((s) => <Chip key={s} label={STRINGS.status[s][lang]} active={status === s} onPress={() => setStatus(status === s ? 'all' : s)} />)}
      </ScrollView>

      <Section style={{ marginTop: spacing.md }}>
        {list.length === 0 && <Text style={styles.empty}>{STRINGS.common.emptyCheats[lang]}</Text>}
        {list.map((c) => {
          const raw = c.codes[kind];
          const code = raw && raw !== '—' ? raw : undefined;
          return (
            <Pressable key={c.id} onPress={() => router.push(`/cheat/${c.slug}` as never)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}>
              <LinearGradient colors={gradients.sunset} style={styles.edge} />
              <View style={styles.body}>
                <View style={styles.top}>
                  <Text style={styles.meta}>{STRINGS.cheatCategory[c.category][lang]}</Text>
                  <StatusBadge status={c.status} />
                </View>
                <Text style={styles.title}>{t(c.title, lang)}</Text>
                <Text style={styles.effect}>{t(c.effect, lang)}</Text>
                {code ? (
                  <View style={styles.glyphs}><ButtonGlyphs code={code} kind={kind} size={kind === 'pc' ? 26 : 25} /></View>
                ) : (
                  <View style={styles.locked}>
                    <Ionicons name="lock-closed" size={13} color={colors.textFaint} />
                    <Text style={styles.lockedText}>{c.game === 'gta6' ? STRINGS.common.codePending[lang] : STRINGS.common.noCodeYet[lang]}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kinds: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border },
  kind: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8 },
  kindActive: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong },
  kindLabel: { color: colors.textFaint, fontFamily: fonts.bold, fontSize: 12 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md, alignItems: 'center' },
  sep: { width: 1, height: 20, backgroundColor: colors.borderStrong, marginHorizontal: 4 },
  empty: { color: colors.textFaint, fontFamily: fonts.body, textAlign: 'center', paddingVertical: spacing.xxl },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  edge: { width: 4 },
  body: { flex: 1, padding: spacing.lg, gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  meta: { color: colors.textFaint, fontFamily: fonts.black, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 24, lineHeight: 29, textTransform: 'uppercase', letterSpacing: 0.3 },
  effect: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  glyphs: { marginTop: 10 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignSelf: 'flex-start' },
  lockedText: { color: colors.textFaint, fontFamily: fonts.semi, fontSize: 12 },
});
