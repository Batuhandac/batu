// Oyunlaştırma: pati puanı, seviye, rozetler, zamanında bakım serisi ve ilk adımlar.
// Hepsi telefondaki verilerden (dostlar, bakım, kilo) hesaplanır; ayrı bir puan kaydı
// tutulmaz. Böylece silinen bir kayıt puanı da geri alır, hile ya da tutarsızlık olmaz.
// İlke: yalnızca dostun sağlığına gerçekten yarayan davranışlar ödüllendirilir.
import type { Pet } from '@/types';
import type { CareItem, WeightEntry } from '@/lib/data/care';
import type { IconName } from '@/components/ds/Icon';
import type { PastelKey } from '@/lib/art/faces';

export interface GameInput {
  pets: Pet[];
  care: CareItem[];
  weights: WeightEntry[];
  locationShared: boolean;
  firstAidSeen: boolean;
}

// ─── Dost kartının doluluğu ─────────────────────────────────────────────────
export interface CardField {
  key: string;
  label: string; // eksikse gösterilecek kısa öneri
  done: boolean;
}

export function cardFields(pet: Pet, care: CareItem[]): CardField[] {
  const mine = care.filter((c) => c.pet_id === pet.id);
  return [
    { key: 'species', label: 'Türünü seç', done: !!pet.species },
    { key: 'look', label: 'Fotoğraf ya da tüy rengi ekle', done: !!(pet.photo_uri || pet.fur) },
    { key: 'age', label: 'Doğum tarihini ekle', done: !!(pet.birth_date || pet.age_years != null) },
    { key: 'weight', label: 'Kilosunu ekle', done: pet.weight_kg != null },
    { key: 'sex', label: 'Cinsiyetini seç', done: !!pet.sex },
    { key: 'chip', label: 'Çip numarasını ekle', done: !!pet.chip_no },
    { key: 'vaccine', label: 'Son aşısını ekle', done: !!pet.last_vaccine_date || mine.some((c) => (c.kind === 'vaccine' || c.kind === 'rabies') && !!c.done_at) },
    { key: 'care', label: 'Bakım takvimine bir tarih ekle', done: mine.length > 0 },
  ];
}

/** 0–1 arası doluluk. */
export function cardCompleteness(pet: Pet, care: CareItem[]): number {
  const f = cardFields(pet, care);
  return f.filter((x) => x.done).length / f.length;
}

// ─── Seri ───────────────────────────────────────────────────────────────────
const onTime = (c: CareItem) => !!c.done_at && c.done_at <= c.due;

/** En son yapılandan geriye, üst üste zamanında yapılan bakım sayısı. */
export function careStreak(care: CareItem[]): number {
  const done = care.filter((c) => !!c.done_at).sort((a, b) => (b.done_at! + b.created_at).localeCompare(a.done_at! + a.created_at));
  let n = 0;
  for (const c of done) {
    if (!onTime(c)) break;
    n++;
  }
  return n;
}

// ─── Puan ve seviye ─────────────────────────────────────────────────────────
export const POINTS = {
  pet: 20,
  fullCard: 30, // kart doluluğuyla orantılı
  careAdded: 10,
  doneOnTime: 15,
  doneLate: 5,
  weight: 5,
  location: 10,
  firstAid: 5,
} as const;

export function points(g: GameInput): number {
  let p = 0;
  for (const pet of g.pets) p += POINTS.pet + Math.round(POINTS.fullCard * cardCompleteness(pet, g.care));
  p += g.care.length * POINTS.careAdded;
  for (const c of g.care) if (c.done_at) p += onTime(c) ? POINTS.doneOnTime : POINTS.doneLate;
  p += g.weights.length * POINTS.weight;
  if (g.locationShared) p += POINTS.location;
  if (g.firstAidSeen) p += POINTS.firstAid;
  return p;
}

export const LEVELS: { min: number; name: string }[] = [
  { min: 0, name: 'Yeni pati' },
  { min: 60, name: 'Pati dostu' },
  { min: 150, name: 'Bakım ustası' },
  { min: 300, name: 'Pati kahramanı' },
  { min: 600, name: 'Efsane pati' },
];

