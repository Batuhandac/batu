import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen, Section } from '@/components/ui/Screen';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Chip } from '@/components/ui/Chip';
import { colors, fonts, radius, spacing } from '@/constants/theme';
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
    <Screen bleed>
      <PhotoHeader photo="sunset_tree" title={STRINGS.glossary.title[lang]} eyebrow={`${GLOSSARY.length} ${lang === 'tr' ? 'terim' : 'terms'}`} subtitle={STRINGS.glossary.subtitle[lang]} height={270} back />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATS.map((c) => <Chip key={c} label={c === 'all' ? STRINGS.common.all[lang] : STRINGS.glossary.cat[c][lang]} active={cat === c} onPress={() => setCat(c)} />)}
      </ScrollView>
      <Section style={{ marginTop: spacing.md }}>
        {list.map((g) => {
          const full = t(g.term, lang); const m = full.match(/^(.*?)\s*\((.*)\)$/);
          return (
            <View key={g.id} style={styles.row}>
              <Text style={styles.term}>{m ? m[1] : full}</Text>
              {m ? <Text style={styles.native}>{m[2]}</Text> : null}
              <Text style={styles.def}>{t(g.definition, lang)}</Text>
            </View>
          );
        })}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 3, borderWidth: 1, borderColor: colors.border },
  term: { color: colors.text, fontFamily: fonts.display, fontSize: 22, textTransform: 'uppercase', letterSpacing: 0.4 },
  native: { color: colors.primary, fontFamily: fonts.black, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  def: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
});
