import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { countdownTo } from '@/lib/countdown';
import { useSettings } from '@/stores/settingsStore';

export function Countdown() {
  const lang = useSettings((s) => s.lang);
  const [c, setC] = useState(() => countdownTo());
  useEffect(() => {
    const id = setInterval(() => setC(countdownTo()), 1000);
    return () => clearInterval(id);
  }, []);

  if (c.released) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.released}>{STRINGS.countdown.released[lang]}</Text>
      </View>
    );
  }
  const cells: Array<[number, string]> = [
    [c.days, STRINGS.countdown.days[lang]],
    [c.hours, STRINGS.countdown.hours[lang]],
    [c.minutes, STRINGS.countdown.minutes[lang]],
    [c.seconds, STRINGS.countdown.seconds[lang]],
  ];
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{STRINGS.countdown.until[lang]}</Text>
      <View style={styles.row}>
        {cells.map(([n, u]) => (
          <View key={u} style={styles.cell}>
            <Text style={styles.num}>{String(n).padStart(2, '0')}</Text>
            <Text style={styles.unit}>{u}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.date}>19.11.2026 · PS5 · Xbox Series X|S</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, borderWidth: 1, borderColor: colors.primary },
  label: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1, backgroundColor: colors.surfaceLow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  num: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { color: colors.textFaint, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase' },
  date: { color: colors.textMuted, fontSize: fontSize.sm },
  released: { color: colors.success, fontSize: fontSize.lg, fontWeight: '700' },
});
