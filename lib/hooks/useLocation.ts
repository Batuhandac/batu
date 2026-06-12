import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { track } from '@/lib/analytics';
import { useLocationStore } from '@/stores/location';

export function useLocation() {
  const { lat, lng, granted, setCoords, setGranted } = useLocationStore();
  const [loading, setLoading] = useState(false);

  const request = useCallback(async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      await track('location_denied');
      setGranted(false);
      setLoading(false);
      return false;
    }
    await track('location_granted');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords(loc.coords.latitude, loc.coords.longitude);
    setGranted(true);
    setLoading(false);
    return true;
  }, [setCoords, setGranted]);

  const setManual = useCallback((manualLat: number, manualLng: number) => {
    setCoords(manualLat, manualLng);
    setGranted(true);
  }, [setCoords, setGranted]);

  return { lat, lng, granted, loading, request, setManual };
}
