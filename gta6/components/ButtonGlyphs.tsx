import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';

type Kind = 'ps5' | 'xbox' | 'pc' | 'phone';

const ARROWS: Record<string, keyof typeof Ionicons.glyphMap> = {
  left: 'arrow-back', right: 'arrow-forward', up: 'arrow-up', down: 'arrow-down',
};
const XBOX: Record<string, string> = { a: '#3DDC84', b: '#FF4D5E', x: '#3FA2FF', y: '#FFC83D' };

function PsShape({ token, size }: { token: string; size: number }) {
  const s = size * 0.5; const c = size / 2; const sw = Math.max(2, size * 0.085);
  let shape: React.ReactNode = null;
  if (token === 'triangle') shape = <Path d={`M${c} ${c - s * 0.62} L${c + s * 0.66} ${c + s * 0.5} L${c - s * 0.66} ${c + s * 0.5} Z`} stroke="#3DDCB0" strokeWidth={sw} fill="none" strokeLinejoin="round" />;
  if (token === 'circle') shape = <Circle cx={c} cy={c} r={s * 0.6} stroke="#FF5C6C" strokeWidth={sw} fill="none" />;
  if (token === 'square') shape = <Rect x={c - s * 0.55} y={c - s * 0.55} width={s * 1.1} height={s * 1.1} stroke="#F58BD0" strokeWidth={sw} fill="none" rx={1.5} />;
  if (token === 'x') shape = (<><Line x1={c - s * 0.5} y1={c - s * 0.5} x2={c + s * 0.5} y2={c + s * 0.5} stroke="#7FB2FF" strokeWidth={sw} strokeLinecap="round" /><Line x1={c + s * 0.5} y1={c - s * 0.5} x2={c - s * 0.5} y2={c + s * 0.5} stroke="#7FB2FF" strokeWidth={sw} strokeLinecap="round" /></>);
  return (
    <View style={[styles.face, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size}>{shape}</Svg>
    </View>
  );
}

function Token({ raw, kind, size }: { raw: string; kind: Kind; size: number }) {
  const t = raw.trim().toLowerCase();
  if (ARROWS[t]) {
    return <View style={[styles.dpad, { width: size, height: size }]}><Ionicons name={ARROWS[t]} size={size * 0.6} color={colors.text} /></View>;
  }
  if (kind === 'ps5' && ['triangle', 'circle', 'square', 'x'].includes(t)) return <PsShape token={t} size={size} />;
  if (kind === 'xbox' && XBOX[t]) {
    return <View style={[styles.face, { width: size, height: size, borderRadius: size / 2, borderColor: XBOX[t] }]}><Text style={[styles.faceLetter, { color: XBOX[t], fontSize: size * 0.5 }]}>{t.toUpperCase()}</Text></View>;
  }
  return <View style={[styles.pill, { height: size, minWidth: size * 1.25 }]}><Text style={[styles.pillText, { fontSize: size * 0.42 }]}>{raw.trim().toUpperCase()}</Text></View>;
}

/** Renders a cheat as controller glyphs (PS shapes, Xbox letters, d-pad arrows, shoulder pills), a PC keyword or a phone number. */
export function ButtonGlyphs({ code, kind, size = 28 }: { code: string; kind: Kind; size?: number }) {
  if (kind === 'pc') {
    return (
      <View style={styles.row}>
        {code.split('').map((ch, i) => (
          <View key={i} style={[styles.key, { width: size * 0.82, height: size }]}><Text style={[styles.keyText, { fontSize: size * 0.5 }]}>{ch}</Text></View>
        ))}
      </View>
    );
  }
  if (kind === 'phone') {
    return (
      <View style={styles.phone}>
        <Ionicons name="call" size={size * 0.55} color={colors.accent} />
        <Text style={[styles.phoneText, { fontSize: size * 0.62 }]}>{code}</Text>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      {code.split(',').map((tok, i) => <Token key={i} raw={tok} kind={kind} size={size} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  face: { backgroundColor: '#1A1526', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  faceLetter: { fontFamily: fonts.black },
  dpad: { backgroundColor: '#2A2340', borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  pill: { paddingHorizontal: 7, backgroundColor: '#2A2340', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  pillText: { color: colors.text, fontFamily: fonts.black, letterSpacing: 0.3 },
  key: { backgroundColor: '#1A1526', borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderBottomWidth: 3, borderColor: 'rgba(255,255,255,0.18)' },
  keyText: { color: colors.yellow, fontFamily: fonts.black },
  phone: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phoneText: { color: colors.text, fontFamily: fonts.display, letterSpacing: 1.2 },
});
