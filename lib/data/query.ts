// Yerel (offline) klinik sorgusu — Supabase nearby_clinics RPC'sinin
// istemci tarafı eşdeğeri. Mesafe (haversine), açık-mı (çalışma saatleri)
// ve emergency_score hesabını cihazda yapar. Backend/internet gerektirmez.
import type { Clinic, ClinicHours, NearbyFilters, ClinicStatus } from '@/types';
import { haversine } from '@/lib/utils/geo';
import { istanbulNow } from '@/lib/utils/openingHours';
import { CLINICS } from './clinics';
import type { SeedClinic } from './types';

// Seed verisindeki kurallarla bugünün çalışma penceresini türet
// (seed_ankara.sql çalışma saati blokları ile aynı mantık).
function todayHours(c: SeedClinic, dow: number): { open: number; close: number } | null {
  if (c.is_24_7) return { open: 0, close: 24 * 60 };
  if (dow === 0) return null; // Pazar kapalı
  if ((c.rating ?? 0) >= 4.0) return { open: 9 * 60, close: 20 * 60 };
  if (c.accepts_emergency) return { open: 10 * 60, close: 22 * 60 };
  return { open: 9 * 60, close: 18 * 60 };
}

function isOpenNow(c: SeedClinic): boolean {
  const { dow, minutes } = istanbulNow();
  const h = todayHours(c, dow);
  if (!h) return false;
  return minutes >= h.open && minutes < h.close;
}

function statusOf(c: SeedClinic, open: boolean): ClinicStatus {
  if (c.verified_days_ago == null || c.verified_days_ago > 7) return 'unknown';
  return open ? 'open' : 'closed';
}

function score(c: SeedClinic, distanceKm: number, open: boolean): number {
  const fOpen =
    c.verified_days_ago == null || c.verified_days_ago > 7 ? 0.3 : open ? 1.0 : 0.0;
  const fEmergency = c.accepts_emergency ? 1 : 0;
  const fFullTime = c.is_24_7 ? 1 : 0;
  const fVerified = c.is_verified ? 1 : 0;
  const fDistance = Math.max(0, Math.min(1, 1 - distanceKm / 15));
  const fFreshness =
    c.verified_days_ago == null ? 0 : Math.max(0, Math.min(1, 1 - c.verified_days_ago / 7));
  const fOpenPing = 0.5; // ping verisi offline yok → nötr
  const fPhoneRate = 0.5; // feedback verisi offline yok → nötr
  const fRating = (c.rating ?? 3.5) / 5;

  let s =
    0.2 * fOpen +
    0.16 * fEmergency +
    0.13 * fFullTime +
    0.11 * fVerified +
    0.11 * fDistance +
    0.1 * fFreshness +
    0.08 * fOpenPing +
    0.06 * fPhoneRate +
    0.05 * fRating;

  // Kesin kapalı (ve 7/24 değil) cezası
  if (!open && !c.is_24_7) s *= 0.2;
  return s;
}

function lastVerifiedISO(daysAgo: number | null): string | null {
  if (daysAgo == null) return null;
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

/** Gömülü kaydı, şu anki açık/kapalı durumuyla Clinic'e çevirir. */
export function seedToClinic(c: SeedClinic, lat?: number, lng?: number): Clinic {
  const distanceKm = lat != null && lng != null ? haversine(lat, lng, c.lat, c.lng) : 0;
  const open = isOpenNow(c);
  return {
    id: c.id,
    name: c.name,
    address: c.address,
    district: c.district,
    city: c.city,
    lat: c.lat,
    lng: c.lng,
    phone: c.phone,
    is_24_7: c.is_24_7,
    accepts_emergency: c.accepts_emergency,
    is_verified: c.is_verified,
    verification_status: c.verification_status as Clinic['verification_status'],
    last_verified_at: lastVerifiedISO(c.verified_days_ago),
    rating: c.rating,
    phone_active: true,
    distance_km: distanceKm,
    is_open_now: open,
    status: statusOf(c, open),
    emergency_score: score(c, distanceKm, open),
    source: 'builtin',
  };
}

/**
 * Yerel veri üzerinden yakın klinikleri döndürür — Supabase RPC ile aynı şekil.
 */
export function queryNearbyClinics(
  lat: number,
  lng: number,
  filters: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false },
  radiusKm = 15
): Clinic[] {
  const result: Clinic[] = [];

  for (const c of CLINICS) {
    if (filters.only_24_7 && !c.is_24_7) continue;
    if (filters.only_emergency && !c.accepts_emergency) continue;
    if (haversine(lat, lng, c.lat, c.lng) > radiusKm) continue;

    const clinic = seedToClinic(c, lat, lng);
    if (filters.only_open && clinic.status !== 'open' && !clinic.is_24_7) continue;
    result.push(clinic);
  }

  result.sort((a, b) => b.emergency_score - a.emergency_score);
  return result;
}

/**
 * Canlı (Google) ve topluluk kliniklerini mesafe + skorla zenginleştirir,
 * yarıçap/filtreye göre eler. Gömülü veriyle aynı ağırlıklar kullanılır ki
 * birleşik liste tek skora göre sıralanabilsin.
 */
export function rankClinics(
  clinics: Clinic[],
  lat: number,
  lng: number,
  filters: NearbyFilters,
  radiusKm = 15
): Clinic[] {
  const out: Clinic[] = [];
  for (const c of clinics) {
    const open = c.status === 'open' || c.is_24_7;
    if (filters.only_24_7 && !c.is_24_7) continue;
    if (filters.only_emergency && !c.accepts_emergency) continue;
    if (filters.only_open && !open) continue;
    const distanceKm = haversine(lat, lng, c.lat, c.lng);
    if (distanceKm > radiusKm) continue;
    // Yerel skorlamayla aynı ağırlıklar (ping/feedback nötr 0.5)
    const fOpen = open ? 1.0 : c.status === 'unknown' ? 0.3 : 0.0;
    const fDistance = Math.max(0, Math.min(1, 1 - distanceKm / 15));
    const fRating = (c.rating ?? 3.5) / 5;
    let s =
      0.2 * fOpen +
      0.16 * (c.accepts_emergency ? 1 : 0) +
      0.13 * (c.is_24_7 ? 1 : 0) +
      0.11 * (c.is_verified ? 1 : 0) +
      0.11 * fDistance +
      0.1 * 0 + // tazelik verisi yok
      0.08 * 0.5 +
      0.06 * 0.5 +
      0.05 * fRating;
    if (c.status === 'closed' && !c.is_24_7) s *= 0.2;
    out.push({ ...c, distance_km: distanceKm, emergency_score: s });
  }
  return out;
}

/** Tek klinik (detay ekranı için). */
export function getClinicById(id: string): SeedClinic | null {
  return CLINICS.find((c) => c.id === id) ?? null;
}

/** Detay ekranı için bugünkü değil tüm haftanın saatleri (gösterim amaçlı). */
export function getClinicHours(id: string): ClinicHours[] {
  const c = getClinicById(id);
  if (!c) return [];
  const hours: ClinicHours[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const h = todayHours(c, weekday);
    hours.push({
      id: `${id}-h${weekday}`,
      clinic_id: id,
      weekday,
      open_time: h ? minToTime(h.open) : null,
      close_time: h ? minToTime(h.close) : null,
      is_closed: !h,
      is_overnight: c.is_24_7,
    });
  }
  return hours;
}

function minToTime(m: number): string {
  const clamped = Math.min(m, 23 * 60 + 59);
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}:00`;
}
