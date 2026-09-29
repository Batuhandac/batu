// Hekimlerden kısa anket: tahsilat (POS + e-SMM) ve sıradaki özellikler için
// bekleme listesi. Cevaplar hangi yazarkasa/POS markası ve e-SMM programıyla
// başlayacağımızı belirler (docs/HEKIM_YOL_HARITASI.md). vet_interest/{uid}.
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export const POS_BRANDS = ['Banka POS’u', 'Pavo', 'Hugin', 'Beko', 'Ingenico', 'Profilo', 'Diğer', 'Bilmiyorum'] as const;
export const ESMM_WAYS = ['GİB portalı', 'Mali müşavirim', 'Bir program', 'Bilmiyorum'] as const;
export const WANTS = [
  { key: 'tahsilat', label: 'Tahsilat (POS + e-SMM tek adımda)' },
  { key: 'randevu', label: 'Randevu' },
  { key: 'sms', label: 'Toplu SMS / WhatsApp' },
  { key: 'stok', label: 'Stok ve satış' },
] as const;
export type Want = (typeof WANTS)[number]['key'];

export interface VetInterest {
  clinic_name: string | null;
  current_software: string | null;
  pos_brand: string | null;
  esmm_way: string | null;
  wants: Want[];
  note: string | null;
}

const cut = (s: string | null | undefined, n: number) => {
  const v = (s ?? '').trim();
  return v ? v.slice(0, n) : null;
};

export async function loadVetInterest(uid: string): Promise<VetInterest | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'vet_interest', uid));
  return snap.exists() ? (snap.data() as VetInterest) : null;
}

export async function saveVetInterest(uid: string, input: VetInterest): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('offline');
  await setDoc(doc(db, 'vet_interest', uid), {
    clinic_name: cut(input.clinic_name, 120),
    current_software: cut(input.current_software, 80),
    pos_brand: cut(input.pos_brand, 40),
    esmm_way: cut(input.esmm_way, 40),
    wants: [...new Set(input.wants)].slice(0, 4),
    note: cut(input.note, 300),
    updated_at: serverTimestamp(),
  });
}
