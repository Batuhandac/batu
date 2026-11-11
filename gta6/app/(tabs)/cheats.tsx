import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { colors, fontSize, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';
import type { CheatCategory, ContentStatus } from '@/types';

const CATEGORIES: Array<CheatCategory | 'all'> = ['all', 'player', 'weapon', 'vehicle', 'world', 'misc'];
const STATUSES: Array<ContentStatus | 'all'> = ['all', 'verified', 'unverified', 'rumor', 'debunked'];

export default function Cheats() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const platform = useSettings((s) => s.platform);
  const cheats = useContent((s) => s.bundle.cheats);
  const [cat, setCat] = useState<CheatCategory | 'all'>('all');
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');

  const list = useMemo(
    () => cheats.filter((c) => (cat === 'all' || c.category === cat) && (status === 'all' || c.status === status)),
    [cheats, cat, status],
  );
  const verifiedCount = cheats.filter((c) => c.status === 'verified').length;

  return (
    <Screen>
      <Header
        title={STRINGS.tabs.cheats[lang]}
        subtitle={lang === 'tr' ? `${verifiedCount} doğrulandı · ${cheats.length} toplam` : `${verifiedCount} verified · ${cheats.length} total`}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUSES.map((s) => (
          <Chip key={s} label={s === 'all' ? STRINGS.common.all[lang] : STRINGS.status[s][lang]} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c === 'all' ? STRINGS.common.all[lang] : STRINGS.cheatCategory[c][lang]} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>

      {list.length === 0 && <Text style={styles.empty}>{STRINGS.common.emptyCheats[lang]}</Text>}
      {list.map((c) => {
        const code = platform ? c.codes[platform] : c.codes.ps5 ?? c.codes.xbox ?? c.codes.pc;
        return (
          <Card key={c.id} meta={STRINGS.cheatCategory[c.category][lang]} title={t(c.title, lang)} subtitle={t(c.effect, lang)} status={c.status} onPress={() => router.push(`/cheat/${c.slug}` as never)}>
            <View style={styles.codeRow}>
              <Text style={[styles.code, !code && styles.codeMissing]}>{code ?? STRINGS.common.noCodeYet[lang]}</Text>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  empty: { color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.xxl },
  codeRow: { marginTop: spacing.sm },
  code: { color: colors.accent, fontFamily: 'monospace', fontSize: fontSize.sm, fontWeight: '700', letterSpacing: 0.5 },
  codeMissing: { color: colors.textFaint, fontStyle: 'italic', fontWeight: '400' },
});
