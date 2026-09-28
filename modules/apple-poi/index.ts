// Apple Haritalar yerel araması (yalnızca iOS). Web ve Android'de modül yoktur;
// o zaman boş liste döner.
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

export interface ApplePoi {
  name: string;
  latitude: number;
  longitude: number;
  phone?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  locality?: string;
  subAdministrativeArea?: string;
  city?: string;
  url?: string;
  category?: string;
}

interface ApplePoiNative {
  search(query: string, latitude: number, longitude: number, radiusMeters: number): Promise<ApplePoi[]>;
}

const Native = Platform.OS === 'ios' ? requireOptionalNativeModule<ApplePoiNative>('ApplePoi') : null;

export const isApplePoiAvailable = Native != null;

export async function searchApplePoi(query: string, latitude: number, longitude: number, radiusMeters: number): Promise<ApplePoi[]> {
  if (!Native) return [];
  try {
    return await Native.search(query, latitude, longitude, radiusMeters);
  } catch {
    return [];
  }
}
