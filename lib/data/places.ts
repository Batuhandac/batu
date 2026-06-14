// Google Places API — Ankara veteriner klinikleri
// Firebase Firestore önbelleği: tüm kullanıcılar tek cache paylaşır (maliyet ~$0)
// API key yoksa sessizce boş döner, statik veri devreye girer.

import { getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Clinic } from '@/types';

const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const BASE = 'https://maps.googleapis.com/maps/api/place';
const ANKARA = { lat: 39.9334, lng: 32.8597 };

// Firebase TTL
const NEARBY_TTL = 6 * 3600 * 1000;   // 6 saat
const DETAILS_TTL = 7 * 24 * 3600 * 1000; // 7 gün

export const isPlacesConfigured = Boolean(KEY && KEY.length > 10);

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

// Ankara ilçelerini tespit et ("..., Çankaya, Ankara" → "Çankaya")
const KNOWN_DISTRICTS = [
  'Çankaya','Keçiören','Mamak','Etimesgut','Yenimahalle','Sincan','Altındağ',
  'Pursaklar','Gölbaşı','Kahramankazan','Beypazarı','Nallıhan','Polatlı',
  'Haymana','Bala','Şereflikoçhisar','Kızılcahamam','Çamlıdere','Ayaş',
  'Güdül','Akyurt','Çubuk','Kazan',
];

function extractDistrict(vicinity: string): string | null {
  const upper = vicinity.toUpperCase();
  for (const d of KNOWN_DISTRICTS) {
    if (upper.includes(d.toUpperCase())) return d;
  }
  // Fallback: parçalara ayır, son kısımları dene
  const parts = vicinity.split(',').map(p => p.trim().replace('/Ankara','').trim());
  for (let i = parts.length - 2; i >= 0; i--) {
    if (parts[i] && !parts[i].match(/Cad\.|Sk\.|Blv\.|No:|Mah\.|^\d/i)) {
      return parts[i];
    }
  }
  return null;
}

function is24_7(periods?: { open?: { day: number; time: string }; close?: { day: number; time: string } }[]): boolean {
  if (!periods || periods.length === 0) return false;
  return periods.some(p => p.open?.time === '0000' && !p.close);
}

function extractPlaceId(clinicId: string): string {
  return clinicId.startsWith('gp-') ? clinicId.slice(3) : clinicId;
}

async function gFetch(endpoint: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, key: KEY, language: 'tr' });
  const res = await fetch(`${BASE}/${endpoint}?${qs}`);
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API status: ${json.status}`);
  }
  return json;
}

// ─── Yakın Arama — 6 saatlik global Firebase önbelleği ───────────────────────

export async function fetchPlacesClinics(
  userLat: number,
  userLng: number
): Promise<Clinic[]> {
  if (!isPlacesConfigured) return [];

  const db = getDb();

  // 1) Firebase cache kontrolü
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'places_cache', 'ankara_vets'));
      if (snap.exists()) {
        const d = snap.data();
        const ageMs = Date.now() - (d.updated_at?.toDate?.()?.getTime?.() ?? 0);
        if (ageMs < NEARBY_TTL && Array.isArray(d.clinics) && d.clinics.length > 0) {
          return enrichWithDistance(d.clinics as Clinic[], userLat, userLng);
        }
      }
    } catch {
      // cache okunamadı — API'ye düş
    }
  }

  // 2) Google Places Nearby Search (en fazla 3 sayfa = 60 klinik)
  const raw: any[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) await new Promise(r => setTimeout(r, 2200)); // Google bekleme zorunluluğu
    const params: Record<string, string> = {
      location: `${ANKARA.lat},${ANKARA.lng}`,
      radius: '25000',
      type: 'veterinary_care',
    };
    if (pageToken) params.pagetoken = pageToken;

    const data = await gFetch('nearbysearch/json', params);
    raw.push(...(data.results ?? []));
    pageToken = data.next_page_token;
  } while (pageToken && raw.length < 60);

  const clinics: Clinic[] = raw.map((p: any) => {
    const openNow = p.opening_hours?.open_now ?? false;
    const nameLower = (p.name as string).toLowerCase();
    const acceptsEmergency =
      nameLower.includes('acil') ||
      nameLower.includes('24 saat') ||
      nameLower.includes('24/7') ||
      (p.types ?? []).includes('emergency_room');

    return {
      id: 'gp-' + p.place_id,
      name: p.name,
      address: p.vicinity ?? null,
      district: extractDistrict(p.vicinity ?? ''),
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      phone: null,            // Place Details ile doldurulur
      is_24_7: false,         // Place Details ile doldurulur
      accepts_emergency: acceptsEmergency,
      is_verified: false,
      verification_status: 'claimed' as const,
      last_verified_at: null,
      rating: p.rating ?? null,
      rating_count: p.user_ratings_total ?? undefined,
      phone_active: true,
      distance_km: 0,
      is_open_now: openNow,
      status: openNow ? 'open' as const : 'closed' as const,
      emergency_score: 0,
      source: 'community' as const, // Clinic tipini zorlamak için community kullan
    };
  });

  // 3) Firebase'e kaydet (6 saat sakla)
  if (db && clinics.length > 0) {
    try {
      await setDoc(doc(db, 'places_cache', 'ankara_vets'), {
        clinics,
        updated_at: serverTimestamp(),
      });
    } catch {
      // kaydetme başarısız — yine de verileri döndür
    }
  }

  return enrichWithDistance(clinics, userLat, userLng);
}

function enrichWithDistance(clinics: Clinic[], lat: number, lng: number): Clinic[] {
  return clinics.map(c => ({
    ...c,
    distance_km: haversine(lat, lng, c.lat, c.lng),
  }));
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Klinik Detayı (telefon + saatler) — 7 günlük cache ─────────────────────

export interface PlaceDetails {
  phone: string | null;
  is_24_7: boolean;
  weekday_text: string[];   // ["Pazartesi: 09:00–19:00", ...]
}

export async function fetchPlaceDetails(clinicId: string): Promise<PlaceDetails | null> {
  if (!isPlacesConfigured) return null;
  const placeId = extractPlaceId(clinicId);

  const db = getDb();

  // Cache kontrolü
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'places_cache', `det_${placeId}`));
      if (snap.exists()) {
        const d = snap.data();
        const ageMs = Date.now() - (d.updated_at?.toDate?.()?.getTime?.() ?? 0);
        if (ageMs < DETAILS_TTL) return d.details as PlaceDetails;
      }
    } catch {}
  }

  // Google Place Details
  const data = await gFetch('details/json', {
    place_id: placeId,
    fields: 'formatted_phone_number,opening_hours',
  });

  const r = data.result ?? {};
  const periods = r.opening_hours?.periods ?? [];

  const details: PlaceDetails = {
    phone: r.formatted_phone_number ?? null,
    is_24_7: is24_7(periods),
    weekday_text: r.opening_hours?.weekday_text ?? [],
  };

  if (db) {
    try {
      await setDoc(doc(db, 'places_cache', `det_${placeId}`), {
        details,
        updated_at: serverTimestamp(),
      });
    } catch {}
  }

  return details;
}

// ─── Fotoğraf URL'si (ücretsiz — sadece URL oluştur) ─────────────────────────
export function getPlacePhotoUrl(photoReference: string, maxWidth = 600): string {
  return `${BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${KEY}`;
}

export { extractPlaceId };
