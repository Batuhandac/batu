import React, { useId } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path, Ellipse, Circle, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { useTheme } from '@/lib/theme';
import { faceShapes, pawShapes, pastelOf, PASTELS, PEEK, type Shape, type FaceMood, type PastelKey } from '@/lib/art/faces';

export type { FaceMood, PastelKey };

function draw(shapes: Shape[]) {
  return shapes.map((s, i) => {
    const a = s.a as any;
    if (s.t === 'path') return <Path key={i} {...a} />;
    if (s.t === 'circle') return <Circle key={i} {...a} />;
    return <Ellipse key={i} {...a} />;
  });
}

/** Tema uyumlu pastel zemin rengi. */
export function usePastel(key: PastelKey): string {
  const t = useTheme();
  return PASTELS[t.dark ? 'dark' : 'light'][key];
}

/** Tombul hayvan yüzü (kedi, köpek, "diğer" için tavşan). */
export function PetFace({
  species,
  seed = '',
  fur,
  mood = 'happy',
  size = 48,
  background,
}: {
  species: string | null | undefined;
  seed?: string;
  fur?: string | null;
  mood?: FaceMood;
  size?: number;
  /** Daire zemin: pastel anahtarı, 'auto' (tohumdan) ya da hiç */
  background?: PastelKey | 'auto' | null;
}) {
  const t = useTheme();
  const bg = background ? PASTELS[t.dark ? 'dark' : 'light'][background === 'auto' ? pastelOf(seed) : background] : null;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {bg ? <Circle cx={50} cy={50} r={50} fill={bg} /> : null}
      {draw(faceShapes({ species, mood, fur, seed }))}
    </Svg>
  );
}

/**
 * Bir kenarın üstünden bakan maskot. `style` ile konumlandır: kenar çizgisi
 * bileşenin yüksekliğinin `PEEK.edgeFrac` oranındadır (bkz. peekOffset).
 */
export function Peek({
  species,
  seed = '',
  fur,
  mood = 'happy',
  width = 96,
  style,
}: {
  species: string;
  seed?: string;
  fur?: string | null;
  mood?: FaceMood;
  width?: number;
  style?: ViewStyle;
}) {
  const id = 'peek' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const height = width * PEEK.ratio;
  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={PEEK.viewBox}>
        <Defs>
          <ClipPath id={id}>
            <Rect x={0} y={0} width={100} height={PEEK.edgeY} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${id})`}>{draw(faceShapes({ species, mood, fur, seed }))}</G>
        {draw(pawShapes(fur, seed))}
      </Svg>
    </View>
  );
}

/** Peek'i bir kenara oturtmak için üst boşluk: top = kenarY - peekOffset(width). */
export const peekOffset = (width: number) => width * PEEK.ratio * PEEK.edgeFrac;
