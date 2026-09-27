// Topluluk: "Veterinere sor" soru-cevap.
// questions/{id} · questions/{id}/answers/{id} · …/answers/{id}/helpful/{uid}
// Okuma herkese açık; yazma anonim ya da veteriner oturumu ister (firestore.rules).
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  onSnapshot,
  writeBatch,
  increment,
  deleteDoc,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from '@/lib/firebase';
import { getAuthorName } from '@/lib/deviceId';
import { vetDisplayName } from '@/lib/auth';
import { useSession } from '@/stores/session';
import type { IconName } from '@/components/ds';

export type Species = 'dog' | 'cat' | 'other';
export type TopicKey = 'saglik' | 'beslenme' | 'davranis' | 'asi' | 'yavru' | 'bakim' | 'diger';

export const TOPICS: { key: TopicKey; label: string; icon: IconName }[] = [
  { key: 'saglik', label: 'Sağlık', icon: 'pulse-outline' },
  { key: 'beslenme', label: 'Beslenme', icon: 'nutrition-outline' },
  { key: 'davranis', label: 'Davranış', icon: 'happy-outline' },
  { key: 'asi', label: 'Aşı ve parazit', icon: 'shield-checkmark-outline' },
  { key: 'yavru', label: 'Yavru bakımı', icon: 'paw-outline' },
  { key: 'bakim', label: 'Tüy ve bakım', icon: 'cut-outline' },
  { key: 'diger', label: 'Diğer', icon: 'ellipsis-horizontal-circle-outline' },
];

export function topicLabel(k: string): string {
  return TOPICS.find((t) => t.key === k)?.label ?? 'Diğer';
}

export interface Question {
  id: string;
  author_uid: string;
  author_name: string;
  species: Species;
  topic: TopicKey;
  title: string;
  body: string;
  photo_url: string | null;
  created_at: string;
  last_activity_at: string;
  answer_count: number;
  has_vet_answer: boolean;
}

export interface Answer {
  id: string;
  question_id: string;
  author_uid: string;
  author_name: string;
  body: string;
  created_at: string;
  is_vet: boolean;
  vet_clinic_id: string | null;
  vet_clinic_name: string | null;
  helpful: number;
}

type Result<T> = ({ ok: true } & T) | { ok: false; message: string };

const WRITE_TIMEOUT_MS = 12000;
const OFFLINE = 'Gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.';

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), WRITE_TIMEOUT_MS)),
  ]);
}

function iso(v: any): string {
  return v?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
}

function toQuestion(d: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => any }): Question {
  const x = d.data() as any;
  return {
    id: d.id,
    author_uid: x.author_uid,
    author_name: x.author_name ?? 'Pati dostu',
    species: x.species ?? 'other',
    topic: x.topic ?? 'diger',
    title: x.title ?? '',
    body: x.body ?? '',
    photo_url: x.photo_url ?? null,
    created_at: iso(x.created_at),
    last_activity_at: iso(x.last_activity_at ?? x.created_at),
    answer_count: x.answer_count ?? 0,
    has_vet_answer: !!x.has_vet_answer,
  };
}

function toAnswer(questionId: string, d: QueryDocumentSnapshot<DocumentData>): Answer {
  const x = d.data() as any;
  return {
    id: d.id,
    question_id: questionId,
    author_uid: x.author_uid,
    author_name: x.author_name ?? 'Pati dostu',
    body: x.body ?? '',
    created_at: iso(x.created_at),
    is_vet: !!x.is_vet,
    vet_clinic_id: x.vet_clinic_id ?? null,
    vet_clinic_name: x.vet_clinic_name ?? null,
    helpful: x.helpful ?? 0,
  };
}

// ─── Okuma ───────────────────────────────────────────────────────────────────
export type QuestionCursor = QueryDocumentSnapshot<DocumentData> | null;

