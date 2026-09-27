// Yerel (offline) klinik sorgusu ve tüm kaynaklar için ortak sıralama.
// Mesafe (haversine), açık-mı (çalışma saatleri) ve emergency_score hesabını
// cihazda yapar. Backend/internet gerektirmez.
import type { Clinic, NearbyFilters, OpeningPeriod } from '@/types';
import { haversine } from '@/lib/utils/geo';
import { isAlwaysOpen, weekdayText, withLiveStatus } from '@/lib/utils/openingHours';
import { parseOsmHours } from '@/lib/utils/osmHours';
import { CLINICS } from './clinics';
import type { SeedClinic } from './types';

const periodsCache = new Map<string, OpeningPeriod[] | undefined>();

function periodsOf(c: SeedClinic): OpeningPeriod[] | undefined {
  if (!periodsCache.has(c.id)) periodsCache.set(c.id, parseOsmHours(c.opening_hours));
  return periodsCache.get(c.id);
}

/** Gömülü kaydı, şu anki açık/kapalı durumuyla Clinic'e çevirir. */
export function seedToClinic(c: SeedClinic, lat?: number, lng?: number): Clinic {
  const periods = periodsOf(c);
  const is247 = isAlwaysOpen(periods);
  return withLiveStatus(
    {
      id: c.id,
      name: c.name,
      address: c.address,
      district: c.district,
      city: c.city,
      lat: c.lat,
      lng: c.lng,
      phone: c.phone,
      is_24_7: is247,
      accepts_emergency: c.emergency || is247,
      is_verified: false,
      verification_status: 'seed',
      last_verified_at: null,
      rating: null,
      phone_active: true,
      distance_km: 0,
      is_open_now: false,
      status: 'unknown',
      emergency_score: 0,
      source: 'builtin',
      opening_periods: periods,
      weekday_text: periods && periods.length > 0 ? weekdayText(periods) : undefined,
    },
    lat,
    lng
  );
}

/** Gömülü veriden yarıçap içindeki klinikler (filtresiz, sırasız). */
export function nearbySeedClinics(lat: number, lng: number, radiusKm = 20): Clinic[] {
  return CLINICS.filter((c) => haversine(lat, lng, c.lat, c.lng) <= radiusKm).map((c) =>
    seedToClinic(c, lat, lng)
  );
}

/** Gömülü veriden yakın klinikler (skorlu, sıralı). */
export function queryNearbyClinics(
  lat: number,
  lng: number,
  filters: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false },
  radiusKm = 15
): Clinic[] {
  return rankClinics(nearbySeedClinics(lat, lng, radiusKm), lat, lng, filters, radiusKm).sort(
    (a, b) => b.emergency_score - a.emergency_score
  );
}

/**
 * Klinikleri mesafe + skorla zenginleştirir, yarıçap/filtreye göre eler.
 * Tüm kaynaklar (Google, gömülü, topluluk) aynı ağırlıklarla puanlanır ki
 * birleşik liste tek skora göre sıralanabilsin. Sıralama satın alınamaz:
 * yalnızca açık olma, acil kabul, 7/24, doğrulanmış bilgi, mesafe ve puan.
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
    const fOpen = open ? 1.0 : c.status === 'unknown' ? 0.3 : 0.0;
    const fDistance = Math.max(0, Math.min(1, 1 - distanceKm / 15));
    const fRating = (c.rating ?? 3.5) / 5;
    let s =
      0.2 * fOpen +
      0.16 * (c.accepts_emergency ? 1 : 0) +
      0.13 * (c.is_24_7 ? 1 : 0) +
      0.11 * (c.is_verified ? 1 : 0) + // klinik bilgilerini onayladı (ücretsiz)
      0.11 * fDistance +
      0.08 * (c.phone ? 1 : 0) + // acilde aranabilir olmak önemli
      0.05 * fRating;
    if (c.status === 'closed' && !c.is_24_7) s *= 0.2;
    out.push({ ...c, distance_km: distanceKm, emergency_score: s });
  }
  return out;
}

/** Tek gömülü klinik (detay ekranı için). */
export function getClinicById(id: string): SeedClinic | null {
  return CLINICS.find((c) => c.id === id) ?? null;
}

/** Ada göre gömülü klinik arama (veteriner hekim ekranı için). */
export function searchClinicsByName(query: string, limit = 20): SeedClinic[] {
  const q = trFold(query);
  if (q.length < 2) return [];
  return CLINICS.filter((c) => trFold(c.name).includes(q)).slice(0, limit);
}

export function trFold(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}
