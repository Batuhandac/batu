// Panelden POS'a tahsilat. Bir satış clinic_pos/{clinicId}/sales/{id} belgesidir:
// panel "pending" olarak yazar, POS tarafı sonucu (onay/ret) aynı belgeye yazar,
// panel belgeyi canlı dinler.
//
// İki mod:
//  - "test": POS, panelin /panel/pos sayfasında (başka bir sekmede ya da telefonda)
//    açılan sanal bir terminaldir; sonucu o terminal yazar.
//  - "iyzico_test": ödeme sunucusu (server/odeme) iyzico'nun deneme ortamında gerçek
//    bir ödeme sayfası açar; hasta sahibi telefonundan kartla öder, sonucu sunucu
//    iyzico'dan doğrulayıp yazar. Para deneme ortamında sahtedir.
// İkisinde de banka çekimi ve e-SMM yoktur. Gerçek cihaz ya da canlı iyzico
// hesabı eklenince aynı belge yapısı kullanılır; anahtarlar yalnızca sunucuda durur
// (docs/HEKIM_YOL_HARITASI.md, aşama 5).
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getAuthInstance, type VetProfile } from '@/lib/auth';

export type SaleStatus = 'pending' | 'approved' | 'declined' | 'cancelled';
export type SaleMode = 'test' | 'iyzico_test';

export interface Sale {
  id: string;
  amount_kurus: number;
  description: string;
  patient_id: string | null;
  patient_name: string | null;
  status: SaleStatus;
  mode: SaleMode;
  created_by: string;
  created_ms: number | null;
  resolved_ms: number | null;
  card_last4: string | null;
  auth_code: string | null;
  /** iyzico: ödeme sayfası (sunucu yazar) ve sonuç ayrıntıları */
  pay_url: string | null;
  pay_expires_ms: number | null;
  payment_id: string | null;
  card_brand: string | null;
  fail_reason: string | null;
}

/** Ödeme sunucusunun adresi (web derlemesinde verilir); yoksa iyzico seçeneği gizlenir. */
export const PAY_API_URL = (process.env.EXPO_PUBLIC_PAY_API_URL ?? '').replace(/\/+$/, '');
export const onlinePayEnabled = PAY_API_URL.length > 0;

export const MAX_SALE_KURUS = 100_000_000; // 1.000.000 TL

function salesCol(clinicId: string) {
  const db = getDb();
  if (!db) throw new Error('offline');
  return collection(db, 'clinic_pos', clinicId, 'sales');
}

const ms = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : null);

function toSale(id: string, d: Record<string, unknown>): Sale {
  return {
    id,
    amount_kurus: Number(d.amount_kurus) || 0,
    description: String(d.description ?? ''),
    patient_id: (d.patient_id as string) ?? null,
    patient_name: (d.patient_name as string) ?? null,
    status: (d.status as SaleStatus) ?? 'pending',
    mode: d.mode === 'iyzico_test' ? 'iyzico_test' : 'test',
    created_by: String(d.created_by ?? ''),
    created_ms: ms(d.created_at),
    resolved_ms: ms(d.resolved_at),
    card_last4: (d.card_last4 as string) ?? null,
    auth_code: (d.auth_code as string) ?? null,
    pay_url: typeof d.pay_url === 'string' ? d.pay_url : null,
    pay_expires_ms: typeof d.pay_expires_ms === 'number' ? d.pay_expires_ms : null,
    payment_id: typeof d.payment_id === 'string' ? d.payment_id : null,
    card_brand: typeof d.card_brand === 'string' ? d.card_brand : null,
    fail_reason: typeof d.fail_reason === 'string' ? d.fail_reason : null,
  };
}

export interface SaleInput {
  amount_kurus: number;
  description: string;
  patient_id: string | null;
  patient_name: string | null;
}

