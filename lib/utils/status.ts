import type { Clinic } from '@/types';

export type StatusTone = 'open' | 'closed' | 'unknown';

export const isOpenNow = (c: Pick<Clinic, 'status' | 'is_24_7'>) => c.status === 'open' || c.is_24_7;

/** Tüm ekranlarda aynı durum dili: Açık / Kapalı / Saat bilinmiyor. */
export function clinicStatus(c: Pick<Clinic, 'status' | 'is_24_7' | 'closes_in_min'>): {
  label: string;
  tone: StatusTone;
  closingSoon: string | null;
} {
  if (c.is_24_7) return { label: '7/24 açık', tone: 'open', closingSoon: null };
  if (c.status === 'open') {
    const soon = c.closes_in_min != null && c.closes_in_min < 60 ? `${c.closes_in_min} dk sonra kapanıyor` : null;
    return { label: 'Açık', tone: 'open', closingSoon: soon };
  }
  if (c.status === 'closed') return { label: 'Kapalı', tone: 'closed', closingSoon: null };
  return { label: 'Saat bilinmiyor', tone: 'unknown', closingSoon: null };
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}
