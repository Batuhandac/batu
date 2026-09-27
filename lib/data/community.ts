// Topluluk verisi (Firestore): kullanıcı klinikleri + yorumlar/puanlar.
// Firebase yapılandırılmamışsa tüm fonksiyonlar güvenli biçimde boş döner
// — uygulama yerel veriyle çalışmaya devam eder.
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance, isFirebaseConfigured } from '@/lib/firebase';
import { getDeviceId, getAuthorName } from '@/lib/deviceId';
import { istanbulNow } from '@/lib/utils/openingHours';
import type {
  Clinic,
  CommunityClinicInput,
  Review,
  DayHours,
  ClinicStatus,
} from '@/types';

export { isFirebaseConfigured };

// ─── Güvenli yazma ───────────────────────────────────────────────────────────
// Firestore çevrimdışıyken addDoc yerelde kuyruğa alıp sonsuza dek bekleyebilir;
// kullanıcıya "gönderildi" diyebilmek için sunucu onayını en fazla 10 sn bekle.
const WRITE_TIMEOUT_MS = 10000;

async function addSafe(col: string, data: Record<string, unknown>): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const deviceId = await getDeviceId();
    await Promise.race([
      addDoc(collection(db, col), { ...data, device_id: deviceId, created_at: serverTimestamp() }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), WRITE_TIMEOUT_MS)),
    ]);
    return true;
  } catch {
    return false;
  }
}

// ─── Klinik gönderimi ────────────────────────────────────────────────────────
// Kullanıcı eklediği klinik, yönetici onaylayana kadar ('pending') görünmez:
// acil anında panikteki birine sahte bir telefon numarası gösterilmesin.
export async function submitCommunityClinic(input: CommunityClinicInput): Promise<boolean> {
  return addSafe('community_clinics', { ...input, status: 'pending' });
}

// ─── Hatalı bilgi bildirimi / açık-kapalı teyidi / arama geri bildirimi ──────
export async function submitClinicReport(input: {
  clinic_id: string;
  clinic_name: string | null;
  report_type: string;
  detail: string | null;
}): Promise<boolean> {
  return addSafe('clinic_reports', input);
}

export async function submitOpenPing(clinicId: string, isOpen: boolean): Promise<boolean> {
  return addSafe('clinic_pings', { clinic_id: clinicId, is_open_now: isOpen });
}

export async function submitCallFeedback(input: {
  clinic_id: string;
  phone_answered: boolean;
  accepted_emergency: boolean | null;
}): Promise<boolean> {
  return addSafe('clinic_feedback', input);
}

// ─── Veteriner hekim başvurusu ("Bu klinik benim") ───────────────────────────
export interface ClinicClaimInput {
  clinic_id: string | null; // listede yoksa null
  clinic_name: string;
  claimant_name: string;
  claimant_role: 'vet' | 'owner' | 'staff';
  claimant_phone: string;
  claimant_email: string | null;
  clinic_phone: string | null;
  emergency_phone: string | null;
  hours_text: string | null;
  is_24_7: boolean;
  accepts_emergency: boolean;
  services: string[];
  note: string | null;
  consent: true;
}

export async function submitClinicClaim(input: ClinicClaimInput): Promise<boolean> {
  return addSafe('clinic_claims', { ...input, status: 'pending' });
}

// ─── Topluluk kliniklerini çek ───────────────────────────────────────────────
function isOpenFromHours(hours: DayHours[] | undefined, is247: boolean): boolean {
  if (is247) return true;
  if (!hours || hours.length === 0) return false;
  const { dow, minutes: mins } = istanbulNow();
  const today = hours.find((h) => h.weekday === dow);
  if (!today || today.closed) return false;
  const [oh, om] = today.open.split(':').map(Number);
  const [ch, cm] = today.close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

export async function fetchCommunityClinics(): Promise<Clinic[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'community_clinics'), where('status', '==', 'approved'))
    );
    return snap.docs.map((d) => {
      const data = d.data() as any;
      const open = isOpenFromHours(data.hours, data.is_24_7);
      const hasHours = Array.isArray(data.hours) && data.hours.length > 0;
      const status: ClinicStatus =
        data.is_24_7 || open ? 'open' : hasHours ? 'closed' : 'unknown';
      return {
        id: 'comm-' + d.id,
        name: data.name,
        address: data.address ?? null,
        district: data.district ?? null,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone ?? null,
        is_24_7: !!data.is_24_7,
        accepts_emergency: !!data.accepts_emergency,
        is_verified: false,
        verification_status: 'claimed',
        last_verified_at: null,
        rating: data.rating ?? null,
        phone_active: true,
        distance_km: 0,
        is_open_now: open,
        status,
        emergency_score: 0,
        source: 'community' as const,
      } as Clinic;
    });
  } catch {
    return [];
  }
}

// ─── Yorumlar ────────────────────────────────────────────────────────────────
export async function addReview(
  clinicId: string,
  rating: number,
  comment: string
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const deviceId = await getDeviceId();
    const authorName = await getAuthorName();
    await addDoc(collection(db, 'reviews'), {
      clinic_id: clinicId,
      author_id: deviceId,
      author_name: authorName,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment: comment.trim(),
      created_at: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchReviews(clinicId: string): Promise<Review[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'reviews'),
        where('clinic_id', '==', clinicId),
        orderBy('created_at', 'desc'),
        fbLimit(50)
      )
    );
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        clinic_id: data.clinic_id,
        author_id: data.author_id,
        author_name: data.author_name ?? 'Pati dostu',
        rating: data.rating ?? 0,
        comment: data.comment ?? '',
        created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      } as Review;
    });
  } catch {
    return [];
  }
}

// ─── Fotoğraflar ─────────────────────────────────────────────────────────────
// Tek koleksiyon: clinic_photos (clinic_id ile hem gömülü hem topluluk klinikleri).
export async function fetchClinicPhotos(clinicId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'clinic_photos'),
        where('clinic_id', '==', clinicId),
        orderBy('created_at', 'desc'),
        fbLimit(12)
      )
    );
    return snap.docs.map((d) => (d.data() as any).url).filter(Boolean);
  } catch {
    return [];
  }
}

export async function addClinicPhoto(clinicId: string, localUri: string): Promise<string | null> {
  const db = getDb();
  const storage = getStorageInstance();
  if (!db || !storage) return null;
  try {
    const deviceId = await getDeviceId();
    // Yerel dosyayı blob'a çevir
    const res = await window.fetch(localUri);
    const blob = await res.blob();
    const path = `clinic_photos/${clinicId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const storageRef = ref(storage, path);
    // Tür boş gelirse Storage kuralı (image/*) yüklemeyi reddeder
    const contentType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    await uploadBytes(storageRef, blob, { contentType });
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, 'clinic_photos'), {
      clinic_id: clinicId,
      url,
      uploaded_by: deviceId,
      created_at: serverTimestamp(),
    });
    return url;
  } catch {
    return null;
  }
}

export interface RatingSummary {
  average: number;
  count: number;
}

export function summarizeReviews(reviews: Review[]): RatingSummary {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}
