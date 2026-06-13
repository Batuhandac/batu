export type ClinicStatus = 'open' | 'closed' | 'unknown';
export type VerificationStatus = 'seed' | 'verified' | 'claimed' | 'flagged';

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  is_24_7: boolean;
  accepts_emergency: boolean;
  is_verified: boolean;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  rating: number | null;
  phone_active: boolean;
  distance_km: number;
  is_open_now: boolean;
  status: ClinicStatus;
  emergency_score: number;
  source?: 'builtin' | 'community';
  rating_count?: number;
}

// Bir günün çalışma penceresi (0=Pazar … 6=Cumartesi)
export interface DayHours {
  weekday: number;
  closed: boolean;
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
}

// Kullanıcının eklediği klinik (Firestore'a yazılır)
export interface CommunityClinicInput {
  name: string;
  address: string | null;
  district: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  is_24_7: boolean;
  accepts_emergency: boolean;
  hours: DayHours[];
}

// Klinik yorumu / puanı
export interface Review {
  id: string;
  clinic_id: string;
  author_id: string;
  author_name: string;
  rating: number;       // 1–5
  comment: string;
  created_at: string;    // ISO
}

export interface ClinicHours {
  id: string;
  clinic_id: string;
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  is_overnight: boolean;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age_years: number | null;
  weight_kg: number | null;
  allergies: string | null;
  chronic_conditions: string | null;
  medications: string | null;
  last_vaccine_date: string | null;
  last_parasite_date: string | null;
  emergency_note: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  clinic_id: string;
  is_primary_vet: boolean;
  created_at: string;
}

export interface NearbyFilters {
  only_24_7: boolean;
  only_emergency: boolean;
  only_verified: boolean;
}

export type District = {
  name: string;
  lat: number;
  lng: number;
};
