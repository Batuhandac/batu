// Klinikle mesajlaşma. Yalnızca veteriner hesabı olan ve mesajları açık
// klinikler (clinic_inboxes) mesaj alır; diğerleri için arama ve WhatsApp var.
//
// clinic_inboxes/{clinicId}               herkese açık: açık mı, yanıt süresi notu
// clinic_inboxes/{clinicId}/private/push  hekim cihaz jetonları (yalnızca taraflar)
// conversations/{clinicId__userUid}       konuşma özeti (yalnızca taraflar)
// conversations/{id}/messages/{id}        mesajlar
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limitToLast,
  onSnapshot,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getAuthorName } from '@/lib/deviceId';
import { vetDisplayName } from '@/lib/auth';
import { registerForPush, sendPush } from '@/lib/push';
import { useSession } from '@/stores/session';

export interface ClinicInbox {
  clinic_id: string;
  clinic_name: string;
  open: boolean;
  response_hint: string | null;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  clinic_name: string;
  user_uid: string;
  user_name: string;
  pet_summary: string | null;
  last_text: string;
  last_at: string;
  last_sender: 'user' | 'vet';
  user_unread: number;
  vet_unread: number;
  user_push: string | null;
}

export interface Message {
  id: string;
  sender_uid: string;
  sender_role: 'user' | 'vet';
  sender_name: string;
  text: string;
  created_at: string;
  pending: boolean;
}

function iso(v: any): string {
  return v?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
}

function toConversation(id: string, x: any): Conversation {
  return {
    id,
    clinic_id: x.clinic_id,
    clinic_name: x.clinic_name ?? 'Klinik',
    user_uid: x.user_uid,
    user_name: x.user_name ?? 'Pati dostu',
    pet_summary: x.pet_summary ?? null,
    last_text: x.last_text ?? '',
    last_at: iso(x.last_at),
    last_sender: x.last_sender === 'vet' ? 'vet' : 'user',
    user_unread: x.user_unread ?? 0,
    vet_unread: x.vet_unread ?? 0,
    user_push: x.user_push ?? null,
  };
}

export const conversationId = (clinicId: string, uid: string) => `${clinicId}__${uid}`;

// ─── Açık gelen kutuları ─────────────────────────────────────────────────────
let inboxCache: { at: number; map: Map<string, ClinicInbox> } | null = null;

export async function fetchOpenInboxes(force = false): Promise<Map<string, ClinicInbox>> {
  if (!force && inboxCache && Date.now() - inboxCache.at < 5 * 60 * 1000) return inboxCache.map;
  const db = getDb();
  const map = new Map<string, ClinicInbox>();
  if (!db) return map;
  try {
    const snap = await getDocs(query(collection(db, 'clinic_inboxes'), where('open', '==', true)));
    snap.docs.forEach((d) => {
      const x = d.data() as any;
      map.set(d.id, { clinic_id: d.id, clinic_name: x.clinic_name ?? '', open: true, response_hint: x.response_hint ?? null });
    });
    inboxCache = { at: Date.now(), map };
  } catch {
    // çevrimdışı: önceki önbelleği koru
    return inboxCache?.map ?? map;
  }
  return map;
}

export async function fetchInbox(clinicId: string): Promise<ClinicInbox | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const s = await getDoc(doc(db, 'clinic_inboxes', clinicId));
    if (!s.exists()) return null;
    const x = s.data() as any;
    return { clinic_id: s.id, clinic_name: x.clinic_name ?? '', open: !!x.open, response_hint: x.response_hint ?? null };
  } catch {
    return null;
  }
}

// ─── Konuşmalar ──────────────────────────────────────────────────────────────
/** Kullanıcı ile klinik arasındaki konuşmayı açar (yoksa oluşturur). */
export async function openConversation(clinic: { id: string; name: string }, petSummary: string | null): Promise<string | null> {
  const db = getDb();
  const uid = await useSession.getState().ensureUser();
  if (!db || !uid) return null;
  const id = conversationId(clinic.id, uid);
  const ref = doc(db, 'conversations', id);
  const push = await registerForPush();
  try {
    const s = await getDoc(ref);
    if (!s.exists()) {
      await setDoc(ref, {
        clinic_id: clinic.id,
        clinic_name: clinic.name,
        user_uid: uid,
        user_name: await getAuthorName(),
        pet_summary: petSummary,
        last_text: '',
        last_sender: 'user',
        user_unread: 0,
        vet_unread: 0,
        user_push: push,
        created_at: serverTimestamp(),
        last_at: serverTimestamp(),
      });
    } else if (push && (s.data() as any).user_push !== push) {
      await updateDoc(ref, { user_push: push }).catch(() => {});
    }
    return id;
  } catch {
    return null;
  }
}

export function subscribeConversation(id: string, cb: (c: Conversation | null) => void): Unsubscribe {
  const db = getDb();
  if (!db) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'conversations', id),
    (s) => cb(s.exists() ? toConversation(s.id, s.data()) : null),
    () => cb(null)
  );
}

