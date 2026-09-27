import { useState, useCallback, useRef } from 'react';
import { cacheClinics } from '@/lib/cache';
import { queryNearbyClinics, rankClinics } from '@/lib/data/query';
import { fetchCommunityClinics } from '@/lib/data/community';
import { fetchPlacesClinics, PLACES_RADIUS_KM } from '@/lib/data/places';
import { registerClinics } from '@/lib/data/registry';
import { haversine } from '@/lib/utils/geo';
import type { Clinic, NearbyFilters } from '@/types';

interface UseClinicsResult {
  clinics: Clinic[];
  loading: boolean;
  error: string | null;
  offline: boolean;
  cacheTimestamp: string | null;
  // Liste Google'dan gelen canlı veriyle mi gösteriliyor (atıf için)
  live: boolean;
  fetch: (lat: number, lng: number, filters?: NearbyFilters) => Promise<void>;
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
        // 1) Gömülü klinikler — anında, offline (her zaman çalışır)
        const local = queryNearbyClinics(lat, lng, filters, 20);
        setClinics(local);
        setLive(false);
        registerClinics(local);
        cacheClinics(local).catch(() => {});

        // 2) Google Places (yapılandırılmışsa) + Topluluk klinikleri — paralel
        const [places, community] = await Promise.allSettled([
          fetchPlacesClinics(lat, lng),
          fetchCommunityClinics(),
        ]);
        // Bu sırada filtre/konum değiştiyse eski sonucu yazma
        if (requestId !== latestRequest.current) return;

        const hasLive = places.status === 'fulfilled' && places.value.length > 0;
        const communityData =
          community.status === 'fulfilled' ? rankClinics(community.value, lat, lng, filters, 20) : [];

        if (hasLive || communityData.length > 0) {
          // Canlı Google verisi geldiyse gömülü listenin yerine geçer; gömülü liste
          // yalnızca anahtar yokken / çevrimdışıyken yedek olarak kalır.
          const base = hasLive ? rankClinics(places.value, lat, lng, filters, PLACES_RADIUS_KM) : local;
          const merged = deduplicateClinics([...base, ...communityData]).sort(
            (a, b) => b.emergency_score - a.emergency_score
          );
          registerClinics(merged);
          setClinics(merged);
          setLive(hasLive);
        }
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

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

// 200m içindeki aynı adlı klinikleri tek tut (listede önce geleni tercih et)
function deduplicateClinics(clinics: Clinic[]): Clinic[] {
  const seen = new Set<string>();
  const result: Clinic[] = [];

  for (const c of clinics) {
    // Aynı id varsa atla
    if (seen.has(c.id)) continue;
    seen.add(c.id);

    // Çok yakın konumda, benzer isimli klinik var mı?
    const isDuplicate = result.some(r => {
      const dist = haversine(c.lat, c.lng, r.lat, r.lng);
      const nameSim = c.name.toLowerCase().slice(0, 10) === r.name.toLowerCase().slice(0, 10);
      return dist < 0.2 && nameSim;
    });

    if (!isDuplicate) result.push(c);
  }

  return result;
}
