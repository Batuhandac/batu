// Yerel (offline) klinik veri tipi. last_verified_at burada "kaç gün önce
// doğrulandı" olarak saklanır (null = hiç doğrulanmadı); açık-mı ve skor
// hesabı çalışma anında lib/data/query.ts içinde yapılır.
export interface SeedClinic {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  is_24_7: boolean;
  accepts_emergency: boolean;
  has_night_shift: boolean;
  is_verified: boolean;
  verification_status: string;
  verified_days_ago: number | null;
  rating: number | null;
}
