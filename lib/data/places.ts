// Google Places API (New) — kullanıcının konumuna göre canlı veteriner verisi.
// - Üç arama paralel: en yakın 20 veteriner (Nearby Search), mesafeye göre
//   sıralı "veteriner" metin araması (sayfalı, en fazla 40) ve çevredeki 7/24 /
//   acil veterinerler. Nearby Search tek başına 20 sonuçla sınırlı; şehir
//   merkezinde bu 20 klinik 2-3 km'yi doldurur ve biraz uzaktakiler kaybolur.
//   Gece en yakınlar kapalıyken bile açık bir klinik listede olsun diye acil
//   araması da gerekli.
// - Ada göre arama (searchPlacesByName): listede olmayan bir kliniği bulmak için.
// - Açık/kapalı durumu Google'ın o anki "openNow" değerinden değil, çalışma
//   periyotlarından cihazda hesaplanır → önbellek eskise de durum güncel kalır.
// - Google koşulları gereği sonuçlar cihaza kaydedilmez (yalnızca place ID
//   kalıcı saklanabilir, ör. favoriler). Uygulama açıkken ~2 km'lik hücre başına
//   30 dakika bellekte tutulur; aynı ekranı tekrar açmak yeni istek atmaz.
// - Google yorumları (fetchPlaceReviews) yalnızca kullanıcı isteyince çekilir.
// - Anahtar yoksa sessizce boş döner, gömülü veri devreye girer.
//
// Google Cloud'da "Places API (New)" etkin olmalı. Eski (legacy) Places API
// yeni projelerde açılamıyor; bu yüzden legacy uç noktaları kullanılmıyor.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isAlwaysOpen, withLiveStatus } from '@/lib/utils/openingHours';
import type { Clinic, OpeningPeriod } from '@/types';

const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const API = 'https://places.googleapis.com/v1';
const TIMEOUT_MS = 8000;

const NEARBY_RADIUS_M = 15000;
const EMERGENCY_RADIUS_M = 30000;
const NAME_SEARCH_RADIUS_M = 50000;
const TEXT_PAGES = 2; // sayfa başına 20 sonuç
export const PLACES_RADIUS_KM = EMERGENCY_RADIUS_M / 1000;

// Eski sürümler Google sonuçlarını cihaza yazıyordu; ilk açılışta silinir
const LEGACY_CACHE_KEYS = ['patisos:places', 'patisos:places:v1', 'patisos:places:v2'];
const CACHE_TTL = 30 * 60 * 1000; // uygulama açıkken 30 dakika, yalnızca bellekte
const CELL_DEG = 0.02; // ~2 km

export const isPlacesConfigured = KEY.length > 10;

const FIELDS = [
  'id',
  'displayName',
  'shortFormattedAddress',
  'formattedAddress',
  'addressComponents',
  'location',
  'rating',
  'userRatingCount',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'regularOpeningHours',
  'businessStatus',
];
const SEARCH_MASK = FIELDS.map((f) => `places.${f}`).join(',');
const PAGED_MASK = `${SEARCH_MASK},nextPageToken`;
const DETAILS_MASK = FIELDS.join(',');

// ─── HTTP ────────────────────────────────────────────────────────────────────

function headers(fieldMask: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': KEY,
    'X-Goog-FieldMask': fieldMask,
  };
  // Anahtar Google Cloud'da uygulamaya kısıtlanırsa Google bu başlıklara bakar
  if (Platform.OS === 'ios') {
    h['X-Ios-Bundle-Identifier'] = Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.patisos.app';
  } else if (Platform.OS === 'android') {
    h['X-Android-Package'] = Constants.expoConfig?.android?.package ?? 'com.patisos.app';
  }
  return h;
}

async function request(path: string, fieldMask: string, body?: object): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: headers(fieldMask),
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Places API ${res.status} ${json?.error?.status ?? ''} ${json?.error?.message ?? ''}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Google yanıtı → Clinic ─────────────────────────────────────────────────

