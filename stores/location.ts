import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { haversine } from '@/lib/utils/geo';

export type LocationSource = 'gps' | 'manual';

interface LocationStore {
  lat: number | null;
  lng: number | null;
  granted: boolean | null;
  source: LocationSource | null;
  label: string | null; // elle seçilen ilçe adı
  updatedAt: number | null;
  setCoords: (lat: number, lng: number, source?: LocationSource, label?: string | null) => void;
  setGranted: (v: boolean) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      lat: null,
      lng: null,
      granted: null,
      source: null,
      label: null,
      updatedAt: null,
      setCoords: (lat, lng, source = 'gps', label = null) => {
        const prev = get();
        // GPS titremesiyle her seferinde listeyi yeniden çekmemek için:
        // aynı kaynaktan 100 m'den az değişimde yalnızca zamanı güncelle
        const same =
          prev.lat != null &&
          prev.lng != null &&
          prev.source === source &&
          haversine(prev.lat, prev.lng, lat, lng) < 0.1;
        if (same) set({ updatedAt: Date.now(), label });
        else set({ lat, lng, source, label, updatedAt: Date.now() });
      },
      setGranted: (v) => set({ granted: v }),
    }),
    { name: 'patisos:location', storage: createJSONStorage(() => AsyncStorage) }
  )
);
