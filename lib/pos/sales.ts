// Panelden POS'a tahsilat. Bir satış clinic_pos/{clinicId}/sales/{id} belgesidir:
// panel "pending" olarak yazar, POS tarafı sonucu (onay/ret) aynı belgeye yazar,
// panel belgeyi canlı dinler.
//
// Şimdilik yalnızca TEST modu var: POS, panelin /panel/pos sayfasında (başka bir
// sekmede ya da telefonda) açılan sanal bir terminaldir; banka çekimi ve e-SMM
// yapılmaz. Gerçek cihaz (ör. bulut API'li yeni nesil yazarkasa POS) eklenince
// aynı belgeyi bir sunucu işlevi okuyup cihaza iletecek ve sonucu yazacak; panel
// tarafı değişmeyecek. Cihaz API anahtarları tarayıcıya konamayacağı için bu adım
// sunucuda olmalı (docs/HEKIM_YOL_HARITASI.md, aşama 5).
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
import type { VetProfile } from '@/lib/auth';

export type SaleStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface Sale {
  id: string;
  amount_kurus: number;
  description: string;
  patient_id: string | null;
  patient_name: string | null;
  status: SaleStatus;
  mode: 'test';
  created_by: string;
  created_ms: number | null;
  resolved_ms: number | null;
  card_last4: string | null;
  auth_code: string | null;
}

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
    mode: 'test',
    created_by: String(d.created_by ?? ''),
    created_ms: ms(d.created_at),
    resolved_ms: ms(d.resolved_at),
    card_last4: (d.card_last4 as string) ?? null,
    auth_code: (d.auth_code as string) ?? null,
  };
}

export interface SaleInput {
  amount_kurus: number;
  description: string;
  patient_id: string | null;
  patient_name: string | null;
}

/** Tutarı test POS'una gönderir; satış kimliğini döner. */
export async function createTestSale(vet: VetProfile, input: SaleInput): Promise<string> {
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
    mode: 'test',
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

/** Test POS ekranı: bekleyen satışları canlı izler (eskiden yeniye). */
export function watchPendingSales(clinicId: string, cb: (s: Sale[]) => void): () => void {
  return onSnapshot(
    query(salesCol(clinicId), where('status', '==', 'pending')),
    (snap) => cb(snap.docs.map((d) => toSale(d.id, d.data())).sort((a, b) => (a.created_ms ?? 0) - (b.created_ms ?? 0))),
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