/** Bekleyen satış yazar (test POS'u ya da iyzico için); satış kimliğini döner. */
export async function createSale(vet: VetProfile, input: SaleInput, mode: SaleMode = 'test'): Promise<string> {
  if (!Number.isSafeInteger(input.amount_kurus) || input.amount_kurus < 100 || input.amount_kurus > MAX_SALE_KURUS) {
    throw new Error('amount');
  }
  const ref = doc(salesCol(vet.clinic_id));
  await setDoc(ref, {
    amount_kurus: input.amount_kurus,
    description: input.description.trim().slice(0, 120) || 'Muayene',
    patient_id: input.patient_id,
    patient_name: input.patient_name ? input.patient_name.slice(0, 60) : null,
    status: 'pending',
    mode,
    created_by: vet.uid,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

/** Tek satışı canlı izler (panelde "POS'ta bekleniyor" → sonuç). */
export function watchSale(clinicId: string, id: string, cb: (s: Sale | null) => void): () => void {
  return onSnapshot(
    doc(salesCol(clinicId), id),
    (snap) => cb(snap.exists() ? toSale(snap.id, snap.data()) : null),
    () => cb(null)
  );
}

/** Test POS ekranı: bekleyen test satışlarını canlı izler (eskiden yeniye). */
export function watchPendingSales(clinicId: string, cb: (s: Sale[]) => void): () => void {
  return onSnapshot(
    query(salesCol(clinicId), where('status', '==', 'pending')),
    (snap) =>
      cb(
        snap.docs
          .map((d) => toSale(d.id, d.data()))
          .filter((s) => s.mode === 'test')
          .sort((a, b) => (a.created_ms ?? 0) - (b.created_ms ?? 0))
      ),
    () => cb([])
  );
}

/** Bugünkü satışlar (panel özeti), yeniden eskiye. */
export async function listTodaySales(clinicId: string): Promise<Sale[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const snap = await getDocs(query(salesCol(clinicId), where('created_at', '>=', Timestamp.fromDate(start))));
  return snap.docs.map((d) => toSale(d.id, d.data())).sort((a, b) => (b.created_ms ?? 0) - (a.created_ms ?? 0));
}

/** Bir hastanın satışları, yeniden eskiye. */
export async function listPatientSales(clinicId: string, patientId: string): Promise<Sale[]> {
  const snap = await getDocs(query(salesCol(clinicId), where('patient_id', '==', patientId)));
  return snap.docs.map((d) => toSale(d.id, d.data())).sort((a, b) => (b.created_ms ?? 0) - (a.created_ms ?? 0));
}

/** Test onay kodu: 6 hane. */
export function testAuthCode(rand: () => number = Math.random): string {
  return String(Math.floor(rand() * 1_000_000)).padStart(6, '0');
}

/** Test POS'unda sonucu yazar (ya da panelden bekleyen satışı iptal eder). */
export async function resolveSale(vet: VetProfile, sale: Sale, status: Exclude<SaleStatus, 'pending'>): Promise<void> {
  await updateDoc(doc(salesCol(vet.clinic_id), sale.id), {
    status,
    resolved_at: serverTimestamp(),
    resolved_by: vet.uid,
    ...(status === 'approved' ? { card_last4: '4242', auth_code: testAuthCode() } : {}),
  });
}

export type StartPaymentError = 'offline' | 'auth' | 'forbidden' | 'iyzico' | 'server';

/** Ödeme sunucusuna hekim adına istek (Firebase oturum belgesiyle). */
async function callPay(path: string, clinicId: string, saleId: string): Promise<{ ok: boolean; status: number; data: Record<string, unknown> } | null> {
  const user = getAuthInstance()?.currentUser;
  if (!PAY_API_URL || !user) return { ok: false, status: 401, data: {} };
  try {
    const res = await fetch(`${PAY_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ clinicId, saleId }),
    });
    return { ok: res.ok, status: res.status, data: ((await res.json().catch(() => ({}))) as Record<string, unknown>) ?? {} };
  } catch {
    return null;
  }
}

/**
 * iyzico ödeme sayfasını başlatır (sunucu tutarı satış belgesinden okur).
 * Sayfa adresi ayrıca satış belgesine de yazılır; panel onu canlı görür.
 */
export async function startOnlinePayment(
  clinicId: string,
  saleId: string
): Promise<{ url: string } | { error: StartPaymentError; message?: string }> {
  const r = await callPay('/start', clinicId, saleId);
  if (!r) return { error: 'offline' };
  if (r.ok && typeof r.data.url === 'string') return { url: r.data.url };
  if (r.status === 401) return { error: 'auth' };
  if (r.status === 403) return { error: 'forbidden' };
  if (r.data.error === 'iyzico') return { error: 'iyzico', message: typeof r.data.message === 'string' ? r.data.message : undefined };
  return { error: 'server' };
}

/**
 * Sonucu iyzico'dan yeniden sordurur (dönüş kaçtıysa). Ödeme alındıysa satış
 * "alındı" olur ve panel canlı görür; alınmadıysa beklemede kalır.
 */
export async function checkOnlinePayment(clinicId: string, saleId: string): Promise<{ status: string; message?: string } | { error: StartPaymentError }> {
  const r = await callPay('/check', clinicId, saleId);
  if (!r) return { error: 'offline' };
  if (r.ok && typeof r.data.status === 'string') return { status: r.data.status, message: typeof r.data.message === 'string' ? r.data.message : undefined };
  if (r.status === 401) return { error: 'auth' };
  if (r.status === 403) return { error: 'forbidden' };
  return { error: 'server' };
}
