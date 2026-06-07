import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Clinic } from '@/types';

const CLINICS_KEY = 'patisos:clinics_cache';
const TIMESTAMP_KEY = 'patisos:clinics_cache_ts';

export async function cacheClinics(clinics: Clinic[]) {
  await AsyncStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
  await AsyncStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
}

export async function getCachedClinics(): Promise<{ clinics: Clinic[]; timestamp: string | null }> {
  const raw = await AsyncStorage.getItem(CLINICS_KEY);
  const timestamp = await AsyncStorage.getItem(TIMESTAMP_KEY);
  if (!raw) return { clinics: [], timestamp: null };
  return { clinics: JSON.parse(raw), timestamp };
}
