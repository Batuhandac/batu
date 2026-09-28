// Hekim paneli ile sahip uygulamasının ortak türleri ve yardımcıları.
// Firestore yapısı (firestore.rules):
//   pet_links/{kod}                                   sahip üretir, hekim bağlar
//   clinic_patients/{klinik}/patients/{hasta}         hasta kartı (yalnız klinik yazar)
//   clinic_patients/{klinik}/patients/{hasta}/records kayıtlar (aşı, parazit, kilo, not…)
import { CARE_KINDS, type CareKind } from '@/lib/data/care';
import { addDays, todayISO } from '@/lib/utils/dates';

export type RecordKind = CareKind | 'weight' | 'note';

export interface VetRecord {
  id: string;
  kind: RecordKind;
  title: string;
  date: string; // YYYY-MM-DD
  next_due: string | null; // YYYY-MM-DD
  note: string | null;
  weight_kg: number | null;
  vet_uid: string;
  vet_name: string;
  clinic_name: string;
}

export interface Patient {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  chip_no: string | null;
  weight_kg: number | null;
  allergies: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  note: string | null;
  owner_push: string | null;
  owner_uid: string | null;
  pet_local_id: string | null;
  link_code: string | null;
  next_due: string | null;
  next_due_title: string | null;
  updated_ms: number;
}

/** Sahibin paylaştığı kodun içeriği (hekim önizler). */
export interface LinkPreview {
  code: string;
  owner_uid: string;
  owner_name: string | null;
  owner_push: string | null;
  pet_local_id: string;
  pet: {
    name: string;
    species: 'dog' | 'cat' | 'other';
    breed?: string | null;
    sex?: string | null;
    birth_date?: string | null;
    weight_kg?: number | null;
    chip_no?: string | null;
    allergies?: string | null;
    medications?: string | null;
  };
  linked: boolean;
}

// Karışan harfler yok (0/O, 1/I)
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

export function newLinkCode(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

/** Kullanıcının yazdığı kodu düzeltir: boşluk ve tire atılır, O→0 karışıklığı giderilmez ama büyük harfe çevrilir. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ─── Kayıt türleri (hekim formu) ────────────────────────────────────────────
export const RECORD_KINDS: { key: RecordKind; label: string; repeat: number | null }[] = [
  ...CARE_KINDS.filter((k) => k.key !== 'grooming').map((k) => ({ key: k.key as RecordKind, label: k.label, repeat: k.repeat })),
  { key: 'weight', label: 'Kilo', repeat: null },
  { key: 'note', label: 'Muayene notu', repeat: null },
];

export function recordKindLabel(k: RecordKind): string {
  return RECORD_KINDS.find((x) => x.key === k)?.label ?? 'Kayıt';
}

/** Türün olağan tekrarına göre önerilen sonraki tarih (hekim değiştirebilir). */
export function suggestNextDue(kind: RecordKind, date: string): string | null {
  const repeat = RECORD_KINDS.find((x) => x.key === kind)?.repeat;
  return repeat ? addDays(date, repeat) : null;
}

/**
 * Hasta kartındaki "sıradaki" tarih: her tür için en son yapılan kaydın sonraki
 * tarihi alınır, bugünden sonraki (ya da gecikmiş) en erken olan seçilir.
 */
export function nextDueOf(records: Pick<VetRecord, 'kind' | 'title' | 'date' | 'next_due'>[]): { date: string; title: string } | null {
  const latest = new Map<string, Pick<VetRecord, 'kind' | 'title' | 'date' | 'next_due'>>();
  for (const r of records) {
    if (r.kind === 'weight' || r.kind === 'note') continue;
    const prev = latest.get(r.kind);
    if (!prev || r.date > prev.date) latest.set(r.kind, r);
  }
  let best: { date: string; title: string } | null = null;
  for (const r of latest.values()) {
    if (!r.next_due) continue;
    if (!best || r.next_due < best.date) best = { date: r.next_due, title: r.title };
  }
  return best;
}

/** Panel "yaklaşanlar" listesi: gecikmiş ve önümüzdeki `days` gün içinde olanlar. */
export function dueSoon(patients: Patient[], days = 7, today = todayISO()): Patient[] {
  const until = addDays(today, days);
  return patients
    .filter((p) => p.next_due && p.next_due <= until)
    .sort((a, b) => (a.next_due ?? '').localeCompare(b.next_due ?? ''));
}

/** Hasta sahibine WhatsApp ile gönderilecek hatırlatma metni. */
export function reminderText(p: Pick<Patient, 'name' | 'next_due' | 'next_due_title'>, clinicName: string, formatted: string): string {
  const what = p.next_due_title ?? 'kontrol';
  return `Merhaba, ${clinicName} olarak ${p.name} için hatırlatmak istedik: ${what} zamanı ${formatted}. Randevu için bize yazabilir ya da arayabilirsiniz.`;
}

/** Türkiye cep numarasını wa.me biçimine çevirir (905XXXXXXXXX), olmazsa null. */
export function waNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = '9' + d;
  else if (d.startsWith('5')) d = '90' + d;
  return /^905\d{9}$/.test(d) ? d : null;
}
