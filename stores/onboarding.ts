import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface OnboardingStore {
  completed: boolean;
  disclaimerAccepted: boolean;
  setCompleted: (v: boolean) => void;
  setDisclaimerAccepted: (v: boolean) => void;
  load: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  completed: false,
  disclaimerAccepted: false,
  setCompleted: async (v) => {
    set({ completed: v });
    await AsyncStorage.setItem('patisos:onboarding_done', v ? '1' : '0');
  },
  setDisclaimerAccepted: (v) => set({ disclaimerAccepted: v }),
  load: async () => {
    const val = await AsyncStorage.getItem('patisos:onboarding_done');
    set({ completed: val === '1' });
  },
}));
