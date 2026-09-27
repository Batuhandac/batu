// Pati SOS maskotları: tombul kedi, köpek ve tavşan yüzleri.
// Çizim burada şekil listesi olarak tanımlanır; uygulama (components/art) ve
// pazarlama görselleri aynı kaynaktan çizer. Tuval 100×100, yüz ortada.
// Kural: süs yok (parıltı, gradyan); sevimlilik yuvarlak hatlardan, yanaklardan
// ve ifadeden gelir. Acil ekranlarında maskot kullanılmaz.

export type FaceSpecies = 'dog' | 'cat' | 'other';
export type FaceMood = 'happy' | 'sleepy' | 'wink' | 'surprised';
export type FurKey = 'ginger' | 'cream' | 'grey' | 'choco' | 'white' | 'black';

export interface Shape {
  t: 'path' | 'ellipse' | 'circle';
  a: Record<string, string | number>;
}

interface Fur {
  key: FurKey;
  label: string;
  fur: string;
  dark: string;
  muzzle: string;
  eye?: string; // koyu tüyde göz rengi (kehribar), yoksa koyu göz
}

export const FURS: Fur[] = [
  { key: 'ginger', label: 'Turuncu', fur: '#F4B77E', dark: '#D98C4E', muzzle: '#FCE6CF' },
  { key: 'cream', label: 'Krem', fur: '#F1DDBF', dark: '#D2B084', muzzle: '#FFF5E6' },
  { key: 'grey', label: 'Gri', fur: '#C5CAD3', dark: '#959DAA', muzzle: '#EEF0F4' },
  { key: 'choco', label: 'Kahve', fur: '#B98A6D', dark: '#8C624A', muzzle: '#EBD5C5' },
  { key: 'white', label: 'Beyaz', fur: '#FFFCF8', dark: '#E4D8C8', muzzle: '#FFFFFF' },
  { key: 'black', label: 'Siyah', fur: '#4B4644', dark: '#2E2A29', muzzle: '#6F6865', eye: '#EDC25E' },
];

/** Dostlar, duyurular ve boş ekranlar için yumuşak zeminler. */
export const PASTEL_KEYS = ['peach', 'butter', 'mint', 'sky', 'lilac', 'rose'] as const;
export type PastelKey = (typeof PASTEL_KEYS)[number];
export const PASTELS: Record<'light' | 'dark', Record<PastelKey, string>> = {
  light: { peach: '#FFE4D6', butter: '#FFF0C7', mint: '#D9F2E3', sky: '#D9EAFB', lilac: '#E9E1FA', rose: '#FBE0E8' },
  dark: { peach: '#3A2A22', butter: '#37311D', mint: '#1D3226', sky: '#1C2A3A', lilac: '#2B2540', rose: '#3A2430' },
};

/** Pastel zemin üstündeki ikonların rengi (aynı tonun koyusu). */
export const PASTEL_INK: Record<'light' | 'dark', Record<PastelKey, string>> = {
  light: { peach: '#C05A2E', butter: '#94670A', mint: '#1F7552', sky: '#2D6BAE', lilac: '#6A4FB0', rose: '#C0344F' },
  dark: { peach: '#FFB48F', butter: '#F5CF6B', mint: '#7FD6AE', sky: '#8CBDF2', lilac: '#BBA7F0', rose: '#F59AAE' },
};

const INK = '#2A211D';
const PINK = '#F4A3A3';
const NOSE = '#EE8E8E';

/** Kimlikten (ör. pet id) kararlı bir sıra numarası. */
export function seedIndex(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % n;
}

export function furOf(key: string | null | undefined, seed = ''): Fur {
  return FURS.find((f) => f.key === key) ?? FURS[seedIndex(seed, 4)]; // seçilmemişse ilk dört açık tondan biri
}

export function pastelOf(seed: string): PastelKey {
  return PASTEL_KEYS[seedIndex(seed + '·', PASTEL_KEYS.length)];
}

