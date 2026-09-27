// Gömülü (çevrimdışı) klinik kaydı — scripts/gen-clinics-osm.js üretir.
// Kaynak OpenStreetMap; çalışma saatleri OSM opening_hours metni olarak
// saklanır, açık/kapalı durumu çalışma anında cihazda hesaplanır.
export interface SeedClinic {
  id: string; // "osm-n123" (node), "osm-w456" (way), "osm-r789" (relation)
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  opening_hours: string | null;
  emergency: boolean; // OSM emergency=yes ya da adında acil/7/24/nöbetçi
}
