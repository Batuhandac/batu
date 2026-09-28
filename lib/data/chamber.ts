// Veteriner hekimleri odası listelerinden gelen klinikler için yardımcılar.
import type { Clinic } from '@/types';
import { CHAMBER_LABELS } from './chamberClinics';

/** "vho-ank-…" → "Ankara Veteriner Hekimleri Odası" */
export function chamberLabel(id: string): string {
  const key = id.match(/^vho-([a-z]+)-/)?.[1];
  return (key && CHAMBER_LABELS[key]) || 'veteriner hekimleri odası';
}

/**
 * Konum adresten yaklaşık bulunduysa yol tarifi koordinatla değil adresle
 * açılır; harita uygulaması kapıyı kendisi bulur. Kesin konumda null.
 */
export function directionsAddress(c: Pick<Clinic, 'location_approx' | 'address' | 'district' | 'city'>): string | null {
  if (!c.location_approx || !c.address) return null;
  return [c.address, c.district, c.city].filter(Boolean).join(', ');
}