export function levelOf(p: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && p >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (p - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1;
  return { index: i, name: LEVELS[i].name, next, toNext: next ? next.min - p : 0, progress };
}

// ─── Rozetler ───────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  title: string;
  how: string; // nasıl kazanılır
  icon: IconName;
  tint: PastelKey;
  earned: (g: GameInput) => boolean;
}

const doneOf = (g: GameInput, kinds: string[]) => g.care.filter((c) => !!c.done_at && kinds.includes(c.kind)).length;

export const BADGES: Badge[] = [
  { id: 'ilk-dost', title: 'İlk dost', how: 'Bir dost ekle', icon: 'paw', tint: 'peach', earned: (g) => g.pets.length >= 1 },
  { id: 'ilk-asi', title: 'İlk aşı', how: 'Takvime bir aşı ekle', icon: 'shield-checkmark', tint: 'mint', earned: (g) => g.care.some((c) => c.kind === 'vaccine' || c.kind === 'rabies') },
  { id: 'dogum-gunu', title: 'İyi ki doğdun', how: 'Bir dostunun doğum tarihini ekle', icon: 'gift', tint: 'butter', earned: (g) => g.pets.some((p) => !!p.birth_date) },
  { id: 'tam-kart', title: 'Tam kart', how: 'Bir dostunun kartını tamamen doldur', icon: 'id-card', tint: 'sky', earned: (g) => g.pets.some((p) => cardCompleteness(p, g.care) === 1) },
  { id: 'hazirlikli', title: 'Hazırlıklı', how: 'Konumunu paylaş ve ilk yardım rehberine göz at', icon: 'medkit', tint: 'rose', earned: (g) => g.locationShared && g.firstAidSeen },
  { id: 'dakik', title: 'Dakik', how: '3 bakımı zamanında yap', icon: 'alarm', tint: 'lilac', earned: (g) => g.care.filter(onTime).length >= 3 },
  { id: 'parazit-savar', title: 'Parazit savar', how: 'Bir parazit bakımını yap', icon: 'bug', tint: 'mint', earned: (g) => doneOf(g, ['internal_parasite', 'external_parasite']) >= 1 },
  { id: 'kilo-takipcisi', title: 'Kilo takipçisi', how: '3 kez kilo kaydet', icon: 'barbell', tint: 'butter', earned: (g) => g.weights.length >= 3 },
  { id: 'seri-5', title: '5 seri', how: 'Üst üste 5 bakımı zamanında yap', icon: 'flame', tint: 'peach', earned: (g) => careStreak(g.care) >= 5 },
  { id: 'kalabalik-aile', title: 'Kalabalık aile', how: '3 dost ekle', icon: 'people', tint: 'sky', earned: (g) => g.pets.length >= 3 },
];

export function earnedBadges(g: GameInput): Badge[] {
  return BADGES.filter((b) => b.earned(g));
}

// ─── İlk adımlar ────────────────────────────────────────────────────────────
export interface Step {
  id: string;
  title: string;
  done: boolean;
}

export function firstSteps(g: GameInput): Step[] {
  const primary = g.pets.find((p) => p.is_primary) ?? g.pets[0];
  return [
    { id: 'pet', title: 'Dostunu ekle', done: g.pets.length > 0 },
    { id: 'care', title: 'Bir aşı ya da parazit günü ekle', done: g.care.length > 0 },
    { id: 'card', title: 'Dostunun kartını doldur', done: !!primary && cardCompleteness(primary, g.care) >= 0.75 },
    { id: 'location', title: 'Konumunu paylaş', done: g.locationShared },
    { id: 'firstaid', title: 'İlk yardım rehberine göz at', done: g.firstAidSeen },
  ];
}

export function summarize(g: GameInput) {
  const p = points(g);
  const earned = earnedBadges(g);
  return { points: p, level: levelOf(p), earned, streak: careStreak(g.care), steps: firstSteps(g) };
}
