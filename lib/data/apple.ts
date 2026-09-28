// Apple Haritalar (MapKit) — iOS'ta anahtarsız ve ücretsiz canlı veteriner verisi.
// Google Places anahtarı olmasa da OpenStreetMap'te bulunmayan klinikler listeye
// girsin diye var. Ad, adres, telefon ve konum gelir; çalışma saati ve puan gelmez
// (durum "Saat bilinmiyor"). Aynı klinik başka kaynakta da varsa birleştirilir.
// Sonuçlar ~2 km'lik hücre başına 1 gün cihazda saklanır.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isApplePoiAvailable, searchApplePoi, type ApplePoi } from '@/modules/apple-poi';
import { withLiveStatus } from '@/lib/utils/openingHours';
import { trFold } from '@/lib/data/query';
import type { Clinic } from '@/types';

export const isAppleConfigured = isApplePoiAvailable;

const NEARBY_QUERIES = ['veteriner', 'veteriner kliniği', 'hayvan hastanesi'];
const NEARBY_RADIUS_M = 15000;
const NAME_RADIUS_M = 50000;

const CACHE_KEY = 'patisos:apple:v1';
const CACHE_TTL = 24 * 3600 * 1000;
const CELL_DEG = 0.02;

// Apple "veteriner" aramasında pet shop ve kuaför de döndürebilir
const VET_NAME = /vet|hayvan hastane|hayvan klini|hayvan saglik|animal (hospital|clinic)/;
const NOT_VET = /shop|market|kuafor|otel|pansiyon|mama|aksesuar|egitim/;
const EMERGENCY_HINT = /acil|7\s*\/\s*24|24 saat|nobetci/;

export function isVetPoi(p: Pick<ApplePoi, 'name' | 'category'>, query?: string): boolean {
  if (p.category?.includes('AnimalService')) return true;
  const name = trFold(p.name);
  if (NOT_VET.test(name)) return false;
  if (VET_NAME.test(name)) return true;
  // Adıyla aranan klinik (ör. "Can Dost Kliniği") adında "vet" geçmese de gelsin
  return !!query && name.includes(trFold(query));
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function toAppleClinic(p: ApplePoi): Clinic {
  const street = [p.street, p.number].filter(Boolean).join(' ');
  const address = [p.neighborhood, street].filter(Boolean).join(', ') || null;
  return {
    id: 'ap-' + hash(`${trFold(p.name)}|${p.latitude.toFixed(4)}|${p.longitude.toFixed(4)}`),
    name: p.name,
    address,
    district: p.subAdministrativeArea ?? p.locality ?? null,
    city: p.city ?? null,
    lat: p.latitude,
    lng: p.longitude,
    phone: p.phone ?? null,
    is_24_7: false,
    accepts_emergency: EMERGENCY_HINT.test(trFold(p.name)),
    is_verified: false,
    verification_status: 'seed',
    last_verified_at: null,
    rating: null,
    phone_active: true,
    distance_km: 0,
    is_open_now: false,
    status: 'unknown',
    emergency_score: 0,
    source: 'apple',
  };
}

function toClinics(pois: ApplePoi[], query?: string): Clinic[] {
  const byId = new Map<string, Clinic>();
  for (const p of pois) {
    if (!p.name || !isVetPoi(p, query)) continue;
    const c = toAppleClinic(p);
    if (!byId.has(c.id)) byId.set(c.id, c);
  }
  return [...byId.values()];
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

async function remember(key: string, clinics: Clinic[]): Promise<void> {
  const c = await loadCache();
  const now = Date.now();
  c.cells[key] = { ts: now, ids: clinics.map((x) => x.id) };
  for (const x of clinics) c.places[x.id] = x;
  for (const [k, cell] of Object.entries(c.cells)) if (now - cell.ts > CACHE_TTL) delete c.cells[k];
  const used = new Set(Object.values(c.cells).flatMap((cell) => cell.ids));
  for (const id of Object.keys(c.places)) if (!used.has(id)) delete c.places[id];
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(c)).catch(() => {});
}

async function cached(key: string): Promise<Clinic[] | null> {
  const c = await loadCache();
  const hit = c.cells[key];
  if (!hit || Date.now() - hit.ts > CACHE_TTL) return null;
  return hit.ids.map((id) => c.places[id]).filter(Boolean);
}

function cellKey(lat: number, lng: number): { key: string; lat: number; lng: number } {
  const cLat = Math.round(lat / CELL_DEG) * CELL_DEG;
  const cLng = Math.round(lng / CELL_DEG) * CELL_DEG;
  return { key: `${cLat.toFixed(2)},${cLng.toFixed(2)}`, lat: cLat, lng: cLng };
}

// ─── Arama ───────────────────────────────────────────────────────────────────

/** Konumun çevresindeki Apple Haritalar veterinerleri. */
export async function fetchAppleClinics(lat: number, lng: number): Promise<Clinic[]> {
  if (!isAppleConfigured) return [];
  const cell = cellKey(lat, lng);
  let base = await cached(cell.key);
  if (!base) {
    const lists = await Promise.all(NEARBY_QUERIES.map((q) => searchApplePoi(q, cell.lat, cell.lng, NEARBY_RADIUS_M)));
    base = toClinics(lists.flat());
    if (base.length) await remember(cell.key, base);
  }
  return base.map((c) => withLiveStatus(c, lat, lng));
}

/** Ada ya da semte göre Apple Haritalar araması. */
export async function searchAppleByName(query: string, lat: number, lng: number): Promise<Clinic[]> {
  const q = query.trim();
  if (!isAppleConfigured || q.length < 2) return [];
  const key = `q:${trFold(q)}@${cellKey(lat, lng).key}`;
  let base = await cached(key);
  if (!base) {
    base = toClinics(await searchApplePoi(q, lat, lng, NAME_RADIUS_M), q);
    await remember(key, base);
  }
  return base.map((c) => withLiveStatus(c, lat, lng));
}

/** Tek Apple kaydı (detay ekranı, uygulama yeniden açıldıktan sonra). */
export async function fetchAppleClinic(id: string): Promise<Clinic | null> {
  if (!id.startsWith('ap-')) return null;
  const c = (await loadCache()).places[id];
  return c ? withLiveStatus(c) : null;
}
