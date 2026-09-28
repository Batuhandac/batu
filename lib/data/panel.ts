// Hekim paneli (web): klinik hasta kartları ve kayıtları. Yalnızca o kliniğin
// onaylı hekimleri okur ve yazar (firestore.rules → clinic_patients).
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { vetDisplayName, type VetProfile } from '@/lib/auth';
import { CODE_RE, nextDueOf, normalizeCode, type LinkPreview, type Patient, type RecordKind, type VetRecord } from '@/lib/data/vetRecords';

function db() {
  const d = getDb();
  if (!d) throw new Error('offline');
  return d;
}

const patientsCol = (clinicId: string) => collection(db(), 'clinic_patients', clinicId, 'patients');
const recordsCol = (clinicId: string, pid: string) => collection(db(), 'clinic_patients', clinicId, 'patients', pid, 'records');

function toPatient(id: string, d: DocumentData): Patient {
  return {
    id,
    name: d.name,
    species: d.species,
    breed: d.breed ?? null,
    sex: d.sex ?? null,
    birth_date: d.birth_date ?? null,
    chip_no: d.chip_no ?? null,
    weight_kg: d.weight_kg ?? null,
    allergies: d.allergies ?? null,
    owner_name: d.owner_name ?? null,
    owner_phone: d.owner_phone ?? null,
    note: d.note ?? null,
    owner_push: d.owner_push ?? null,
    owner_uid: d.owner_uid ?? null,
    pet_local_id: d.pet_local_id ?? null,
    link_code: d.link_code ?? null,
    next_due: d.next_due ?? null,
    next_due_title: d.next_due_title ?? null,
    updated_ms: d.updated_at?.toMillis?.() ?? 0,
  };
}

export async function listPatients(clinicId: string): Promise<Patient[]> {
  const snap = await getDocs(patientsCol(clinicId));
  return snap.docs.map((d) => toPatient(d.id, d.data())).sort((a, b) => b.updated_ms - a.updated_ms);
}

export async function getPatient(clinicId: string, id: string): Promise<Patient | null> {
  const snap = await getDoc(doc(patientsCol(clinicId), id));
  return snap.exists() ? toPatient(snap.id, snap.data()) : null;
}

export async function listRecords(clinicId: string, pid: string): Promise<VetRecord[]> {
  const snap = await getDocs(recordsCol(clinicId, pid));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<VetRecord, 'id'>) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Kodla eşleştirme ───────────────────────────────────────────────────────
export type LookupResult = { ok: true; link: LinkPreview } | { ok: false; reason: 'format' | 'notfound' | 'linked' };

/** Sahibin söylediği kodu okur. Süresi dolmuş ya da olmayan kod "notfound" döner. */
export async function lookupLink(input: string): Promise<LookupResult> {
  const code = normalizeCode(input);
  if (!CODE_RE.test(code)) return { ok: false, reason: 'format' };
  try {
    const snap = await getDoc(doc(db(), 'pet_links', code));
    if (!snap.exists()) return { ok: false, reason: 'notfound' };
    const d = snap.data();
    if (d.clinic_id) return { ok: false, reason: 'linked' };
    return {
      ok: true,
      link: { code, owner_uid: d.owner_uid, owner_name: d.owner_name ?? null, owner_push: d.owner_push ?? null, pet_local_id: d.pet_local_id, pet: d.pet, linked: false },
    };
  } catch {
    // Süresi dolan kodu kural okutmaz
    return { ok: false, reason: 'notfound' };
  }
}

export interface PatientInput {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  chip_no?: string | null;
  weight_kg?: number | null;
  allergies?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  note?: string | null;
}

function clean(input: PatientInput) {
  const s = (v: string | null | undefined, n: number) => (v && v.trim() ? v.trim().slice(0, n) : null);
  return {
    name: input.name.trim().slice(0, 60),
    species: input.species,
    breed: s(input.breed, 60),
    sex: s(input.sex, 10),
    birth_date: s(input.birth_date, 10),
    chip_no: s(input.chip_no, 20),
    weight_kg: input.weight_kg ?? null,
    allergies: s(input.allergies, 300),
    owner_name: s(input.owner_name, 80),
    owner_phone: s(input.owner_phone, 30),
    note: s(input.note, 500),
  };
}

