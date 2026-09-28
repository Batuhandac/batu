import { useState, useCallback, useRef } from 'react';
import { cacheClinics } from '@/lib/cache';
import { nearbySeedClinics, rankClinics, trFold } from '@/lib/data/query';
import { fetchCommunityClinics } from '@/lib/data/community';
import { fetchPlacesClinics, PLACES_RADIUS_KM } from '@/lib/data/places';
import { fetchAppleClinics } from '@/lib/data/apple';
import { applyProfile, cachedProfiles, loadClinicProfiles, type ProfileMap } from '@/lib/data/profiles';
import { registerClinics } from '@/lib/data/registry';
import { haversine } from '@/lib/utils/geo';
import { withLiveStatus } from '@/lib/utils/openingHours';
import type { Clinic, NearbyFilters } from '@/types';

const LOCAL_RADIUS_KM = 20;
const SOURCE_TIMEOUT_MS = 7000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

interface UseClinicsResult {
  clinics: Clinic[];
  loading: boolean;
  error: string | null;
  offline: boolean;
  cacheTimestamp: string | null;
  // Listede Google'dan gelen canlı veri var mı
  live: boolean;
  fetch: (lat: number, lng: number, filters?: NearbyFilters) => Promise<void>;
}

/**
 * Tüm kaynakları birleştirir: Google Places (canlı) + Apple Haritalar (iOS, canlı,
 * anahtarsız) + OpenStreetMap (gömülü, çevrimdışı) + topluluk. Aynı klinik birden çok kaynakta varsa en iyi kayıt
 * tutulur, eksik telefon/saat diğerinden tamamlanır; klinik onaylı profiller
 * en üste uygulanır. Sonra tek skorla sıralanır.
 */
export function buildClinicList(
  lat: number,
  lng: number,
  filters: NearbyFilters,
  sources: { places: Clinic[]; apple?: Clinic[]; local: Clinic[]; community: Clinic[] },
  profiles: ProfileMap
): Clinic[] {
  const withProfile = (cs: Clinic[]) => cs.map((c) => applyProfile(c, profiles[c.id]));
  const merged = deduplicateClinics([
    ...withProfile(sources.places),
    ...withProfile(sources.local),
    ...withProfile(sources.apple ?? []),
    ...withProfile(sources.community),
  ]);
  return rankClinics(merged, lat, lng, filters, PLACES_RADIUS_KM).sort(
    (a, b) => b.emergency_score - a.emergency_score
  );
}

export function useClinics(): UseClinicsResult {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const latestRequest = useRef(0);

  const fetch = useCallback(
    async (
      lat: number,
      lng: number,
      filters: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false }
    ) => {
      const requestId = ++latestRequest.current;
      setLoading(true);
      setError(null);
      try {
        // 1) Gömülü (OpenStreetMap) klinikler — anında, çevrimdışı çalışır
        const local = nearbySeedClinics(lat, lng, LOCAL_RADIUS_KM);
        const first = buildClinicList(lat, lng, filters, { places: [], local, community: [] }, cachedProfiles());
        setClinics(first);
        setLive(false);
        registerClinics(first);
        cacheClinics(first).catch(() => {});

        // 2) Google Places + Apple Haritalar + topluluk + onaylı profiller — paralel
        // Zayıf bağlantıda hiçbir kaynak listeyi sonsuza dek "yükleniyor"da tutmasın
        const [places, apple, community, profiles] = await Promise.allSettled([
          fetchPlacesClinics(lat, lng),
          withTimeout(fetchAppleClinics(lat, lng), SOURCE_TIMEOUT_MS),
          withTimeout(fetchCommunityClinics(), SOURCE_TIMEOUT_MS),
          withTimeout(loadClinicProfiles(), SOURCE_TIMEOUT_MS),
        ]);
        // Bu sırada filtre/konum değiştiyse eski sonucu yazma
        if (requestId !== latestRequest.current) return;

        const placesData = places.status === 'fulfilled' ? places.value : [];
        const appleData = apple.status === 'fulfilled' ? apple.value : [];
        const full = buildClinicList(
          lat,
          lng,
          filters,
          {
            places: placesData,
            apple: appleData,
            local,
            community: community.status === 'fulfilled' ? community.value : [],
          },
          profiles.status === 'fulfilled' ? profiles.value : cachedProfiles()
        );
        registerClinics(full);
        setClinics(full);
        setLive(placesData.length > 0 || appleData.length > 0);
      } catch {
        if (requestId === latestRequest.current) setError('Klinikler yüklenemedi. Tekrar dene.');
      } finally {
        if (requestId === latestRequest.current) setLoading(false);
      }
    },
    []
  );

  return { clinics, loading, error, offline: false, cacheTimestamp: null, live, fetch };
}