const KNOWN_DISTRICTS = [
  'Çankaya', 'Keçiören', 'Mamak', 'Etimesgut', 'Yenimahalle', 'Sincan', 'Altındağ',
  'Pursaklar', 'Gölbaşı', 'Kahramankazan', 'Beypazarı', 'Nallıhan', 'Polatlı',
  'Haymana', 'Bala', 'Şereflikoçhisar', 'Kızılcahamam', 'Çamlıdere', 'Ayaş',
  'Güdül', 'Akyurt', 'Çubuk', 'Elmadağ', 'Evren', 'Kalecik',
];

function component(p: any, type: string): string | null {
  const c = (p.addressComponents ?? []).find((a: any) => (a.types ?? []).includes(type));
  return c?.longText ?? null;
}

// Türkiye'de administrative_area_level_2 = ilçe, level_1 = il
function districtOf(p: any, address: string): string | null {
  const d = component(p, 'administrative_area_level_2');
  if (d) return d;
  const lower = trLower(address);
  return KNOWN_DISTRICTS.find((k) => lower.includes(trLower(k))) ?? null;
}

function trLower(s: string): string {
  return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

// proto3 JSON sıfır değerleri atlayabilir (ör. Pazar 00:00 → {}), varsayılan 0
function normalizePeriods(raw: any[] | undefined): OpeningPeriod[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const point = (x: any) => ({ day: x?.day ?? 0, hour: x?.hour ?? 0, minute: x?.minute ?? 0 });
  return raw.map((r) => ({ open: point(r.open), ...(r.close ? { close: point(r.close) } : {}) }));
}

const EMERGENCY_HINT = /acil|7\s*\/\s*24|24 saat|nöbetçi/;

export function toPlaceClinic(p: any): Clinic | null {
  if (!p?.id || !p.location) return null;
  if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') return null;

  const name: string = p.displayName?.text ?? 'Veteriner Kliniği';
  const address: string | null = p.shortFormattedAddress ?? p.formattedAddress ?? null;
  const periods = normalizePeriods(p.regularOpeningHours?.periods);
  const is247 = isAlwaysOpen(periods);

  return {
    id: 'gp-' + p.id,
    name,
    address,
    district: districtOf(p, p.formattedAddress ?? address ?? ''),
    city: component(p, 'administrative_area_level_1'),
    lat: p.location.latitude,
    lng: p.location.longitude,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    is_24_7: is247,
    accepts_emergency: is247 || EMERGENCY_HINT.test(trLower(name)),
    is_verified: false,
    verification_status: 'seed',
    last_verified_at: null,
    rating: p.rating ?? null,
    rating_count: p.userRatingCount,
    phone_active: true,
    distance_km: 0,
    is_open_now: false,
    status: 'unknown',
    emergency_score: 0,
    source: 'google',
    opening_periods: periods,
    weekday_text: p.regularOpeningHours?.weekdayDescriptions,
  };
}

// ─── Oturum önbelleği (yalnızca bellek) ────────────────────────────────────

interface CacheShape {
  cells: Record<string, { ts: number; ids: string[] }>;
  places: Record<string, Clinic>;
}

let mem: CacheShape | null = null;

async function loadCache(): Promise<CacheShape> {
  if (mem) return mem;
  mem = { cells: {}, places: {} };
  AsyncStorage.multiRemove(LEGACY_CACHE_KEYS).catch(() => {});
  return mem;
}

function prune(c: CacheShape): void {
  // Süresi dolan hücreleri ve artık hiçbir hücrenin göstermediği klinikleri at
  const now = Date.now();
  for (const [k, cell] of Object.entries(c.cells)) {
    if (now - cell.ts > CACHE_TTL) delete c.cells[k];
  }
  const used = new Set(Object.values(c.cells).flatMap((cell) => cell.ids));
  for (const id of Object.keys(c.places)) {
    if (!used.has(id)) delete c.places[id];
  }
}

function cellOf(lat: number, lng: number): { key: string; lat: number; lng: number } {
  const cLat = Math.round(lat / CELL_DEG) * CELL_DEG;
  const cLng = Math.round(lng / CELL_DEG) * CELL_DEG;
  return { key: `${cLat.toFixed(2)},${cLng.toFixed(2)}`, lat: cLat, lng: cLng };
}

// ─── Arama ───────────────────────────────────────────────────────────────────

const inflight = new Map<string, Promise<Clinic[]>>();

/** Sayfalı metin araması: her sayfa 20 sonuç, en fazla `pages` sayfa. */
async function textSearchPages(body: object, pages: number): Promise<{ places: any[] }> {
  const places: any[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < pages; i++) {
    const json = await request('places:searchText', PAGED_MASK, pageToken ? { ...body, pageToken } : body);
    places.push(...(json?.places ?? []));
    pageToken = json?.nextPageToken;
    if (!pageToken) break;
  }
  return { places };
}

async function searchCell(cell: { key: string; lat: number; lng: number }): Promise<Clinic[]> {
  const center = { latitude: cell.lat, longitude: cell.lng };
  const results = await Promise.allSettled([
    request('places:searchNearby', SEARCH_MASK, {
      includedTypes: ['veterinary_care'],
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      locationRestriction: { circle: { center, radius: NEARBY_RADIUS_M } },
      languageCode: 'tr',
      regionCode: 'TR',
    }),
    textSearchPages(
      {
        textQuery: 'veteriner',
        includedType: 'veterinary_care',
        strictTypeFiltering: true,
        rankPreference: 'DISTANCE',
        pageSize: 20,
        locationBias: { circle: { center, radius: NEARBY_RADIUS_M } },
        languageCode: 'tr',
        regionCode: 'TR',
      },
      TEXT_PAGES
    ),
    request('places:searchText', SEARCH_MASK, {
      textQuery: '7/24 acil veteriner',
      includedType: 'veterinary_care',
      pageSize: 20,
      locationBias: { circle: { center, radius: EMERGENCY_RADIUS_M } },
      languageCode: 'tr',
      regionCode: 'TR',
    }),
  ]);
  if (results.every((r) => r.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;

  const clinics = collect(results);
  // Yalnız tüm aramalar başarılıysa sakla — yarım sonuç önbellekte kalmasın
  if (results.every((r) => r.status === 'fulfilled')) await remember(cell.key, clinics);
  return clinics;
}

function collect(results: PromiseSettledResult<{ places?: any[] }>[]): Clinic[] {
  const byId = new Map<string, Clinic>();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const p of r.value?.places ?? []) {
      const c = toPlaceClinic(p);
      if (c && !byId.has(c.id)) byId.set(c.id, c);
    }
  }
  return [...byId.values()];
}

async function remember(key: string, clinics: Clinic[]): Promise<void> {
  const cache = await loadCache();
  cache.cells[key] = { ts: Date.now(), ids: clinics.map((c) => c.id) };
  for (const c of clinics) cache.places[c.id] = c;
  prune(cache);
}

/** Konumun çevresindeki Google veteriner kayıtları (durum + mesafe güncel). */
export async function fetchPlacesClinics(lat: number, lng: number): Promise<Clinic[]> {
  if (!isPlacesConfigured) return [];

  const cell = cellOf(lat, lng);
  const cache = await loadCache();
  const hit = cache.cells[cell.key];

  let base: Clinic[];
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    base = hit.ids.map((id) => cache.places[id]).filter(Boolean);
  } else {
    let pending = inflight.get(cell.key);
    if (!pending) {
      pending = searchCell(cell).finally(() => inflight.delete(cell.key));
      inflight.set(cell.key, pending);
    }
    base = await pending;
  }
  return base.map((c) => withLiveStatus(c, lat, lng));
}

