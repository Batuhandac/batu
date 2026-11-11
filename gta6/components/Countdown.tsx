import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { STRINGS } from '@/constants/i18n';
import { countdownTo } from '@/lib/countdown';
import { useSettings } from '@/stores/settingsStore';

/** Big condensed numerals, meant to sit over the hero photo. */
export function Countdown() {
  const lang = useSettings((s) => s.lang);
  const [c, setC] = useState(() => countdownTo());
  useEffect(() => { const id = setInterval(() => setC(countdownTo()), 1000); return () => clearInterval(id); }, []);

  if (c.released) return <Text style={styles.released}>{STRINGS.countdown.released[lang]}</Text>;
  const cells: Array<[number, string]> = [
    [c.days, STRINGS.countdown.days[lang]], [c.hours, STRINGS.countdown.hours[lang]],
    [c.minutes, STRINGS.countdown.minutes[lang]], [c.seconds, STRINGS.countdown.seconds[lang]],
  ];
  return (
    <View style={styles.row}>
      {cells.map(([n, u], i) => (
        <React.Fragment key={u}>
          {i > 0 ? <Text style={styles.colon}>:</Text> : null}
          <View style={styles.cell}>
            <Text style={styles.num}>{String(n).padStart(2, '0')}</Text>
            <Text style={styles.unit}>{u}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  cell: { alignItems: 'center', minWidth: 62 },
  num: { color: colors.text, fontFamily: fonts.display, fontSize: 60, lineHeight: 66, fontVariant: ['tabular-nums'] },
  colon: { color: colors.primary, fontFamily: fonts.display, fontSize: 48, lineHeight: 62 },
  unit: { color: colors.textMuted, fontFamily: fonts.black, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: -2 },
  released: { color: colors.success, fontFamily: fonts.display, fontSize: 26, textTransform: 'uppercase' },
});
