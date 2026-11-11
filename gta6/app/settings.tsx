import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { registerForPush, unregisterPush } from '@/lib/notifications';
import { useSettings } from '@/stores/settingsStore';
import type { GamePlatform, Lang } from '@/types';

export default function Settings() {
  const { lang, platform, pushEnabled, pushToken, setLang, setPlatform, setPush } = useSettings();
  const [busy, setBusy] = useState(false);

  const togglePush = async (next: boolean) => {
    setBusy(true);
    if (next) {
      const token = await registerForPush(lang, platform);
      setPush(!!token, token);
    } else {
      await unregisterPush(pushToken);
      setPush(false, null);
    }
    setBusy(false);
  };

  return (
    <Screen>
      <Header title={STRINGS.common.settings[lang]} back />

      <View style={styles.block}>
        <Text style={styles.label}>{STRINGS.common.language[lang]}</Text>
        <View style={styles.row}>
          {(['tr', 'en'] as Lang[]).map((l) => (
            <Chip key={l} label={l === 'tr' ? 'Türkçe' : 'English'} active={lang === l} onPress={() => setLang(l)} />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>{STRINGS.common.myPlatform[lang]}</Text>
        <View style={styles.row}>
          {(['ps5', 'xbox', 'pc'] as GamePlatform[]).map((p) => (
            <Chip key={p} label={STRINGS.platform[p][lang]} active={platform === p} onPress={() => setPlatform(platform === p ? null : p)} />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{STRINGS.common.notifications[lang]}</Text>
            <Text style={styles.hint}>{Platform.OS === 'web' ? STRINGS.common.notifWeb[lang] : STRINGS.common.notifHint[lang]}</Text>
          </View>
          <Switch
            value={pushEnabled}
            disabled={busy || Platform.OS === 'web'}
            onValueChange={togglePush}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.text, fontFamily: fonts.display, fontSize: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { color: colors.textMuted, fontFamily: fonts.body, fontSize: fontSize.sm, marginTop: 2 },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
