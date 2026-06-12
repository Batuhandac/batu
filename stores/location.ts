import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LocationStore {
  lat: number | null;
  lng: number | null;
  granted: boolean | null;
  setCoords: (lat: number, lng: number) => void;
  setGranted: (v: boolean) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      lat: null,
      lng: null,
      granted: null,
      setCoords: (lat, lng) => set({ lat, lng }),
      setGranted: (v) => set({ granted: v }),
    }),
    { name: 'patisos:location', storage: createJSONStorage(() => AsyncStorage) }
  )
);
