import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface OnboardingStore {
  completed: boolean;
  hydrated: boolean; // AsyncStorage okundu mu? (yönlendirme yarışını önler)
  disclaimerAccepted: boolean;
  setCompleted: (v: boolean) => void;
  setDisclaimerAccepted: (v: boolean) => void;
  load: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  completed: false,
  hydrated: false,
  disclaimerAccepted: false,
  setCompleted: async (v) => {
    set({ completed: v });
    await AsyncStorage.setItem('patisos:onboarding_done', v ? '1' : '0');
  },
  setDisclaimerAccepted: (v) => set({ disclaimerAccepted: v }),
  load: async () => {
    try {
      const val = await AsyncStorage.getItem('patisos:onboarding_done');
      set({ completed: val === '1', hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
