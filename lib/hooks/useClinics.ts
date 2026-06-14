import { useState, useCallback } from 'react';
import { cacheClinics } from '@/lib/cache';
import { queryNearbyClinics, rankCommunityClinics } from '@/lib/data/query';
import { fetchCommunityClinics } from '@/lib/data/community';
import { fetchPlacesClinics, isPlacesConfigured } from '@/lib/data/places';
import { registerClinics } from '@/lib/data/registry';
import type { Clinic, NearbyFilters } from '@/types';

interface UseClinicsResult {
  clinics: Clinic[];
  loading: boolean;
  error: string | null;
  offline: boolean;
  cacheTimestamp: string | null;
  fetch: (lat: number, lng: number, filters?: NearbyFilters) => Promise<void>;
}

export function useClinics(): UseClinicsResult {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (
      lat: number,
      lng: number,
      filters: NearbyFilters = { only_24_7: false, only_emergency: false, only_verified: false }
    ) => {
      setLoading(true);
      setError(null);
      try {
        // 1) Gömülü klinikler — anında, offline (her zaman çalışır)
        const local = queryNearbyClinics(lat, lng, filters, 20);
        setClinics(local);
        registerClinics(local);
        cacheClinics(local).catch(() => {});

        // 2) Google Places API (yapılandırılmışsa) + Topluluk klinikleri — paralel
        const [places, community] = await Promise.allSettled([
          isPlacesConfigured ? fetchPlacesClinics(lat, lng) : Promise.resolve([]),
          fetchCommunityClinics(),
        ]);

        const placesData = places.status === 'fulfilled' ? places.value : [];
        const communityData = community.status === 'fulfilled' ? community.value : [];

        if (placesData.length > 0 || communityData.length > 0) {
          // Topluluk kliniklerini sırala
          const rankedCommunity = communityData.length > 0
            ? rankCommunityClinics(communityData, lat, lng, filters, 20)
            : [];

          // Places kliniklerini filtrele
          const filteredPlaces = applyFilters(placesData, lat, lng, filters);

          // Öncelik sırası: gömülü (doğrulanmış) > places > topluluk
          // Tekrarı önle: gömülü veridekiler Places'ta da çıkabilir, yakınlığa göre de-dup
          const merged = deduplicateClinics([...local, ...filteredPlaces, ...rankedCommunity]);

          registerClinics(merged);
          setClinics(merged);
        }
      } catch {
        setError('Klinikler yüklenemedi. Tekrar dene.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { clinics, loading, error, offline: false, cacheTimestamp: null, fetch };
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function applyFilters(clinics: Clinic[], lat: number, lng: number, filters: NearbyFilters): Clinic[] {
  return clinics
    .filter(c => {
      if (filters.only_24_7 && !c.is_24_7) return false;
      if (filters.only_emergency && !c.accepts_emergency) return false;
      if (filters.only_verified && !c.is_verified) return false;
      return true;
    })
    .map(c => ({
      ...c,
      emergency_score: calcEmergencyScore(c),
    }))
    .sort((a, b) => b.emergency_score - a.emergency_score);
}

function calcEmergencyScore(c: Clinic): number {
  let s = 0;
  if (c.is_open_now) s += 50;
  if (c.is_24_7) s += 30;
  if (c.accepts_emergency) s += 20;
  if (c.distance_km > 0) s -= c.distance_km * 2;
  return s;
}

// 200m içindeki aynı adlı klinikleri tek tut (gömülü'yü tercih et)
function deduplicateClinics(clinics: Clinic[]): Clinic[] {
  const seen = new Set<string>();
  const result: Clinic[] = [];

  for (const c of clinics) {
    // Aynı id varsa atla
    if (seen.has(c.id)) continue;
    seen.add(c.id);

    // Çok yakın konumda, benzer isimli klinik var mı?
    const isDuplicate = result.some(r => {
      const dist = haversinePure(c.lat, c.lng, r.lat, r.lng);
      const nameSim = c.name.toLowerCase().slice(0, 10) === r.name.toLowerCase().slice(0, 10);
      return dist < 0.2 && nameSim;
    });

    if (!isDuplicate) result.push(c);
  }

  return result;
}

function haversinePure(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
