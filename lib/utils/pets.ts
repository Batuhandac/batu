// Pet türü etiketleri — kayıtta 'dog' | 'cat' | 'other' saklanır.
import type { Pet } from '@/types';
export function speciesLabel(species: string | null | undefined, possessive = false): string {
  switch (species) {
    case 'dog':
      return possessive ? 'Köpeğim' : 'Köpek';
    case 'cat':
      return possessive ? 'Kedim' : 'Kedi';
    case 'other':
    case null:
    case undefined:
    case '':
      return possessive ? 'Evcil hayvanım' : 'Evcil hayvan';
    default:
      return possessive ? `${species}` : species;
  }
}

export function sexLabel(p: Pick<Pet, 'sex' | 'neutered'>): string | null {
  if (!p.sex) return null;
  const base = p.sex === 'female' ? 'Dişi' : 'Erkek';
  return p.neutered ? `${base}, kısır` : base;
}

/** "4 yaş", "7 aylık", "3 haftalık"; doğum tarihi yoksa kayıtlı yaş. */
export function petAge(p: Pick<Pet, 'birth_date' | 'age_years'>, now = new Date()): string | null {
  if (p.birth_date) {
    const b = new Date(p.birth_date + 'T12:00:00');
    if (!isNaN(b.getTime())) {
      let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
      if (now.getDate() < b.getDate()) months -= 1;
      if (months >= 12) return `${Math.floor(months / 12)} yaş`;
      if (months >= 1) return `${months} aylık`;
      const weeks = Math.max(0, Math.floor((now.getTime() - b.getTime()) / (7 * 86400000)));
      return `${weeks} haftalık`;
    }
  }
  return p.age_years != null ? `${String(p.age_years).replace('.', ',')} yaş` : null;
}

/** Doğum gününe kalan gün (0 = bugün) ve kaçıncı yaş; doğum tarihi yoksa null. */
export function upcomingBirthday(p: Pick<Pet, 'birth_date'>, now = new Date()): { days: number; turns: number } | null {
  if (!p.birth_date) return null;
  const b = new Date(p.birth_date + 'T12:00:00');
  if (isNaN(b.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
  const days = Math.round((next.getTime() - today.getTime()) / 86400000);
  return { days, turns: next.getFullYear() - b.getFullYear() };
}

/** Türkçe tamlayan eki: "Boncuk'un", "Mia'nın", "Tarçın'ın", "Zeytin'in". */
export function genitive(name: string): string {
  const lower = name.trim().toLocaleLowerCase('tr-TR');
  const vowels = 'aeıioöuü';
  const last = [...lower].reverse().find((c) => vowels.includes(c)) ?? 'e';
  const suffix: Record<string, string> = { a: 'ın', ı: 'ın', e: 'in', i: 'in', o: 'un', u: 'un', ö: 'ün', ü: 'ün' };
  const endsWithVowel = vowels.includes(lower[lower.length - 1] ?? '');
  return `${name.trim()}'${endsWithVowel ? 'n' : ''}${suffix[last]}`;
}
