import { useState, useCallback } from 'react';
import { cacheClinics } from '@/lib/cache';
import { queryNearbyClinics } from '@/lib/data/query';
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
        const result = queryNearbyClinics(lat, lng, filters, 15);
        setClinics(result);
        // En son sonucu önbelleğe yaz (gelecekte hibrit kaynak için)
        cacheClinics(result).catch(() => {});
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
