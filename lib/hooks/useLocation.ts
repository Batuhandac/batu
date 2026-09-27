import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { track } from '@/lib/analytics';
import { useLocationStore } from '@/stores/location';

const GPS_TIMEOUT_MS = 8000;
// Bu süreden eski konum "bayat" sayılır; ekran açılınca yeniden alınır
export const LOCATION_MAX_AGE_MS = 2 * 60 * 1000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export function useLocation() {
  const { lat, lng, granted, source, label, updatedAt, setCoords, setGranted } = useLocationStore();
  const [loading, setLoading] = useState(false);

  // İzin zaten verildiyse konumu sessizce tazele (izin penceresi açmaz).
  // Önce son bilinen konum (anında), sonra gerçek konum (en fazla 8 sn).
  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return false;
      setGranted(true);
      setLoading(true);
      const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 }).catch(() => null);
      if (last) setCoords(last.coords.latitude, last.coords.longitude, 'gps');
      const cur = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        GPS_TIMEOUT_MS
      ).catch(() => null);
      if (cur) setCoords(cur.coords.latitude, cur.coords.longitude, 'gps');
      return !!(cur || last);
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [setCoords, setGranted]);

  const request = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        await track('location_denied');
        setGranted(false);
        return false;
      }
      await track('location_granted');
      setGranted(true);
    } finally {
      setLoading(false);
    }
    return refresh();
  }, [refresh, setGranted]);

  const setManual = useCallback((manualLat: number, manualLng: number, name?: string) => {
    setCoords(manualLat, manualLng, 'manual', name ?? null);
  }, [setCoords]);

  const isStale = !updatedAt || Date.now() - updatedAt > LOCATION_MAX_AGE_MS;

  return { lat, lng, granted, source, label, updatedAt, isStale, loading, request, refresh, setManual };
}