export async function fetchQuestions(
  after: QuestionCursor = null,
  pageSize = 40
): Promise<{ items: Question[]; cursor: QuestionCursor } | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const base = query(collection(db, 'questions'), orderBy('created_at', 'desc'), fbLimit(pageSize));
    const q = after ? query(base, startAfter(after)) : base;
    const snap = await getDocs(q);
    // Sunucuya ulaşılamazsa SDK önbellekten boş sonuç döner; bunu "hiç soru yok" sanma
    if (snap.empty && snap.metadata.fromCache) return null;
    return {
      items: snap.docs.map(toQuestion),
      cursor: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null,
    };
  } catch {
    return null;
  }
}

export async function fetchMyQuestions(uid: string): Promise<Question[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, 'questions'), where('author_uid', '==', uid), fbLimit(50)));
    return snap.docs.map(toQuestion).sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

export function subscribeQuestion(id: string, cb: (q: Question | null) => void): Unsubscribe {
  const db = getDb();
  if (!db) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'questions', id),
    (s) => cb(s.exists() ? toQuestion({ id: s.id, data: () => s.data() }) : null),
    () => cb(null)
  );
}

export function subscribeAnswers(questionId: string, cb: (a: Answer[]) => void): Unsubscribe {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'questions', questionId, 'answers'), orderBy('created_at', 'asc'), fbLimit(200)),
    (s) => cb(s.docs.map((d) => toAnswer(questionId, d))),
    () => cb([])
  );
}

// ─── Yazma ───────────────────────────────────────────────────────────────────
async function uploadQuestionPhoto(uid: string, localUri: string): Promise<string | null> {
  const storage = getStorageInstance();
  if (!storage) return null;
  try {
    const blob = await (await fetch(localUri)).blob();
    const contentType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    const r = ref(storage, `question_photos/${uid}/${Date.now()}.jpg`);
    await withTimeout(uploadBytes(r, blob, { contentType }));
    return await getDownloadURL(r);
  } catch {
    return null;
  }
}

export async function postQuestion(input: {
  species: Species;
  topic: TopicKey;
  title: string;
  body: string;
  photoUri: string | null;
}): Promise<Result<{ id: string }>> {
  const db = getDb();
  const uid = await useSession.getState().ensureUser();
  if (!db || !uid) return { ok: false, message: 'Topluluk şu anda kullanılamıyor. Biraz sonra tekrar dene.' };
  let photo_url: string | null = null;
  if (input.photoUri) {
    photo_url = await uploadQuestionPhoto(uid, input.photoUri);
    if (!photo_url) return { ok: false, message: 'Fotoğraf yüklenemedi. Fotoğrafsız paylaşmayı ya da tekrar denemeyi seçebilirsin.' };
  }
  const vet = useSession.getState().vet;
  try {
    const r = await withTimeout(
      addDoc(collection(db, 'questions'), {
        author_uid: uid,
        author_name: vet ? vetDisplayName(vet) : await getAuthorName(),
        species: input.species,
        topic: input.topic,
        title: input.title.trim(),
        body: input.body.trim(),
        photo_url,
        answer_count: 0,
        has_vet_answer: false,
        last_answer_id: null,
        created_at: serverTimestamp(),
        last_activity_at: serverTimestamp(),
      })
    );
    return { ok: true, id: r.id };
  } catch {
    return { ok: false, message: OFFLINE };
  }
}