/**
 * Ada ya da semte göre veteriner arama ("Vetmagic", "Bağlıca veteriner").
 * Kullanıcının çevresi öncelikli ama 50 km dışı da gelebilir. Aynı arama
 * 30 dakika içinde tekrarlanırsa bellekteki sonuç kullanılır.
 */
export async function searchPlacesByName(query: string, lat: number, lng: number): Promise<Clinic[]> {
  const q = query.trim();
  if (!isPlacesConfigured || q.length < 2) return [];

  const key = `q:${trLower(q)}@${cellOf(lat, lng).key}`;
  const cache = await loadCache();
  const hit = cache.cells[key];
  let base: Clinic[];
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    base = hit.ids.map((id) => cache.places[id]).filter(Boolean);
  } else {
    const json = await request('places:searchText', SEARCH_MASK, {
      textQuery: q,
      includedType: 'veterinary_care',
      pageSize: 20,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: NAME_SEARCH_RADIUS_M } },
      languageCode: 'tr',
      regionCode: 'TR',
    });
    base = collect([{ status: 'fulfilled', value: json }]);
    await remember(key, base);
  }
  return base.map((c) => withLiveStatus(c, lat, lng));
}

/** Tek Google kliniği (detay ekranı): önce önbellek, yoksa Place Details. */
export async function fetchPlaceClinic(clinicId: string): Promise<Clinic | null> {
  if (!clinicId.startsWith('gp-')) return null;
  const cache = await loadCache();
  const cached = cache.places[clinicId];
  if (cached) return withLiveStatus(cached);
  if (!isPlacesConfigured) return null;

  const placeId = encodeURIComponent(clinicId.slice(3));
  const p = await request(`places/${placeId}?languageCode=tr&regionCode=TR`, DETAILS_MASK);
  const c = toPlaceClinic(p);
  return c ? withLiveStatus(c) : null;
}

