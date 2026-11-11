import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { useSettings } from '@/stores/settingsStore';
import type { Game } from '@/types';

const GAMES: Game[] = ['gta6', 'gta5'];

/** Segmented control: GTA VI (launch content) vs GTA V (verified today). */
export function GameSwitch() {
  const { game, setGame, lang } = useSettings();
  return (
    <View style={styles.wrap}>
      {GAMES.map((g) => (
        <Pressable key={g} onPress={() => setGame(g)} style={[styles.seg, game === g && styles.active]}>
          <Text style={[styles.label, game === g && styles.labelActive]}>{STRINGS.game[g][lang]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceLow, borderRadius: radius.full, padding: 3, borderWidth: 1, borderColor: colors.border },
  seg: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  active: { backgroundColor: colors.primary },
  label: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.5 },
  labelActive: { color: colors.onPrimary },
});