/** Kodla gelen dostu hasta olarak açar ve kodu bu kliniğe bağlar (tek işlem). */
export async function createPatientFromLink(vet: VetProfile, link: LinkPreview, extra: Partial<PatientInput> = {}): Promise<string> {
  const ref = doc(patientsCol(vet.clinic_id));
  const b = writeBatch(db());
  b.set(ref, {
    ...clean({
      name: link.pet.name,
      species: link.pet.species,
      breed: link.pet.breed,
      sex: link.pet.sex,
      birth_date: link.pet.birth_date,
      chip_no: link.pet.chip_no,
      weight_kg: link.pet.weight_kg ?? null,
      allergies: link.pet.allergies,
      owner_name: link.owner_name,
      ...extra,
    }),
    owner_uid: link.owner_uid,
    owner_push: link.owner_push,
    pet_local_id: link.pet_local_id,
    link_code: link.code,
    next_due: null,
    next_due_title: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  b.update(doc(db(), 'pet_links', link.code), {
    clinic_id: vet.clinic_id,
    patient_id: ref.id,
    clinic_name: vet.clinic_name,
    linked_at: serverTimestamp(),
  });
  await b.commit();
  return ref.id;
}

/** Uygulaması olmayan sahip için elle hasta kartı. */
export async function createPatient(vet: VetProfile, input: PatientInput): Promise<string> {
  const ref = doc(patientsCol(vet.clinic_id));
  const b = writeBatch(db());
  b.set(ref, {
    ...clean(input),
    owner_uid: null,
    owner_push: null,
    pet_local_id: null,
    link_code: null,
    next_due: null,
    next_due_title: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  await b.commit();
  return ref.id;
}

export async function updatePatient(vet: VetProfile, p: Patient, input: PatientInput): Promise<void> {
  const b = writeBatch(db());
  b.update(doc(patientsCol(vet.clinic_id), p.id), { ...clean(input), updated_at: serverTimestamp() });
  await b.commit();
}

export async function deletePatient(vet: VetProfile, p: Patient): Promise<void> {
  await deleteDoc(doc(patientsCol(vet.clinic_id), p.id));
}

// ─── Kayıtlar ────────────────────────────────────────────────────────────────
export interface RecordInput {
  kind: RecordKind;
  title: string;
  date: string;
  next_due: string | null;
  note: string | null;
  weight_kg: number | null;
}

/**
 * Kaydı ekler ve hasta kartındaki "sıradaki" tarihi, kilo değerini günceller.
 * `existing` hastanın mevcut kayıtlarıdır (sıradaki tarihi hesaplamak için).
 */
export async function addRecord(vet: VetProfile, p: Patient, input: RecordInput, existing: VetRecord[]): Promise<VetRecord> {
  const ref = doc(recordsCol(vet.clinic_id, p.id));
  const record: Omit<VetRecord, 'id'> = {
    kind: input.kind,
    title: input.title.trim().slice(0, 80),
    date: input.date,
    next_due: input.next_due,
    note: input.note?.trim() ? input.note.trim().slice(0, 1000) : null,
    weight_kg: input.weight_kg,
    vet_uid: vet.uid,
    vet_name: vetDisplayName(vet).slice(0, 80),
    clinic_name: vet.clinic_name.slice(0, 120),
  };
  const next = nextDueOf([...existing, record]);
  const b = writeBatch(db());
  b.set(ref, { ...record, created_at: serverTimestamp() });
  b.update(doc(patientsCol(vet.clinic_id), p.id), {
    next_due: next?.date ?? null,
    next_due_title: next?.title.slice(0, 80) ?? null,
    ...(input.weight_kg ? { weight_kg: input.weight_kg } : {}),
    updated_at: serverTimestamp(),
  });
  await b.commit();
  return { id: ref.id, ...record };
}

export async function deleteRecord(vet: VetProfile, p: Patient, r: VetRecord, existing: VetRecord[]): Promise<void> {
  const rest = existing.filter((x) => x.id !== r.id);
  const next = nextDueOf(rest);
  const b = writeBatch(db());
  b.delete(doc(recordsCol(vet.clinic_id, p.id), r.id));
  b.update(doc(patientsCol(vet.clinic_id), p.id), {
    next_due: next?.date ?? null,
    next_due_title: next?.title.slice(0, 80) ?? null,
    updated_at: serverTimestamp(),
  });
  await b.commit();
}
