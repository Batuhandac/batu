import { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { cacheClinics, getCachedClinics } from '@/lib/cache';
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
  const [offline, setOffline] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);

  const fetch = useCallback(async (lat: number, lng: number, filters: NearbyFilters = { only_24_7: false, only_emergency: false, only_verified: false }) => {
    setLoading(true);
    setError(null);

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const cached = await getCachedClinics();
      setClinics(cached.clinics);
      setCacheTimestamp(cached.timestamp);
      setOffline(true);
      setLoading(false);
      return;
    }

    setOffline(false);
    const { data, error: rpcError } = await supabase.rpc('nearby_clinics', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: 15,
      p_only_24_7: filters.only_24_7,
      p_only_emergency: filters.only_emergency,
      p_only_verified: filters.only_verified,
    });

    if (rpcError) {
      setError('Klinikler yüklenemedi. Tekrar dene.');
      const cached = await getCachedClinics();
      if (cached.clinics.length > 0) {
        setClinics(cached.clinics);
        setCacheTimestamp(cached.timestamp);
      }
    } else {
      const result = (data ?? []) as Clinic[];
      setClinics(result);
      cacheClinics(result);
    }
    setLoading(false);
  }, []);

  return { clinics, loading, error, offline, cacheTimestamp, fetch };
}