function sortByLast(list: Conversation[]) {
  return list.sort((a, b) => b.last_at.localeCompare(a.last_at));
}

export function subscribeMyConversations(uid: string, cb: (c: Conversation[]) => void): Unsubscribe {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'conversations'), where('user_uid', '==', uid)),
    (s) => cb(sortByLast(s.docs.map((d) => toConversation(d.id, d.data())).filter((c) => c.last_text))),
    () => cb([])
  );
}

export function subscribeClinicConversations(clinicId: string, cb: (c: Conversation[]) => void): Unsubscribe {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'conversations'), where('clinic_id', '==', clinicId)),
    (s) => cb(sortByLast(s.docs.map((d) => toConversation(d.id, d.data())).filter((c) => c.last_text))),
    () => cb([])
  );
}

export function subscribeMessages(convId: string, cb: (m: Message[]) => void): Unsubscribe {
  const db = getDb();
  if (!db) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'conversations', convId, 'messages'), orderBy('created_at', 'asc'), limitToLast(300)),
    { includeMetadataChanges: true },
    (s) =>
      cb(
        s.docs.map((d) => {
          const x = d.data() as any;
          return {
            id: d.id,
            sender_uid: x.sender_uid,
            sender_role: x.sender_role === 'vet' ? 'vet' : 'user',
            sender_name: x.sender_name ?? '',
            text: x.text ?? '',
            created_at: iso(x.created_at),
            pending: d.metadata.hasPendingWrites,
          } as Message;
        })
      ),
    () => cb([])
  );
}

export async function sendMessage(conv: Conversation, text: string): Promise<boolean> {
  const db = getDb();
  const { uid, vet } = useSession.getState();
  if (!db || !uid) return false;
  const asVet = !!vet && vet.clinic_id === conv.clinic_id;
  const role: 'user' | 'vet' = asVet ? 'vet' : 'user';
  const body = text.trim().slice(0, 2000);
  const cRef = doc(db, 'conversations', conv.id);
  const mRef = doc(collection(db, 'conversations', conv.id, 'messages'));
  const batch = writeBatch(db);
  batch.set(mRef, {
    sender_uid: uid,
    sender_role: role,
    sender_name: asVet && vet ? vetDisplayName(vet) : conv.user_name,
    text: body,
    created_at: serverTimestamp(),
  });
  batch.update(cRef, {
    last_text: body.slice(0, 140),
    last_at: serverTimestamp(),
    last_sender: role,
    ...(asVet ? { user_unread: increment(1), vet_unread: 0 } : { vet_unread: increment(1), user_unread: 0 }),
  });
  try {
    await Promise.race([
      batch.commit(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
    ]);
  } catch {
    return false;
  }
  // Karşı tarafa bildirim (en iyi çaba)
  if (asVet) {
    sendPush([conv.user_push], conv.clinic_name, body, { type: 'message', conversationId: conv.id });
  } else {
    fetchVetTokens(conv.clinic_id).then((tokens) =>
      sendPush(tokens, `Yeni mesaj · ${conv.user_name}`, body, { type: 'message', conversationId: conv.id })
    );
  }
  return true;
}

export async function markConversationRead(conv: Conversation, as: 'user' | 'vet'): Promise<void> {
  const db = getDb();
  if (!db) return;
  if ((as === 'user' ? conv.user_unread : conv.vet_unread) === 0) return;
  await updateDoc(doc(db, 'conversations', conv.id), as === 'user' ? { user_unread: 0 } : { vet_unread: 0 }).catch(() => {});
}

// ─── Hekim tarafı ────────────────────────────────────────────────────────────
async function fetchVetTokens(clinicId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const s = await getDoc(doc(db, 'clinic_inboxes', clinicId, 'private', 'push'));
    return ((s.data() as any)?.tokens ?? []) as string[];
  } catch {
    return [];
  }
}

/** Hekim girişinde bu cihazı kliniğin bildirim listesine ekler. */
export async function registerVetDevice(clinicId: string): Promise<void> {
  const db = getDb();
  const token = await registerForPush();
  if (!db || !token) return;
  await setDoc(doc(db, 'clinic_inboxes', clinicId, 'private', 'push'), { tokens: arrayUnion(token) }, { merge: true }).catch(() => {});
}

/** Hekim çıkışında bu cihazı bildirim listesinden çıkarır. */
export async function unregisterVetDevice(clinicId: string): Promise<void> {
  const db = getDb();
  const token = await registerForPush(false);
  if (!db || !token) return;
  await setDoc(doc(db, 'clinic_inboxes', clinicId, 'private', 'push'), { tokens: arrayRemove(token) }, { merge: true }).catch(() => {});
}

export async function setInboxOpen(clinicId: string, open: boolean, responseHint: string | null): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await updateDoc(doc(db, 'clinic_inboxes', clinicId), { open, response_hint: responseHint });
    inboxCache = null;
    return true;
  } catch {
    return false;
  }
}
