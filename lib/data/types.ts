// Gömülü (çevrimdışı) klinik kaydı. İki üretici var:
// - scripts/gen-clinics-osm.js: OpenStreetMap (lib/data/clinics.ts)
// - scripts/gen-clinics-chamber.js: veteriner hekimleri odası listeleri
//   (lib/data/chamberClinics.ts), konumu adresten bulunmuş
// Çalışma saatleri OSM opening_hours metni olarak saklanır, açık/kapalı durumu
// çalışma anında cihazda hesaplanır.
export interface SeedClinic {
  id: string; // "osm-n123" (node), "osm-w456" (way), "osm-r789" (relation), "vho-ank-…" (oda)
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  opening_hours: string | null;
  emergency: boolean; // OSM emergency=yes ya da adında acil/7/24/nöbetçi
  source?: 'chamber'; // yoksa OpenStreetMap
  // Konum kapı numarasıyla değil caddeyle ('street') ya da mahalleyle ('area') bulundu
  approx?: 'street' | 'area';
}
