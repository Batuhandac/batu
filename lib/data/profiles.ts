// Klinik onaylı profiller — Firestore: clinic_profiles/{clinicId}
//
// Veteriner hekimler Türkiye'de reklam veremiyor; Pati SOS onlara reklam değil,
// DOĞRU BİLGİ ile görünürlük sunar: "Bu klinik benim" başvurusu telefonla
// doğrulanınca yönetici bu belgeyi oluşturur (uygulama yazamaz, sadece okur).
// Uygulama bu bilgileri Google/OpenStreetMap verisinin üzerine uygular ve
// kliniği "Klinik onaylı" gösterir. Sıralama satın alınamaz.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { parseOsmHours } from '@/lib/utils/osmHours';
import { isAlwaysOpen, weekdayText, withLiveStatus } from '@/lib/utils/openingHours';
import type { Clinic, OpeningPeriod } from '@/types';

export interface ClinicProfile {
  phone?: string | null;
  emergency_phone?: string | null; // mesai dışı / nöbet hattı
  opening_hours?: string | null; // OSM sözdizimi: "Mo-Sa 09:00-20:00; Su off"
  is_24_7?: boolean;
  accepts_emergency?: boolean;
  services?: string[];
  note?: string | null; // "Egzotik hayvan kabul etmiyoruz" gibi kısa not
  verified_at?: string | null;
}

export type ProfileMap = Record<string, ClinicProfile>;

const STORE_KEY = 'patisos:clinic_profiles:v1';
const REFRESH_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 6000;

let mem: ProfileMap | null = null;
let fetchedAt = 0;
let inflight: Promise<ProfileMap> | null = null;

/** Bellekteki son kopya (anında; ilk açılışta boş olabilir). */
export function cachedProfiles(): ProfileMap {
  return mem ?? {};
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);

function parseDoc(x: any): ClinicProfile {
  const verified = x?.verified_at?.toDate?.()?.toISOString?.() ?? str(x?.verified_at);
  return {
    phone: str(x?.phone),
    emergency_phone: str(x?.emergency_phone),
    opening_hours: str(x?.opening_hours),
    is_24_7: bool(x?.is_24_7),
    accepts_emergency: bool(x?.accepts_emergency),
    services: Array.isArray(x?.services) ? x.services.filter((s: unknown) => typeof s === 'string') : [],
    note: str(x?.note),
    verified_at: verified,
  };
}

/** Profilleri getirir: önce cihaz kopyası, sonra (10 dk'da bir) Firestore. */
export function loadClinicProfiles(): Promise<ProfileMap> {
  if (inflight) return inflight;
  inflight = (async () => {
    if (!mem) {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) mem = JSON.parse(raw) as ProfileMap;
      } catch {}
    }
    const db = getDb();
    if (!db || Date.now() - fetchedAt < REFRESH_MS) return mem ?? {};
    try {
      const snap = await Promise.race([
        getDocs(collection(db, 'clinic_profiles')),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
      ]);
      const next: ProfileMap = {};
      snap.forEach((d) => {
        next[d.id] = parseDoc(d.data());
      });
      mem = next;
      fetchedAt = Date.now();
      AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => {});
    } catch {
      // çevrimdışı / kural yok — cihaz kopyasıyla devam
    }
    return mem ?? {};
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Onaylı profili kliniğin üzerine uygular (yoksa kliniği aynen döner). */
export function applyProfile(c: Clinic, p: ClinicProfile | undefined): Clinic {
  if (!p) return c;
  const parsed = parseOsmHours(p.opening_hours);
  const periods: OpeningPeriod[] | undefined = p.is_24_7
    ? [{ open: { day: 0, hour: 0, minute: 0 } }]
    : parsed ?? c.opening_periods;
  const out: Clinic = {
    ...c,
    phone: p.phone ?? c.phone,
    emergency_phone: p.emergency_phone ?? null,
    accepts_emergency: p.accepts_emergency ?? c.accepts_emergency,
    is_24_7: p.is_24_7 ?? (periods ? isAlwaysOpen(periods) : c.is_24_7),
    opening_periods: periods,
    weekday_text: parsed || p.is_24_7 ? weekdayText(periods!) : c.weekday_text,
    services: p.services?.length ? p.services : c.services,
    note: p.note ?? c.note ?? null,
    is_verified: true,
    verification_status: 'verified',
    last_verified_at: p.verified_at ?? null,
  };
  return withLiveStatus(out);
}
