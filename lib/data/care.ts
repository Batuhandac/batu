// Bakım takvimi (aşı, parazit, kontrol, ilaç, bakım) ve kilo takibi.
// Cihazda saklanır (AsyncStorage); zamanı gelen bakım için yerel bildirim kurulur.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { genId, getPet, upsertPet } from '@/lib/data/localStore';
import { addDays, formatDate, fromISODate, todayISO } from '@/lib/utils/dates';
import type { IconName } from '@/components/ds';

export type CareKind = 'vaccine' | 'rabies' | 'internal_parasite' | 'external_parasite' | 'checkup' | 'medication' | 'grooming' | 'other';

export const CARE_KINDS: { key: CareKind; label: string; icon: IconName; repeat: number | null; hint: string }[] = [
  { key: 'vaccine', label: 'Karma aşı', icon: 'shield-checkmark-outline', repeat: 365, hint: 'Yetişkinlerde genelde yılda bir; takvimi veterinerin belirler.' },
  { key: 'rabies', label: 'Kuduz aşısı', icon: 'shield-outline', repeat: 365, hint: 'Yasal olarak zorunlu; genelde yılda bir.' },
  { key: 'internal_parasite', label: 'İç parazit', icon: 'bug-outline', repeat: 90, hint: 'Genelde 3 ayda bir; yaşa ve yaşam tarzına göre değişir.' },
  { key: 'external_parasite', label: 'Pire ve kene', icon: 'bug-outline', repeat: 30, hint: 'Kullandığın ürüne göre genelde ayda bir.' },
  { key: 'checkup', label: 'Veteriner kontrolü', icon: 'clipboard-outline', repeat: 365, hint: 'Yılda bir genel kontrol önerilir; yaşlılarda daha sık.' },
  { key: 'medication', label: 'İlaç', icon: 'medkit-outline', repeat: null, hint: 'Veterinerinin söylediği dozda ve saatte.' },
  { key: 'grooming', label: 'Tüy ve tırnak bakımı', icon: 'cut-outline', repeat: 42, hint: 'Tür ve tüy yapısına göre değişir.' },
  { key: 'other', label: 'Diğer', icon: 'calendar-outline', repeat: null, hint: '' },
];

export const REPEAT_OPTIONS: { key: string; label: string; days: number | null }[] = [
  { key: 'none', label: 'Bir kez', days: null },
  { key: 'm', label: 'Her ay', days: 30 },
  { key: 'q', label: '3 ayda bir', days: 90 },
  { key: 'y', label: 'Her yıl', days: 365 },
];

export function kindMeta(k: CareKind) {
  return CARE_KINDS.find((x) => x.key === k) ?? CARE_KINDS[CARE_KINDS.length - 1];
}

export interface CareItem {
  id: string;
  pet_id: string;
  kind: CareKind;
  title: string;
  due: string; // YYYY-MM-DD
  repeat_days: number | null;
  note: string | null;
  done_at: string | null; // YYYY-MM-DD
  notif_id: string | null;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  pet_id: string;
  date: string; // YYYY-MM-DD
  kg: number;
}

const CARE_KEY = 'patisos:care';
const WEIGHT_KEY = 'patisos:weights';

async function readJSON<T>(key: string): Promise<T[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(key)) ?? '[]');
  } catch {
    return [];
  }
}

// ─── Bildirimler ─────────────────────────────────────────────────────────────
async function canNotify(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    return status === 'granted';
  } catch {
    return false;
  }
}

async function schedule(item: CareItem, petName: string): Promise<string | null> {
  // Zamanı gelen günün sabahı 10:00'da; geçmişte kalan zaman için bildirim kurulmaz
  const when = fromISODate(item.due);
  when.setHours(10, 0, 0, 0);
  if (when.getTime() <= Date.now() || !(await canNotify())) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `${petName}: ${item.title}`,
        body: 'Bugün zamanı. Yapınca uygulamada işaretle, sonrakini biz hatırlatalım.',
        data: { type: 'care', petId: item.pet_id, careId: item.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
  } catch {
    return null;
  }
}

async function cancel(id: string | null) {
  if (!id || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ─── Bakım ───────────────────────────────────────────────────────────────────
export async function loadCare(petId?: string): Promise<CareItem[]> {
  const all = await readJSON<CareItem>(CARE_KEY);
  return (petId ? all.filter((c) => c.pet_id === petId) : all).sort((a, b) => a.due.localeCompare(b.due));
}

async function saveCare(items: CareItem[]) {
  await AsyncStorage.setItem(CARE_KEY, JSON.stringify(items));
}

/** Yapılmamış bakımlar, en yakını önce. */
export async function upcomingCare(petId?: string): Promise<CareItem[]> {
  return (await loadCare(petId)).filter((c) => !c.done_at);
}

export async function doneCare(petId: string): Promise<CareItem[]> {
  return (await loadCare(petId)).filter((c) => !!c.done_at).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''));
}

