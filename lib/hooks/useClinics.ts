import { useState, useCallback } from 'react';
import { cacheClinics } from '@/lib/cache';
import { queryNearbyClinics, rankCommunityClinics } from '@/lib/data/query';
import { fetchCommunityClinics } from '@/lib/data/community';
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

// Klinik verisi artık uygulamanın içine gömülü (lib/data/clinics.ts) —
// backend/internet gerektirmez, acil durumda offline da çalışır.
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
        // 1) Gömülü klinikler — anında, offline
        const local = queryNearbyClinics(lat, lng, filters, 15);
        setClinics(local);
        registerClinics(local);
        cacheClinics(local).catch(() => {});

        // 2) Topluluk klinikleri (Firebase varsa) — gelince birleştir
        try {
          const community = await fetchCommunityClinics();
          if (community.length > 0) {
            const ranked = rankCommunityClinics(community, lat, lng, filters, 15);
            const merged = [...local, ...ranked].sort(
              (a, b) => b.emergency_score - a.emergency_score
            );
            registerClinics(merged);
            setClinics(merged);
          }
        } catch {
          // topluluk verisi opsiyonel — yereli koru
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
