// Kullanıcı içeriği güvenliği (App Store 1.2 gereği): içerik bildirme,
// kullanıcı engelleme ve topluluk kurallarını kabul.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useSession } from '@/stores/session';

export type ReportKind = 'question' | 'answer' | 'review' | 'message';

export const REPORT_REASONS = [
  { key: 'abuse', label: 'Hakaret ya da taciz' },
  { key: 'spam', label: 'Reklam ya da spam' },
  { key: 'misinfo', label: 'Tehlikeli ya da yanlış bilgi' },
  { key: 'inappropriate', label: 'Uygunsuz içerik ya da fotoğraf' },
  { key: 'other', label: 'Başka bir sorun' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['key'];

export async function reportContent(input: {
  kind: ReportKind;
  path: string; // Firestore belge yolu, ör. questions/abc/answers/def
  reason: ReportReason;
  author_uid: string | null;
}): Promise<boolean> {
  const db = getDb();
  const uid = await useSession.getState().ensureUser();
  if (!db || !uid) return false;
  try {
    await addDoc(collection(db, 'content_reports'), {
      ...input,
      reporter_uid: uid,
      status: 'open',
      created_at: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Engellenen kullanıcılar (cihazda) ───────────────────────────────────────
const BLOCK_KEY = 'patisos:blocked_users';
let blockedCache: Set<string> | null = null;

export async function getBlockedUsers(): Promise<Set<string>> {
  if (blockedCache) return blockedCache;
  try {
    const raw = await AsyncStorage.getItem(BLOCK_KEY);
    blockedCache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    blockedCache = new Set();
  }
  return blockedCache;
}

export async function blockUser(uid: string): Promise<void> {
  const set = await getBlockedUsers();
  set.add(uid);
  await AsyncStorage.setItem(BLOCK_KEY, JSON.stringify([...set])).catch(() => {});
}

export async function unblockAll(): Promise<void> {
  blockedCache = new Set();
  await AsyncStorage.removeItem(BLOCK_KEY).catch(() => {});
}

// ─── Topluluk kuralları ──────────────────────────────────────────────────────
const RULES_KEY = 'patisos:community_rules_v1';

export async function hasAcceptedRules(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RULES_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function acceptRules(): Promise<void> {
  await AsyncStorage.setItem(RULES_KEY, '1').catch(() => {});
}

export const COMMUNITY_RULES: { icon: 'heart-outline' | 'alert-circle-outline' | 'medkit-outline' | 'megaphone-outline' | 'flag-outline'; title: string; text: string }[] = [
  {
    icon: 'alert-circle-outline',
    title: 'Acil durumlar için değil',
    text: 'Yanıt gelmesi saatler sürebilir. Dostun kötüyse soru yazma, hemen bir veterineri ara.',
  },
  {
    icon: 'medkit-outline',
    title: 'Muayenenin yerini tutmaz',
    text: 'Veteriner hekim yanıtları bilgilendirme amaçlıdır; teşhis ve tedavi muayeneyle konur.',
  },
  {
    icon: 'heart-outline',
    title: 'Nazik ol',
    text: 'Herkes dostu için endişeli. Hakaret, suçlama ve alay içeren içerikler kaldırılır.',
  },
  {
    icon: 'megaphone-outline',
    title: 'Reklam yok',
    text: 'Ürün satışı, bağlantı ve tanıtım paylaşılmaz. Sahiplendirme ilanları bu bölümün konusu değil.',
  },
  {
    icon: 'flag-outline',
    title: 'Uygunsuz içeriği bildir',
    text: 'Bildirilen içerikleri 24 saat içinde inceliyor, kuralı çiğneyen hesapları engelliyoruz.',
  },
];
