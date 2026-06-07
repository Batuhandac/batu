import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { track } from '@/lib/analytics';

interface LocationState {
  lat: number | null;
  lng: number | null;
  granted: boolean | null;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null, lng: null, granted: null, loading: false,
  });

  const request = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      await track('location_denied');
      setState({ lat: null, lng: null, granted: false, loading: false });
      return false;
    }
    await track('location_granted');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setState({ lat: loc.coords.latitude, lng: loc.coords.longitude, granted: true, loading: false });
    return true;
  }, []);

  const setManual = useCallback((lat: number, lng: number) => {
    setState({ lat, lng, granted: true, loading: false });
  }, []);

  return { ...state, request, setManual };
}
