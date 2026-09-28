import type { Clinic } from '@/types';

export type StatusTone = 'open' | 'closed' | 'unknown';

export const isOpenNow = (c: Pick<Clinic, 'status' | 'is_24_7'>) => c.status === 'open' || c.is_24_7;
export const canCall = (c: Pick<Clinic, 'phone' | 'emergency_phone'>) => !!(c.phone || c.emergency_phone);

/**
 * Acilde önerilecek tek klinik: açık ve aranabilir olanlardan sıralamada ilki.
 * Yarım saat içinde kapanacak klinik ancak başka seçenek yoksa seçilir.
 * (Liste rankClinics ile zaten açık/yakın önce sıralanmış gelir.)
 */
export function pickBestClinic<T extends Clinic>(clinics: T[]): T | null {
  const good = (c: T) => isOpenNow(c) && canCall(c);
  return clinics.find((c) => good(c) && !(c.closes_in_min != null && c.closes_in_min < 30)) ?? clinics.find(good) ?? null;
}

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

/** 850 m · 2,4 km. Konum adresten yaklaşık bulunduysa "~" ile ve 100 m'ye yuvarlanır. */
export function formatDistance(km: number, approx = false): string {
  if (approx) return km < 1 ? `~${Math.max(100, Math.round(km * 10) * 100)} m` : `~${km.toFixed(1).replace('.', ',')} km`;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}
