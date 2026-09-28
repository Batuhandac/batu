// Sahip tarafı: dostunu veterinerine kodla bağlama ve hekimin panelden girdiği
// kayıtları bakım takvimine aktarma. Dost kartı yine telefonda durur; sunucuya
// yalnızca sahip "Veterinerime bağla" dediğinde kısa bir özet gider.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { registerForPush } from '@/lib/push';
import { useSession } from '@/stores/session';
import { addWeight, applyVetRecord, type CareKind } from '@/lib/data/care';
import { newLinkCode, type VetRecord } from '@/lib/data/vetRecords';
import type { Pet } from '@/types';

const LINKS_KEY = 'patisos:vetlinks';
const IMPORTED_KEY = 'patisos:vetimported';
const CODE_TTL_MS = 24 * 3600 * 1000;

export interface VetLink {
  code: string;
  pet_id: string;
  created_ms: number;
  clinic_id?: string;
  patient_id?: string;
  clinic_name?: string;
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadVetLinks(petId?: string): Promise<VetLink[]> {
  const all = await readJSON<VetLink[]>(LINKS_KEY, []);
  return petId ? all.filter((l) => l.pet_id === petId) : all;
}

async function saveVetLinks(links: VetLink[]) {
  await AsyncStorage.setItem(LINKS_KEY, JSON.stringify(links)).catch(() => {});
}

const speciesOf = (s: string | null): 'dog' | 'cat' | 'other' => (s === 'dog' || s === 'cat' ? s : 'other');
const cut = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null);

/**
 * Dost için 24 saat geçerli bir kod üretir (hâlâ geçerli ve bağlanmamış bir kod
 * varsa onu döner). Veteriner kodu panele girince hasta kartı açılır.
 */
export async function createPetLink(pet: Pet): Promise<{ code: string } | { error: string }> {
  const db = getDb();
  if (!db) return { error: 'Şu an bağlantı kurulamıyor. İnternetini kontrol edip tekrar dene.' };
  const links = await loadVetLinks();
  const open = links.find((l) => l.pet_id === pet.id && !l.clinic_id && Date.now() - l.created_ms < CODE_TTL_MS - 3600 * 1000);
  if (open) return { code: open.code };

  const uid = await useSession.getState().ensureUser();
  if (!uid) return { error: 'Oturum açılamadı. Biraz sonra tekrar dene.' };
  const push = await registerForPush(true);
  const body = {
    owner_uid: uid,
    pet_local_id: pet.id,
    pet: {
      name: pet.name.slice(0, 60),
      species: speciesOf(pet.species),
      breed: cut(pet.breed, 60),
      sex: pet.sex ?? null,
      birth_date: pet.birth_date ?? null,
      weight_kg: pet.weight_kg ?? null,
      chip_no: cut(pet.chip_no, 20),
      allergies: cut(pet.allergies, 300),
      medications: cut(pet.medications, 300),
    },
    owner_name: cut(pet.owner_name ?? useSession.getState().name, 80),
    owner_push: push,
    expires_at: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
    clinic_id: null,
    patient_id: null,
    created_at: serverTimestamp(),
  };
  // Aynı kod başkasındaysa kural yazmayı reddeder; yeni kodla tekrar dene
  for (let i = 0; i < 4; i++) {
    const code = newLinkCode();
    try {
      await setDoc(doc(db, 'pet_links', code), body);
      await saveVetLinks([...links.filter((l) => l.pet_id !== pet.id || l.clinic_id), { code, pet_id: pet.id, created_ms: Date.now() }]);
      return { code };
    } catch {
      // bir sonraki kodu dene
    }
  }
  return { error: 'Kod oluşturulamadı. Biraz sonra tekrar dene.' };
}

/** Bekleyen kodlardan hangisini bir kliniğin bağladığını öğrenir. */
export async function refreshVetLinks(): Promise<VetLink[]> {
  const db = getDb();
  const links = await loadVetLinks();
  if (!db || !links.some((l) => !l.clinic_id)) return links;
  const out: VetLink[] = [];
  for (const l of links) {
    if (l.clinic_id) {
      out.push(l);
      continue;
    }
    try {
      const snap = await getDoc(doc(db, 'pet_links', l.code));
      const d = snap.data();
      if (d?.clinic_id && d?.patient_id) out.push({ ...l, clinic_id: d.clinic_id, patient_id: d.patient_id, clinic_name: d.clinic_name });
      else if (snap.exists() && Date.now() - l.created_ms < 2 * CODE_TTL_MS) out.push(l);
    } catch {
      out.push(l); // çevrimdışı: sonra tekrar bak
    }
  }
  await saveVetLinks(out);
  return out;
}

/** Bağlı klinikteki kayıtlar (dost sayfasında gösterilir), yeniden eskiye. */
export async function fetchVetRecords(link: VetLink): Promise<VetRecord[]> {
  const db = getDb();
  if (!db || !link.clinic_id || !link.patient_id) return [];
  const snap = await getDocs(collection(db, 'clinic_patients', link.clinic_id, 'patients', link.patient_id, 'records'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<VetRecord, 'id'>) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Hekimin girdiği yeni kayıtları takvime ve kilo geçmişine işler. Aktarılan
 * kayıtlar hatırlanır, ikinci kez işlenmez. Dönen liste kullanıcıya gösterilir.
 */
export async function syncVetRecords(): Promise<{ clinic_name: string; pet_id: string; title: string }[]> {
  const links = (await refreshVetLinks()).filter((l) => l.clinic_id && l.patient_id);
  if (links.length === 0) return [];
  const imported = new Set(await readJSON<string[]>(IMPORTED_KEY, []));
  const added: { clinic_name: string; pet_id: string; title: string }[] = [];
  for (const link of links) {
    let records: VetRecord[] = [];
    try {
      records = await fetchVetRecords(link);
    } catch {
      continue;
    }
    // Eskiden yeniye işle ki en son kaydın sonraki tarihi kalsın
    for (const r of [...records].reverse()) {
      const key = `${link.clinic_id}/${link.patient_id}/${r.id}`;
      if (imported.has(key)) continue;
      if (r.kind === 'weight') {
        if (r.weight_kg) await addWeight(link.pet_id, r.weight_kg, r.date);
      } else if (r.kind !== 'note') {
        await applyVetRecord(link.pet_id, { kind: r.kind as CareKind, title: r.title, date: r.date, next_due: r.next_due, note: r.note });
      }
      if (r.kind !== 'weight' && r.weight_kg) await addWeight(link.pet_id, r.weight_kg, r.date);
      imported.add(key);
      added.push({ clinic_name: link.clinic_name ?? 'Veterinerin', pet_id: link.pet_id, title: r.title });
    }
  }
  await AsyncStorage.setItem(IMPORTED_KEY, JSON.stringify([...imported])).catch(() => {});
  return added;
}

let lastSync = 0;
/** Ana sayfa her açıldığında çağırır; 10 dakikada bir en fazla bir kez eşitler. */
export async function syncVetRecordsSometimes(minMs = 10 * 60 * 1000) {
  if (Date.now() - lastSync < minMs) return [];
  lastSync = Date.now();
  if ((await loadVetLinks()).length === 0) return [];
  return syncVetRecords().catch(() => []);
}
