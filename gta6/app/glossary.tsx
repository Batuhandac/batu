import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { GLOSSARY } from '@/content/glossary';
import { useSettings } from '@/stores/settingsStore';
import type { GlossaryTerm } from '@/types';

const CATS: Array<GlossaryTerm['category'] | 'all'> = ['all', 'ui', 'gameplay', 'police', 'missions', 'economy'];

export default function Glossary() {
  const lang = useSettings((s) => s.lang);
  const [cat, setCat] = useState<GlossaryTerm['category'] | 'all'>('all');
  const list = useMemo(() => GLOSSARY.filter((g) => cat === 'all' || g.category === cat), [cat]);
  return (
    <Screen>
      <Header title={STRINGS.glossary.title[lang]} subtitle={STRINGS.glossary.subtitle[lang]} back />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATS.map((c) => (
          <Chip key={c} label={c === 'all' ? STRINGS.common.all[lang] : STRINGS.glossary.cat[c][lang]} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>
      {list.map((g) => (
        <View key={g.id} style={styles.row}>
          <Text style={styles.term}>{t(g.term, lang)}</Text>
          <Text style={styles.def}>{t(g.definition, lang)}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 4, borderWidth: 1, borderColor: colors.border },
  term: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  def: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
});
