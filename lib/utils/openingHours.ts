// Çalışma saatlerinden "şu an açık mı" hesabı. Türkiye tek saat diliminde
// (UTC+3, yaz saati yok); cihaz başka saat dilimindeyse de doğru sonuç verir.
import type { ClinicStatus, OpeningPeriod } from '@/types';

const DAY = 24 * 60;
const WEEK = 7 * DAY;

export function istanbulNow(date = new Date()): { dow: number; minutes: number } {
  const ist = new Date(date.getTime() + 3 * 3600000);
  return { dow: ist.getUTCDay(), minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes() };
}

function weekMinute(p: { day: number; hour: number; minute: number }): number {
  return p.day * DAY + p.hour * 60 + p.minute;
}

// [başlangıç, bitiş) haftalık dakika aralığı; hafta sonunu aşan periyotta bitiş > WEEK
function span(p: OpeningPeriod): [number, number] {
  if (!p.close) return [0, WEEK];
  const o = weekMinute(p.open);
  let c = weekMinute(p.close);
  if (c <= o) c += WEEK;
  return [o, c];
}

// Google 7/24 yerler için tek, close'suz periyot döner; bazı kayıtlar ise
// her günü 00:00–23:59 olarak listeler — ikisini de 7/24 say.
export function isAlwaysOpen(periods: OpeningPeriod[] | undefined): boolean {
  if (!periods || periods.length === 0) return false;
  if (periods.some((p) => !p.close)) return true;
  const covered = periods.reduce((sum, p) => {
    const [o, c] = span(p);
    return sum + (c - o);
  }, 0);
  return covered >= WEEK - 7 * 2;
}

export function isOpenAt(periods: OpeningPeriod[], date = new Date()): boolean {
  const { dow, minutes } = istanbulNow(date);
  const now = dow * DAY + minutes;
  return periods.some((p) => {
    const [o, c] = span(p);
    return (now >= o && now < c) || (now + WEEK >= o && now + WEEK < c);
  });
}

// Periyot yoksa "bilinmiyor" — saatini bilmediğimiz kliniği kapalı gösterme.
export function statusFromPeriods(
  periods: OpeningPeriod[] | undefined,
  date = new Date()
): ClinicStatus {
  if (!periods || periods.length === 0) return 'unknown';
  return isOpenAt(periods, date) ? 'open' : 'closed';
}