// ─── Tekrarları birleştirme ─────────────────────────────────────────────────

const GENERIC = /\b(veteriner|veterinary|veterinerlik|vet|klinigi|klinik|poliklinigi|poliklinik|muayenehanesi|muayenehane|vm|vp|hh|hayvan|hayvanlar|hastanesi|hastane|saglik|merkezi|pet|ve|dr|hekim|hekimi)\b/g;

function nameKey(name: string): string {
  return trFold(name).replace(/[^a-z0-9 ]/g, ' ').replace(GENERIC, ' ').replace(/\s+/g, ' ').trim();
}

// Oda listesindeki konum adresten bulunduğu için gerçek yerden 1-2 km sapabilir
const APPROX_MATCH_KM = 2.5;

export function sameClinic(a: Clinic, b: Clinic): boolean {
  const d = haversine(a.lat, a.lng, b.lat, b.lng);
  // Oda listesi kendi içinde tekrarsız; yakın iki kayıt ayrı kliniklerdir
  if (a.source === 'chamber' && b.source === 'chamber') return false;
  const approx = a.location_approx || b.location_approx;
  if (d < 0.04 && !approx) return true; // aynı bina
  if (d > (approx ? APPROX_MATCH_KM : 0.3)) return false;
  const ka = nameKey(a.name);
  const kb = nameKey(b.name);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  // Yaklaşık konumda yalnızca adın ayırt edici kısmı birebir aynıysa aynı klinik say
  return d <= 0.3 && (ka.startsWith(kb) || kb.startsWith(ka));
}

// Düşük sayı = tercih edilir: onaylı > Google > OpenStreetMap > Apple > oda listesi > topluluk.
// Apple'da saat yok; aynı klinik OSM'de de varsa saatli kayıt kalır, telefon Apple'dan tamamlanır.
// Oda listesinin konumu yaklaşık; aynı klinik başka kaynakta varsa o konum kullanılır.
const SOURCE_RANK: Record<string, number> = { google: 0, builtin: 1, apple: 2, chamber: 3 };
function rank(c: Clinic): number {
  const src = SOURCE_RANK[c.source ?? ''] ?? 4;
  return (c.is_verified ? 0 : 10) + src;
}

function mergeInto(best: Clinic, other: Clinic): Clinic {
  const out: Clinic = { ...best };
  let used = false;
  if (out.location_approx && !other.location_approx) {
    out.lat = other.lat;
    out.lng = other.lng;
    out.location_approx = undefined;
    used = true;
  }
  if (!out.address && other.address) {
    out.address = other.address;
    out.district = out.district ?? other.district;
    used = true;
  }
  if (!out.phone && other.phone) {
    out.phone = other.phone;
    used = true;
  }
  if (!out.opening_periods?.length && other.opening_periods?.length) {
    out.opening_periods = other.opening_periods;
    out.weekday_text = other.weekday_text;
    out.is_24_7 = out.is_24_7 || other.is_24_7;
    used = true;
  }
  if (other.source === 'google' && out.source !== 'google' && !out.google_place_id) {
    out.google_place_id = other.id.replace(/^gp-/, '');
    if (out.rating == null && other.rating != null) {
      out.rating = other.rating;
      out.rating_count = other.rating_count;
      used = true;
    }
  }
  out.accepts_emergency = out.accepts_emergency || other.accepts_emergency;
  if (used && other.source && other.source !== out.source) {
    out.merged_sources = [...new Set([...(out.merged_sources ?? []), other.source])];
  }
  return used ? withLiveStatus(out) : out;
}

export function deduplicateClinics(clinics: Clinic[]): Clinic[] {
  const result: Clinic[] = [];
  const seen = new Set<string>();
  for (const c of clinics) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    const i = result.findIndex((r) => sameClinic(r, c));
    if (i === -1) {
      result.push(c);
    } else if (rank(c) < rank(result[i])) {
      result[i] = mergeInto(c, result[i]);
    } else {
      result[i] = mergeInto(result[i], c);
    }
  }
  return result;
}
