import { useEffect, useMemo, useState } from 'react';
import { isPlacesConfigured, searchPlacesByName } from '@/lib/data/places';
import { matchesClinicQuery, rankClinics, searchClinicsByName, searchScore, seedToClinic } from '@/lib/data/query';
import { registerClinics } from '@/lib/data/registry';
import { deduplicateClinics } from '@/lib/hooks/useClinics';
import type { Clinic, NearbyFilters } from '@/types';

const NO_FILTERS: NearbyFilters = { only_24_7: false, only_emergency: false, only_open: false };
const ANY_DISTANCE_KM = 2000; // aranan klinik başka şehirde de olabilir
const DEBOUNCE_MS = 450;

/**
 * Klinikler ekranında ada, semte ya da adrese göre arama. Ekrandaki listeden ve
 * gömülü veriden (tüm Türkiye, çevrimdışı) anında sonuç verir; ardından
 * Google'da da arar ve listede olmayan klinikleri ekler (ör. yakın 60'a
 * girmeyen bir mahalle kliniği).
 */
export function useClinicSearch(query: string, lat: number | null, lng: number | null, loaded: Clinic[]) {
  const q = query.trim();
  const active = q.length >= 2;
  const [remote, setRemote] = useState<Clinic[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setRemote([]);
    if (!active || lat == null || lng == null || !isPlacesConfigured) return;
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchPlacesByName(q, lat, lng)
        .then((r) => {
          if (!cancelled) setRemote(r);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setSearching(false);
    };
  }, [q, active, lat, lng]);

  const results = useMemo(() => {
    if (!active || lat == null || lng == null) return [];
    const local = loaded.filter((c) => matchesClinicQuery(c, q));
    const seeds = searchClinicsByName(q, 30).map((s) => seedToClinic(s, lat, lng));
    // Google kendi benzerliğine göre döndürür ("vet magic" → "VetMagic"); onları
    // elemeden ekliyoruz, adı sorguyla eşleşenler yine de önde durur.
    const extra = rankClinics([...remote, ...seeds], lat, lng, NO_FILTERS, ANY_DISTANCE_KM);
    const merged = deduplicateClinics([...local, ...extra]);
    return merged.sort((a, b) => searchScore(b, q) - searchScore(a, q) || a.distance_km - b.distance_km);
  }, [active, q, loaded, remote, lat, lng]);

  // Detay ekranı açılınca klinik bulunabilsin
  useEffect(() => {
    if (results.length) registerClinics(results);
  }, [results]);

  return { active, results, searching };
}
