// Google dışı bir kaynaktan (oda listesi, OpenStreetMap, Apple) gelen kliniğin
// Google'daki eşini bulur; Google yorumlarını göstermek için place ID gerekir.
import { googlePlaceIdOf, searchPlacesByName } from '@/lib/data/places';
import { sameClinic } from '@/lib/hooks/useClinics';
import type { Clinic } from '@/types';

/**
 * Bilinen place ID'yi döner; yoksa Google'da adıyla arar ve yalnızca aynı klinik
 * olduğu kesinse (ad + yakınlık, bkz. sameClinic) eşleştirir. Bulamazsa null.
 */
export async function findGooglePlaceId(clinic: Clinic): Promise<string | null> {
  const known = googlePlaceIdOf(clinic);
  if (known) return known;
  const hits = await searchPlacesByName(clinic.name, clinic.lat, clinic.lng);
  const match = hits.find((g) => sameClinic(g, clinic));
  return match ? googlePlaceIdOf(match) : null;
}