export async function postAnswer(question: Question, body: string): Promise<Result<{}>> {
  const db = getDb();
  const uid = await useSession.getState().ensureUser();
  if (!db || !uid) return { ok: false, message: 'Topluluk şu anda kullanılamıyor. Biraz sonra tekrar dene.' };
  const vet = useSession.getState().vet;
  const qRef = doc(db, 'questions', question.id);
  const aRef = doc(collection(db, 'questions', question.id, 'answers'));
  const batch = writeBatch(db);
  batch.set(aRef, {
    author_uid: uid,
    author_name: vet ? vetDisplayName(vet) : await getAuthorName(),
    body: body.trim(),
    is_vet: !!vet,
    vet_clinic_id: vet?.clinic_id ?? null,
    vet_clinic_name: vet?.clinic_name ?? null,
    helpful: 0,
    created_at: serverTimestamp(),
  });
  batch.update(qRef, {
    answer_count: increment(1),
    last_activity_at: serverTimestamp(),
    last_answer_id: aRef.id,
    ...(vet ? { has_vet_answer: true } : {}),
  });
  try {
    await withTimeout(batch.commit());
    return { ok: true };
  } catch {
    return { ok: false, message: OFFLINE };
  }
}

export async function deleteQuestion(q: Question): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await withTimeout(deleteDoc(doc(db, 'questions', q.id)));
    return true;
  } catch {
    return false;
  }
}

export async function deleteAnswer(a: Answer): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const batch = writeBatch(db);
  batch.delete(doc(db, 'questions', a.question_id, 'answers', a.id));
  batch.update(doc(db, 'questions', a.question_id), { answer_count: increment(-1), last_answer_id: a.id });
  try {
    await withTimeout(batch.commit());
    return true;
  } catch {
    return false;
  }
}

// ─── "Faydalı" oyları ────────────────────────────────────────────────────────
// Oy belgesi kullanıcı kimliğiyle adlandırılır; kural, sayacın yalnızca ±1
// değişmesine ve oy belgesiyle aynı anda yazılmasına izin verir.
const HELPFUL_KEY = 'patisos:qa_helpful';
let helpfulCache: Set<string> | null = null;

export async function getMyHelpful(): Promise<Set<string>> {
  if (helpfulCache) return helpfulCache;
  try {
    const raw = await AsyncStorage.getItem(HELPFUL_KEY);
    helpfulCache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    helpfulCache = new Set();
  }
  return helpfulCache;
}

export async function toggleHelpful(a: Answer, on: boolean): Promise<boolean> {
  const db = getDb();
  const uid = await useSession.getState().ensureUser();
  if (!db || !uid) return false;
  const aRef = doc(db, 'questions', a.question_id, 'answers', a.id);
  const vRef = doc(db, 'questions', a.question_id, 'answers', a.id, 'helpful', uid);
  const batch = writeBatch(db);
  if (on) batch.set(vRef, { created_at: serverTimestamp() });
  else batch.delete(vRef);
  batch.update(aRef, { helpful: increment(on ? 1 : -1) });
  try {
    await withTimeout(batch.commit());
    const mine = await getMyHelpful();
    if (on) mine.add(a.id);
    else mine.delete(a.id);
    await AsyncStorage.setItem(HELPFUL_KEY, JSON.stringify([...mine])).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

// ─── Sorularıma gelen yeni yanıtlar ──────────────────────────────────────────
const SEEN_KEY = 'patisos:qa_seen';

async function readSeen(): Promise<Record<string, number>> {
  try {
    return JSON.parse((await AsyncStorage.getItem(SEEN_KEY)) ?? '{}');
  } catch {
    return {};
  }
}

export async function markQuestionSeen(q: Question): Promise<void> {
  const seen = await readSeen();
  seen[q.id] = q.answer_count;
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seen)).catch(() => {});
}

/** Kullanıcının sorularına, son bakışından bu yana gelen yanıt sayısı. */
export async function unreadAnswerCounts(mine: Question[]): Promise<Record<string, number>> {
  const seen = await readSeen();
  const out: Record<string, number> = {};
  for (const q of mine) {
    const n = q.answer_count - (seen[q.id] ?? 0);
    if (n > 0) out[q.id] = n;
  }
  return out;
}

export async function fetchQuestionOnce(id: string): Promise<Question | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const s = await getDoc(doc(db, 'questions', id));
    return s.exists() ? toQuestion({ id: s.id, data: () => s.data() }) : null;
  } catch {
    return null;
  }
}