export async function saveCareItem(input: Omit<CareItem, 'id' | 'notif_id' | 'created_at' | 'done_at'> & { id?: string }): Promise<CareItem> {
  const all = await readJSON<CareItem>(CARE_KEY);
  const pet = await getPet(input.pet_id);
  const existing = input.id ? all.find((c) => c.id === input.id) : undefined;
  if (existing) await cancel(existing.notif_id);
  const item: CareItem = {
    id: existing?.id ?? genId(),
    pet_id: input.pet_id,
    kind: input.kind,
    title: input.title.trim() || kindMeta(input.kind).label,
    due: input.due,
    repeat_days: input.repeat_days,
    note: input.note?.trim() || null,
    done_at: null,
    notif_id: null,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
  item.notif_id = await schedule(item, pet?.name ?? 'Dostun');
  await saveCare([...all.filter((c) => c.id !== item.id), item]);
  return item;
}

export async function removeCareItem(id: string): Promise<void> {
  const all = await readJSON<CareItem>(CARE_KEY);
  await cancel(all.find((c) => c.id === id)?.notif_id ?? null);
  await saveCare(all.filter((c) => c.id !== id));
}

/**
 * Bakımı "yapıldı" işaretler. Tekrarlıysa sonrakini yapıldığı günden itibaren
 * kurar; aşı ve parazitte acil karttaki "son aşı / son parazit" de güncellenir.
 */
export async function completeCare(id: string, doneOn = todayISO()): Promise<CareItem | null> {
  const all = await readJSON<CareItem>(CARE_KEY);
  const item = all.find((c) => c.id === id);
  if (!item) return null;
  await cancel(item.notif_id);
  const done: CareItem = { ...item, done_at: doneOn, notif_id: null };
  let next: CareItem | null = null;
  if (item.repeat_days) {
    next = { ...item, id: genId(), due: addDays(doneOn, item.repeat_days), done_at: null, notif_id: null, created_at: new Date().toISOString() };
    const pet = await getPet(item.pet_id);
    next.notif_id = await schedule(next, pet?.name ?? 'Dostun');
  }
  await saveCare([...all.filter((c) => c.id !== id), done, ...(next ? [next] : [])]);

  const pet = await getPet(item.pet_id);
  if (pet) {
    const label = formatDate(doneOn);
    if (item.kind === 'vaccine' || item.kind === 'rabies') await upsertPet({ ...pet, last_vaccine_date: `${label} (${item.title})` });
    if (item.kind === 'internal_parasite' || item.kind === 'external_parasite') await upsertPet({ ...pet, last_parasite_date: `${label} (${item.title})` });
  }
  return next;
}

export async function removePetCare(petId: string): Promise<void> {
  const all = await readJSON<CareItem>(CARE_KEY);
  for (const c of all.filter((x) => x.pet_id === petId)) await cancel(c.notif_id);
  await saveCare(all.filter((c) => c.pet_id !== petId));
  const w = await readJSON<WeightEntry>(WEIGHT_KEY);
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(w.filter((x) => x.pet_id !== petId)));
}

// ─── Kilo ────────────────────────────────────────────────────────────────────
export async function loadWeights(petId: string): Promise<WeightEntry[]> {
  return (await readJSON<WeightEntry>(WEIGHT_KEY)).filter((w) => w.pet_id === petId).sort((a, b) => a.date.localeCompare(b.date));
}

/** Kilo ekler; aynı gün girilmişse günceller. Acil karttaki kilo da güncellenir. */
export async function addWeight(petId: string, kg: number, date = todayISO()): Promise<void> {
  const all = await readJSON<WeightEntry>(WEIGHT_KEY);
  const rest = all.filter((w) => !(w.pet_id === petId && w.date === date));
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify([...rest, { id: genId(), pet_id: petId, date, kg }]));
  const pet = await getPet(petId);
  const latest = [...rest.filter((w) => w.pet_id === petId), { date, kg }].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (pet && latest) await upsertPet({ ...pet, weight_kg: latest.kg });
}

export async function removeWeight(id: string): Promise<void> {
  const all = await readJSON<WeightEntry>(WEIGHT_KEY);
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(all.filter((w) => w.id !== id)));
}
