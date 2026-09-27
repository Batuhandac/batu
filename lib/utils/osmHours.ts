// OpenStreetMap opening_hours sözdiziminin yaygın alt kümesini çalışma
// periyotlarına çevirir:
//   "24/7" · "Mo-Fr 09:00-19:00; Sa 10:00-16:00; Su off"
//   "Mo-Su 09:00-12:30,13:30-20:00" · "09:00-18:00" (her gün) · "20:00-02:00"
// Ay/tatil/gün doğumu/yorum gibi anlaşılmayan bir ifade varsa undefined döner
// → durum "bilinmiyor" gösterilir; yanlış "açık" demektense bilmediğimizi söyleriz.
import type { OpeningPeriod } from '@/types';

const DAYS: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const D = '(?:Mo|Tu|We|Th|Fr|Sa|Su)';
const SELECTOR = new RegExp(`^(${D}(?:\\s*-\\s*${D})?(?:\\s*,\\s*${D}(?:\\s*-\\s*${D})?)*)(?:\\s+|$)(.*)$`);
const SPAN = /^(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})$/;
const DAY_MIN = 24 * 60;

function expandDays(selector: string): number[] {
  const days = new Set<number>();
  for (const part of selector.split(',')) {
    const [from, to] = part.split('-').map((s) => DAYS[s.trim()]);
    if (to === undefined) {
      days.add(from);
      continue;
    }
    for (let d = from; ; d = (d + 1) % 7) {
      days.add(d);
      if (d === to) break;
    }
  }
  return [...days];
}

function parseSpans(text: string): [number, number][] | null {
  const spans: [number, number][] = [];
  for (const part of text.split(',')) {
    const m = part.trim().match(SPAN);
    if (!m) return null;
    const [oh, om, ch, cm] = [m[1], m[2], m[3], m[4]].map(Number);
    if (oh > 24 || ch > 24 || om > 59 || cm > 59) return null;
    const start = oh * 60 + om;
    let end = ch * 60 + cm;
    if (end <= start) end += DAY_MIN; // gece yarısını aşan
    spans.push([start, end]);
  }
  return spans;
}

export function parseOsmHours(raw: string | null | undefined): OpeningPeriod[] | undefined {
  if (!raw) return undefined;
  const s = raw
    .trim()
    .replace(/\s+/g, ' ')
    // "Mo-Fr 09:00-19:00, Sa 10:00-14:00" — kurallar arasında virgül yaygın bir hata
    .replace(/(\d|off|closed),\s*((?:Mo|Tu|We|Th|Fr|Sa|Su|PH)\b)/g, '$1; $2')
    // "Su,PH off" → tatil kısmını at (tatilleri bilemiyoruz)
    .replace(/,\s*PH\b/g, '')
    .replace(/\bPH\s*,\s*/g, '');
  if (s === '24/7' || s === '7/24') return [{ open: { day: 0, hour: 0, minute: 0 } }];

  // gün → [başlangıç, bitiş) dakika aralıkları; hiç anılmayan gün kapalıdır
  const week: ([number, number][] | undefined)[] = Array(7).fill(undefined);
  let applied = false;

  for (const rule of s.split(';').map((r) => r.trim()).filter(Boolean)) {
    if (/^PH\b/.test(rule)) continue; // resmî tatil istisnası — bilemeyiz, atla
    let days = [0, 1, 2, 3, 4, 5, 6];
    let rest = rule;
    const m = rule.match(SELECTOR);
    if (m) {
      days = expandDays(m[1]);
      rest = m[2].trim();
    }
    let spans: [number, number][] | null;
    if (rest === 'off' || rest === 'closed') spans = [];
    else if (rest === '24/7') spans = [[0, DAY_MIN]];
    else spans = parseSpans(rest);
    if (!spans) return undefined;
    for (const d of days) week[d] = spans; // sonraki kural öncekini ezer
    applied = true;
  }
  if (!applied) return undefined;

  const periods: OpeningPeriod[] = [];
  for (let d = 0; d < 7; d++) {
    for (const [start, end] of week[d] ?? []) {
      const close = d * DAY_MIN + end;
      periods.push({
        open: { day: d, hour: Math.floor(start / 60), minute: start % 60 },
        close: {
          day: Math.floor(close / DAY_MIN) % 7,
          hour: Math.floor((close % DAY_MIN) / 60),
          minute: close % 60,
        },
      });
    }
  }
  return periods;
}