// ─── Google yorumları ───────────────────────────────────────────────────────

export interface GoogleReview {
  author: string;
  author_uri: string | null; // yazarın Google Maps profili
  author_photo: string | null;
  rating: number;
  text: string;
  when: string; // "2 hafta önce" (Google'ın yazdığı gibi)
  maps_uri: string | null; // yorumun Google Maps'teki yeri
}

export interface GoogleReviews {
  rating: number | null;
  count: number | null;
  maps_uri: string | null; // kliniğin Google Maps sayfası (tüm yorumlar)
  reviews: GoogleReview[];
}

/** Kliniğin Google place ID'si: Google kaydıysa kimliğinden, birleştirilmişse alanından. */
export function googlePlaceIdOf(c: Pick<Clinic, 'id' | 'google_place_id'>): string | null {
  if (c.id.startsWith('gp-')) return c.id.slice(3);
  return c.google_place_id ?? null;
}

// Place Details'te "reviews" alanı en pahalı fiyat grubunda (Enterprise + Atmosphere);
// bu yüzden yalnızca kullanıcı "Yorumları göster" deyince ve oturumda bir kez çekilir.
const REVIEWS_MASK = 'reviews,rating,userRatingCount,googleMapsUri';
const reviewMemo = new Map<string, Promise<GoogleReviews | null>>();

export function toGoogleReviews(p: any): GoogleReviews {
  const reviews: GoogleReview[] = (p?.reviews ?? [])
    .map((r: any) => ({
      author: r?.authorAttribution?.displayName ?? 'Google kullanıcısı',
      author_uri: r?.authorAttribution?.uri ?? null,
      author_photo: r?.authorAttribution?.photoUri ?? null,
      rating: typeof r?.rating === 'number' ? r.rating : 0,
      text: (r?.text?.text ?? r?.originalText?.text ?? '').trim(),
      when: r?.relativePublishTimeDescription ?? '',
      maps_uri: r?.googleMapsUri ?? null,
    }))
    .filter((r: GoogleReview) => r.rating > 0 || r.text);
  return { rating: p?.rating ?? null, count: p?.userRatingCount ?? null, maps_uri: p?.googleMapsUri ?? null, reviews };
}

/** Google'daki en ilgili 5 yorum (Google'ın sıralaması). Anahtar yoksa null. */
export function fetchPlaceReviews(placeId: string): Promise<GoogleReviews | null> {
  if (!isPlacesConfigured || !placeId) return Promise.resolve(null);
  let pending = reviewMemo.get(placeId);
  if (!pending) {
    pending = request(`places/${encodeURIComponent(placeId)}?languageCode=tr&regionCode=TR`, REVIEWS_MASK)
      .then(toGoogleReviews)
      .catch((e) => {
        reviewMemo.delete(placeId); // hata kalıcı olmasın, sonra tekrar denensin
        throw e;
      });
    reviewMemo.set(placeId, pending);
  }
  return pending;
}