const P = (d: string, fill: string, extra: Record<string, string | number> = {}): Shape => ({ t: 'path', a: { d, fill, ...extra } });
const E = (cx: number, cy: number, rx: number, ry: number, fill: string, extra: Record<string, string | number> = {}): Shape => ({
  t: 'ellipse',
  a: { cx, cy, rx, ry, fill, ...extra },
});
const line = (d: string, color: string, width: number, opacity = 1): Shape => ({
  t: 'path',
  a: { d, fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round', opacity },
});

function eyes(lx: number, rx: number, y: number, mood: FaceMood, fur: Fur): Shape[] {
  const one = (x: number, closed: boolean): Shape[] => {
    if (closed) return [line(`M${x - 4.2} ${y} Q${x} ${y + 3.6} ${x + 4.2} ${y}`, INK, 2)];
    const big = mood === 'surprised' ? 1.15 : 1;
    if (fur.eye) {
      return [E(x, y, 4.7 * big, 5.5 * big, fur.eye), E(x, y + 0.3, 2, 4 * big, INK), { t: 'circle', a: { cx: x + 1.5, cy: y - 2, r: 1.5, fill: '#FFFFFF' } }];
    }
    return [E(x, y, 4.5 * big, 5.3 * big, INK), { t: 'circle', a: { cx: x + 1.6, cy: y - 2, r: 1.7, fill: '#FFFFFF' } }];
  };
  if (mood === 'wink') return [...one(lx, false), line(`M${rx - 4.2} ${y + 1} Q${rx} ${y - 3.6} ${rx + 4.2} ${y + 1}`, INK, 2)];
  const closed = mood === 'sleepy';
  return [...one(lx, closed), ...one(rx, closed)];
}

function mouth(y: number, mood: FaceMood, tongue: boolean): Shape[] {
  if (mood === 'surprised') return [E(50, y + 2.6, 2.3, 2.8, INK)];
  const w = [line(`M50 ${y} Q49 ${y + 3.2} 45.6 ${y + 2.4} M50 ${y} Q51 ${y + 3.2} 54.4 ${y + 2.4}`, INK, 1.7)];
  if (tongue && mood !== 'sleepy') w.push(P(`M47.8 ${y + 2.6} Q50 ${y + 8.8} 52.2 ${y + 2.6} Q50 ${y + 3.8} 47.8 ${y + 2.6} Z`, '#F08D8D'));
  return w;
}

const cheeks = (lx: number, rx: number, y: number): Shape[] => [E(lx, y, 5.4, 3.2, PINK, { opacity: 0.55 }), E(rx, y, 5.4, 3.2, PINK, { opacity: 0.55 })];

export function faceShapes({
  species,
  mood = 'happy',
  fur: furKey,
  seed = '',
}: {
  species: FaceSpecies | string | null | undefined;
  mood?: FaceMood;
  fur?: string | null;
  seed?: string;
}): Shape[] {
  const fur = furOf(furKey, seed);
  const pattern = seedIndex(seed + '#', 3) === 0; // bazı dostlarda tekir çizgisi / göz lekesi
  if (species === 'dog') {
    return [
      E(50, 56, 31, 28, fur.fur),
      ...(pattern ? [E(62, 51, 8.5, 7.5, fur.dark, { opacity: 0.55 })] : []),
      E(50, 66, 14.5, 10.5, fur.muzzle),
      P('M27 33 C17 33 11 42 12 55 C13 66 19 70 24 66 C28 62 30 52 32 42 Z', fur.dark),
      P('M73 33 C83 33 89 42 88 55 C87 66 81 70 76 66 C72 62 70 52 68 42 Z', fur.dark),
      ...cheeks(31, 69, 62),
      ...eyes(39, 61, 52, mood, fur),
      E(50, 61, 5.2, 3.8, INK),
      E(48.4, 59.9, 1.6, 1, '#FFFFFF', { opacity: 0.7 }),
      line('M50 64.8 L50 66.3', INK, 1.7),
      ...mouth(66.3, mood, true),
    ];
  }
  if (species === 'cat') {
    return [
      P('M18 48 L25 17 Q27 11 32 15 L48 30 Z', fur.fur),
      P('M82 48 L75 17 Q73 11 68 15 L52 30 Z', fur.fur),
      P('M25 38 L28.5 21 Q29.5 18.5 32 20.5 L41 29.5 Z', PINK),
      P('M75 38 L71.5 21 Q70.5 18.5 68 20.5 L59 29.5 Z', PINK),
      E(50, 57, 34, 28, fur.fur),
      ...(pattern ? [line('M43 32.5 L44.5 38 M50 31 L50 37 M57 32.5 L55.5 38', fur.dark, 2.4)] : []),
      ...cheeks(29, 71, 64),
      ...eyes(38.5, 61.5, 55, mood, fur),
      P('M46.8 61.2 Q50 59.6 53.2 61.2 Q51.8 64.2 50 64.4 Q48.2 64.2 46.8 61.2 Z', NOSE),
      ...mouth(64.4, mood, false),
      line('M22 61 L12.5 59.5 M22.5 65 L13 66.5 M78 61 L87.5 59.5 M77.5 65 L87 66.5', fur.key === 'black' ? '#FFFFFF' : INK, 1.3, 0.35),
    ];
  }
  // Diğer: tavşan
  return [
    E(39, 26, 7, 18, fur.fur, { transform: 'rotate(-10 39 26)' }),
    E(61, 26, 7, 18, fur.fur, { transform: 'rotate(10 61 26)' }),
    E(39, 27, 3.4, 12, PINK, { transform: 'rotate(-10 39 27)' }),
    E(61, 27, 3.4, 12, PINK, { transform: 'rotate(10 61 27)' }),
    E(50, 60, 29, 25, fur.fur),
    ...cheeks(32, 68, 66),
    ...eyes(40, 60, 58, mood, fur),
    P('M48 64 Q50 62.8 52 64 Q51 65.8 50 65.9 Q49 65.8 48 64 Z', NOSE),
    ...mouth(65.9, mood, false),
  ];
}

/** Kenarın üstünden bakan patiler (kenar çizgisi y=70). */
export function pawShapes(furKey: string | null | undefined, seed = ''): Shape[] {
  const fur = furOf(furKey, seed);
  const paw = (cx: number): Shape[] => [
    E(cx, 71, 9.5, 7, fur.fur),
    line(`M${cx - 3.2} ${65.5} L${cx - 3.2} ${69} M${cx + 3.2} ${65.5} L${cx + 3.2} ${69}`, fur.key === 'black' ? '#FFFFFF' : fur.dark, 1.5, 0.7),
  ];
  return [...paw(33), ...paw(67)];
}

/** Kenardan bakan maskotun görünüm kutusu ve kenar çizgisinin yüksekliğe oranı. */
export const PEEK = { viewBox: '0 4 100 78', edgeY: 70, ratio: 78 / 100, edgeFrac: (70 - 4) / 78 };

const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
export function shapesToSvg(shapes: Shape[]): string {
  return shapes.map((s) => `<${s.t} ${Object.entries(s.a).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`).join('');
}
