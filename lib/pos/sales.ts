// Panelden tahsilat. Bir satış clinic_pos/{clinicId}/sales/{id} belgesidir: panel
// "pending" olarak yazar, sonucu POS, sunucu ya da hekim yazar; panel belgeyi canlı dinler.
//
// Modlar:
//  - "iyzico": kliniğin kendi iyzico hesabı (Ayarlar'dan bağlanır). Ödeme sunucusu
//    (server/odeme) ödeme sayfasını açar, para doğrudan kliniğin hesabına geçer.
//  - "iyzico_test": Patiport'un iyzico deneme hesabı; para sahtedir.
//  - "cash": nakit; hekim "alındı" yapar.
//  - "test": panelin sanal POS terminali (/panel/pos).
// Klinik Paraşüt'ü bağladıysa onaylı tahsilat için e-SMM ya da e-Arşiv kesilir
// (edoc_* alanlarını yalnızca sunucu yazar). Anahtarlar yalnızca sunucuda durur.
import {
  collection,
  doc,
  getDoc,
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
export type SaleMode = 'test' | 'iyzico_test' | 'iyzico' | 'cash';
export type EdocStatus = 'issuing' | 'issued' | 'failed';
export type EdocType = 'e_smm' | 'e_archive' | 'e_invoice';
const MODES: SaleMode[] = ['test', 'iyzico_test', 'iyzico', 'cash'];

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
  pay_env: 'sandbox' | 'live' | null;
  /** e-SMM / e-Arşiv (sunucu yazar) */
  edoc_status: EdocStatus | null;
  edoc_type: EdocType | null;
  edoc_number: string | null;
  edoc_error: string | null;
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
    mode: MODES.includes(d.mode as SaleMode) ? (d.mode as SaleMode) : 'test',
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
    pay_env: d.pay_env === 'live' ? 'live' : d.pay_env === 'sandbox' ? 'sandbox' : null,
    edoc_status: d.edoc_status === 'issued' || d.edoc_status === 'issuing' || d.edoc_status === 'failed' ? d.edoc_status : null,
    edoc_type: d.edoc_type === 'e_smm' || d.edoc_type === 'e_archive' || d.edoc_type === 'e_invoice' ? d.edoc_type : null,
    edoc_number: typeof d.edoc_number === 'string' ? d.edoc_number : null,
    edoc_error: typeof d.edoc_error === 'string' ? d.edoc_error : null,
  };
}

export interface SaleInput {
  amount_kurus: number;
  description: string;
  patient_id: string | null;
  patient_name: string | null;
}

/** Bekleyen satış yazar; satış kimliğini döner. */
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

/** Test POS'unda ya da nakitte sonucu yazar; panelden bekleyen satışı iptal eder. */
export async function resolveSale(vet: VetProfile, sale: Sale, status: Exclude<SaleStatus, 'pending'>): Promise<void> {
  await updateDoc(doc(salesCol(vet.clinic_id), sale.id), {
    status,
    resolved_at: serverTimestamp(),
    resolved_by: vet.uid,
    ...(status === 'approved' && sale.mode === 'test' ? { card_last4: '4242', auth_code: testAuthCode() } : {}),
  });
}

/** Nakit tahsilat: satışı yazıp hemen "alındı" yapar. */
export async function recordCashSale(vet: VetProfile, input: SaleInput): Promise<string> {
  const id = await createSale(vet, input, 'cash');
  await updateDoc(doc(salesCol(vet.clinic_id), id), { status: 'approved', resolved_at: serverTimestamp(), resolved_by: vet.uid });
  return id;
}

export type StartPaymentError = 'offline' | 'auth' | 'forbidden' | 'iyzico' | 'not_connected' | 'server';

