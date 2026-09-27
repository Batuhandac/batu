// Google Places API (New) — kullanıcının konumuna göre canlı veteriner verisi.
// - İki arama paralel: en yakın 20 veteriner (Nearby Search) + çevredeki
//   7/24 / acil veterinerler (Text Search). Gece en yakınlar kapalıyken bile
//   açık bir klinik listede olsun diye ikincisi gerekli.
// - Açık/kapalı durumu Google'ın o anki "openNow" değerinden değil, çalışma
//   periyotlarından cihazda hesaplanır → önbellek eskise de durum güncel kalır.
// - Sonuçlar cihazda (AsyncStorage) ~2 km'lik hücre başına 3 gün saklanır.
// - Anahtar yoksa sessizce boş döner, gömülü veri devreye girer.
//
// Google Cloud'da "Places API (New)" etkin olmalı. Eski (legacy) Places API
// yeni projelerde açılamıyor; bu yüzden legacy uç noktaları kullanılmıyor.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { haversine } from '@/lib/utils/geo';
import { isAlwaysOpen, statusFromPeriods } from '@/lib/utils/openingHours';
import type { Clinic, OpeningPeriod } from '@/types';

const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const API = 'https://places.googleapis.com/v1';
const TIMEOUT_MS = 8000;

const NEARBY_RADIUS_M = 15000;
const EMERGENCY_RADIUS_M = 30000;
export const PLACES_RADIUS_KM = EMERGENCY_RADIUS_M / 1000;

const CACHE_KEY = 'patisos:places:v1';
const CACHE_TTL = 3 * 24 * 3600 * 1000; // 3 gün
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

/** Açık/kapalı durumunu (ve konum verildiyse mesafeyi) şu ana göre yeniler. */
export function refreshPlaceStatus(c: Clinic, lat?: number, lng?: number): Clinic {
  const status = c.is_24_7 ? 'open' : statusFromPeriods(c.opening_periods);
  return {
    ...c,
    status,
    is_open_now: status === 'open',
    distance_km: lat != null && lng != null ? haversine(lat, lng, c.lat, c.lng) : c.distance_km,
  };
}

// ─── Cihaz önbelleği ─────────────────────────────────────────────────────────

interface CacheShape {
  cells: Record<string, { ts: number; ids: string[] }>;
  places: Record<string, Clinic>;
}

let mem: CacheShape | null = null;

async function loadCache(): Promise<CacheShape> {
  if (mem) return mem;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    mem = raw ? (JSON.parse(raw) as CacheShape) : { cells: {}, places: {} };
  } catch {
    mem = { cells: {}, places: {} };
  }
  return mem;
}

async function saveCache(c: CacheShape): Promise<void> {
  // Süresi dolan hücreleri ve artık hiçbir hücrenin göstermediği klinikleri at
  const now = Date.now();
  for (const [k, cell] of Object.entries(c.cells)) {
    if (now - cell.ts > CACHE_TTL) delete c.cells[k];
  }
  const used = new Set(Object.values(c.cells).flatMap((cell) => cell.ids));
  for (const id of Object.keys(c.places)) {
    if (!used.has(id)) delete c.places[id];
  }
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    // disk dolu vb. — bellek içi kopya yine kullanılır
  }
}

function cellOf(lat: number, lng: number): { key: string; lat: number; lng: number } {
  const cLat = Math.round(lat / CELL_DEG) * CELL_DEG;
  const cLng = Math.round(lng / CELL_DEG) * CELL_DEG;
  return { key: `${cLat.toFixed(2)},${cLng.toFixed(2)}`, lat: cLat, lng: cLng };
}

// ─── Arama ───────────────────────────────────────────────────────────────────

const inflight = new Map<string, Promise<Clinic[]>>();

async function searchCell(cell: { key: string; lat: number; lng: number }): Promise<Clinic[]> {
  const center = { latitude: cell.lat, longitude: cell.lng };
  const [nearby, emergency] = await Promise.allSettled([
    request('places:searchNearby', SEARCH_MASK, {
      includedTypes: ['veterinary_care'],
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      locationRestriction: { circle: { center, radius: NEARBY_RADIUS_M } },
      languageCode: 'tr',
      regionCode: 'TR',
    }),
    request('places:searchText', SEARCH_MASK, {
      textQuery: '7/24 acil veteriner',
      includedType: 'veterinary_care',
      pageSize: 20,
      locationBias: { circle: { center, radius: EMERGENCY_RADIUS_M } },
      languageCode: 'tr',
      regionCode: 'TR',
    }),
  ]);
  if (nearby.status === 'rejected' && emergency.status === 'rejected') throw nearby.reason;

  const byId = new Map<string, Clinic>();
  for (const r of [nearby, emergency]) {
    if (r.status !== 'fulfilled') continue;
    for (const p of r.value?.places ?? []) {
      const c = toPlaceClinic(p);
      if (c && !byId.has(c.id)) byId.set(c.id, c);
    }
  }
  const clinics = [...byId.values()];

  // Yalnız iki arama da başarılıysa sakla — yarım sonuç 3 gün kalmasın
  if (nearby.status === 'fulfilled' && emergency.status === 'fulfilled') {
    const cache = await loadCache();
    cache.cells[cell.key] = { ts: Date.now(), ids: clinics.map((c) => c.id) };
    for (const c of clinics) cache.places[c.id] = c;
    await saveCache(cache);
  }
  return clinics;
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
  return base.map((c) => refreshPlaceStatus(c, lat, lng));
}

/** Tek Google kliniği (detay ekranı): önce önbellek, yoksa Place Details. */
export async function fetchPlaceClinic(clinicId: string): Promise<Clinic | null> {
  if (!clinicId.startsWith('gp-')) return null;
  const cache = await loadCache();
  const cached = cache.places[clinicId];
  if (cached) return refreshPlaceStatus(cached);
  if (!isPlacesConfigured) return null;

  const placeId = encodeURIComponent(clinicId.slice(3));
  const p = await request(`places/${placeId}?languageCode=tr&regionCode=TR`, DETAILS_MASK);
  const c = toPlaceClinic(p);
  return c ? refreshPlaceStatus(c) : null;
}
