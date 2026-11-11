import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius } from '@/constants/theme';
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
        <Pressable key={g} onPress={() => setGame(g)} style={styles.seg}>
          {game === g ? <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill} /> : null}
          <Text style={[styles.label, game === g && styles.labelActive]}>{STRINGS.game[g][lang]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: 'rgba(7,5,13,0.7)', borderRadius: radius.full, padding: 3, borderWidth: 1, borderColor: colors.borderStrong },
  seg: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  label: { color: colors.textMuted, fontFamily: fonts.display, fontSize: 15, letterSpacing: 0.8 },
  labelActive: { color: colors.onPrimary },
});
