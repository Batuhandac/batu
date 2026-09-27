// Tarih yardımcıları — takvim günleri YYYY-MM-DD olarak saklanır (saat dilimi
// kaymasın diye yerel öğlen 12:00 ile işlenir).

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysUntil(iso: string, from = todayISO()): number {
  return Math.round((fromISODate(iso).getTime() - fromISODate(from).getTime()) / 86400000);
}

export function formatDate(iso: string, withYear = true): string {
  return fromISODate(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });
}

/** "12.03.2026" → "2026-03-12"; geçersizse null. */
export function parseTRDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null;
  return toISODate(d);
}

export function formatTRDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Bakım zamanı için kısa etiket ve ton: "3 gün gecikti", "Bugün", "Yarın", "12 gün sonra". */
export function dueLabel(iso: string): { label: string; tone: 'sos' | 'honey' | 'primary' | 'neutral' } {
  const n = daysUntil(iso);
  if (n < 0) return { label: `${-n} gün gecikti`, tone: 'sos' };
  if (n === 0) return { label: 'Bugün', tone: 'honey' };
  if (n === 1) return { label: 'Yarın', tone: 'honey' };
  if (n <= 7) return { label: `${n} gün sonra`, tone: 'primary' };
  if (n <= 60) return { label: `${n} gün sonra`, tone: 'neutral' };
  return { label: formatDate(iso, fromISODate(iso).getFullYear() !== new Date().getFullYear()), tone: 'neutral' };
}