/** Ödeme sunucusuna hekim adına istek (Firebase oturum belgesiyle). */
export async function callPay(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: Record<string, unknown> } | null> {
  const user = getAuthInstance()?.currentUser;
  if (!PAY_API_URL || !user) return { ok: false, status: 401, data: {} };
  try {
    const res = await fetch(`${PAY_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body),
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
  const r = await callPay('/start', { clinicId, saleId });
  if (!r) return { error: 'offline' };
  if (r.ok && typeof r.data.url === 'string') return { url: r.data.url };
  if (r.status === 401) return { error: 'auth' };
  if (r.status === 403) return { error: 'forbidden' };
  if (r.data.error === 'iyzico') return { error: 'iyzico', message: typeof r.data.message === 'string' ? r.data.message : undefined };
  if (r.data.error === 'not_connected') return { error: 'not_connected' };
  return { error: 'server' };
}

/**
 * Sonucu iyzico'dan yeniden sordurur (dönüş kaçtıysa). Ödeme alındıysa satış
 * "alındı" olur ve panel canlı görür; alınmadıysa beklemede kalır.
 */
export async function checkOnlinePayment(clinicId: string, saleId: string): Promise<{ status: string; message?: string } | { error: StartPaymentError }> {
  const r = await callPay('/check', { clinicId, saleId });
  if (!r) return { error: 'offline' };
  if (r.ok && typeof r.data.status === 'string') return { status: r.data.status, message: typeof r.data.message === 'string' ? r.data.message : undefined };
  if (r.status === 401) return { error: 'auth' };
  if (r.status === 403) return { error: 'forbidden' };
  return { error: 'server' };
}

// ─── Kliniğin bağlı hesapları ve e-belge ─────────────────────────────────────

export interface ClinicPay {
  iyzico: { env: 'sandbox' | 'live'; key_hint: string; connected_ms: number } | null;
  parasut: { company_id: number; company_name: string; status: 'ok' | 'reauth'; connected_ms: number } | null;
}

/** Bağlantı özeti (anahtar içermez); yalnızca sunucu yazar. */
export function watchClinicPay(clinicId: string, cb: (p: ClinicPay) => void): () => void {
  const db = getDb();
  if (!db) {
    cb({ iyzico: null, parasut: null });
    return () => {};
  }
  return onSnapshot(
    doc(db, 'clinic_pay', clinicId),
    (snap) => {
      const d = (snap.data() ?? {}) as Record<string, any>;
      cb({
        iyzico: d.iyzico ? { env: d.iyzico.env === 'live' ? 'live' : 'sandbox', key_hint: String(d.iyzico.key_hint ?? ''), connected_ms: Number(d.iyzico.connected_ms) || 0 } : null,
        parasut: d.parasut
          ? { company_id: Number(d.parasut.company_id), company_name: String(d.parasut.company_name ?? ''), status: d.parasut.status === 'reauth' ? 'reauth' : 'ok', connected_ms: Number(d.parasut.connected_ms) || 0 }
          : null,
      });
    },
    () => cb({ iyzico: null, parasut: null })
  );
}

export interface ClinicSettings {
  edoc_type: 'e_smm' | 'e_archive';
  vat_rate: 0 | 1 | 10 | 20;
  edoc_auto: boolean;
  edoc_city: string;
  edoc_district: string;
}
export const DEFAULT_SETTINGS: ClinicSettings = { edoc_type: 'e_smm', vat_rate: 20, edoc_auto: true, edoc_city: '', edoc_district: '' };

export async function loadClinicSettings(clinicId: string): Promise<ClinicSettings> {
  const db = getDb();
  if (!db) return DEFAULT_SETTINGS;
  const d = (await getDoc(doc(db, 'clinic_settings', clinicId))).data() as Partial<ClinicSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(d ?? {}) };
}

export async function saveClinicSettings(vet: VetProfile, s: ClinicSettings): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('offline');
  await setDoc(doc(db, 'clinic_settings', vet.clinic_id), {
    edoc_type: s.edoc_type,
    vat_rate: s.vat_rate,
    edoc_auto: s.edoc_auto,
    edoc_city: s.edoc_city.trim().slice(0, 40),
    edoc_district: s.edoc_district.trim().slice(0, 40),
    updated_by: vet.uid,
    updated_at: serverTimestamp(),
  });
}

export type ConnectError = 'offline' | 'auth' | 'forbidden' | 'invalid_keys' | 'vault' | 'parasut_not_configured' | 'server';
const errOf = (r: { status: number; data: Record<string, unknown> } | null): ConnectError => {
  if (!r) return 'offline';
  if (r.status === 401) return 'auth';
  if (r.status === 403) return 'forbidden';
  const e = r.data.error;
  return e === 'invalid_keys' || e === 'vault' || e === 'parasut_not_configured' ? e : 'server';
};
const msgOf = (r: { data: Record<string, unknown> } | null) => (r && typeof r.data.message === 'string' ? r.data.message : undefined);

/** Kliniğin kendi iyzico anahtarlarını dener ve şifreli olarak saklatır. */
export async function connectIyzico(clinicId: string, apiKey: string, secretKey: string): Promise<{ env: 'sandbox' | 'live' } | { error: ConnectError; message?: string }> {
  const r = await callPay('/connect/iyzico', { clinicId, apiKey, secretKey });
  if (r && r.ok) return { env: r.data.env === 'live' ? 'live' : 'sandbox' };
  return { error: errOf(r), message: msgOf(r) };
}

export async function disconnectProvider(clinicId: string, provider: 'iyzico' | 'parasut'): Promise<boolean> {
  const r = await callPay('/disconnect', { clinicId, provider });
  return Boolean(r && r.ok);
}

/** Paraşüt giriş sayfasının adresi; hekim orada izin verir, panele geri döner. */
export async function beginParasut(clinicId: string, returnUrl: string): Promise<{ url: string } | { error: ConnectError }> {
  const r = await callPay('/connect/parasut/begin', { clinicId, returnUrl });
  if (r && r.ok && typeof r.data.url === 'string') return { url: r.data.url };
  return { error: errOf(r) };
}

/** e-SMM / e-Arşiv keser (onlyIfAuto: yalnızca "kendiliğinden kes" açıksa). */
export async function issueEdoc(clinicId: string, saleId: string, onlyIfAuto = false): Promise<{ status?: string; message?: string; skipped?: boolean; error?: string }> {
  const r = await callPay('/edoc/issue', { clinicId, saleId, onlyIfAuto });
  if (!r) return { error: 'offline' };
  return r.data as { status?: string; message?: string; skipped?: boolean; error?: string };
}

export async function edocPdf(clinicId: string, saleId: string): Promise<{ url?: string; pending?: boolean; error?: string }> {
  const r = await callPay('/edoc/pdf', { clinicId, saleId });
  if (!r) return { error: 'offline' };
  return r.data as { url?: string; pending?: boolean; error?: string };
}

let healthCache: Promise<{ vault: boolean; parasut: boolean } | null> | null = null;
/** Sunucunun neleri açık: şifreli kasa (kendi iyzico) ve Paraşüt. */
export function payServerFeatures(): Promise<{ vault: boolean; parasut: boolean } | null> {
  if (!PAY_API_URL) return Promise.resolve(null);
  healthCache ??= fetch(`${PAY_API_URL}/health`)
    .then((r) => r.json())
    .then((d) => ({ vault: Boolean(d.vault), parasut: Boolean(d.parasut) }))
    .catch(() => {
      healthCache = null;
      return null;
    });
  return healthCache;
}
