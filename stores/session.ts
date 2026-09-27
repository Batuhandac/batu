// Oturum: misafir (anonim), evcil hayvan sahibi, veteriner hekim ya da doğrulama
// bekleyen hekim. Acil özellikler hiçbir zaman giriş istemez; anonim oturum ilk
// ihtiyaçta (soru, yorum, mesaj) görünmez biçimde açılır. Misafir kayıt olursa
// aynı kimlik korunur (linkWithCredential): sorduğu sorular ve mesajları kaybolmaz.
import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import {
  getAuthInstance,
  fetchVetProfile,
  fetchUserDoc,
  authErrorMessage,
  type VetProfile,
  type Role,
} from '@/lib/auth';
import { setAuthorName } from '@/lib/deviceId';
import { track } from '@/lib/analytics';

type Result = { ok: boolean; message?: string };

interface SessionState {
  ready: boolean;
  uid: string | null;
  isAnonymous: boolean;
  email: string | null;
  name: string | null;
  role: Role;
  vet: VetProfile | null;
  init: () => void;
  ensureUser: () => Promise<string | null>;
  refreshRole: () => Promise<void>;
  signUp: (input: { role: 'owner' | 'vet_pending'; name: string; email: string; password: string; title?: string | null }) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<Result>;
  resetPassword: (email: string) => Promise<boolean>;
}

let started = false;
let readyWaiters: (() => void)[] = [];

async function resolveUser(user: User) {
  if (user.isAnonymous) {
    return { uid: user.uid, isAnonymous: true, email: null, name: null, role: 'guest' as Role, vet: null };
  }
  const [vet, doc_] = await Promise.all([fetchVetProfile(user.uid), fetchUserDoc(user.uid)]);
  const role: Role = vet ? 'vet' : doc_?.role ?? 'owner';
  return {
    uid: user.uid,
    isAnonymous: false,
    email: user.email,
    name: vet?.name ?? user.displayName ?? doc_?.name ?? null,
    role,
    vet,
  };
}

export const useSession = create<SessionState>((set, get) => ({
  ready: false,
  uid: null,
  isAnonymous: true,
  email: null,
  name: null,
  role: 'guest',
  vet: null,

  init: () => {
    if (started) return;
    started = true;
    const auth = getAuthInstance();
    if (!auth) {
      set({ ready: true });
      return;
    }
    onAuthStateChanged(auth, async (user) => {
      if (!user) set({ uid: null, isAnonymous: true, email: null, name: null, role: 'guest', vet: null, ready: true });
      else set({ ...(await resolveUser(user)), ready: true });
      readyWaiters.forEach((w) => w());
      readyWaiters = [];
    });
  },

  ensureUser: async () => {
    get().init();
    if (!get().ready) await new Promise<void>((r) => readyWaiters.push(r));
    const existing = get().uid;
    if (existing) return existing;
    const auth = getAuthInstance();
    if (!auth) return null;
    try {
      const cred = await signInAnonymously(auth);
      set({ uid: cred.user.uid, isAnonymous: true, role: 'guest' });
      return cred.user.uid;
    } catch {
      return null;
    }
  },

  refreshRole: async () => {
    const user = getAuthInstance()?.currentUser;
    if (user) set(await resolveUser(user));
  },

  signUp: async ({ role, name, email, password, title }) => {
    const auth = getAuthInstance();
    if (!auth) return { ok: false, message: 'Hesap sistemi şu anda kapalı.' };
    try {
      const current = auth.currentUser;
      const cred = current?.isAnonymous
        ? await linkWithCredential(current, EmailAuthProvider.credential(email.trim(), password))
        : await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() }).catch(() => {});
      const db = getDb();
      if (db) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: name.trim(),
          role,
          title: title ?? null,
          created_at: serverTimestamp(),
        }).catch(() => {});
      }
      await setAuthorName(name.trim());
      set(await resolveUser(cred.user));
      track('sign_up', { role });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: authErrorMessage(e) };
    }
  },

  signIn: async (email, password) => {
    const auth = getAuthInstance();
    if (!auth) return { ok: false, message: 'Hesap sistemi şu anda kapalı.' };
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const next = await resolveUser(cred.user);
      if (next.name) await setAuthorName(next.name);
      set(next);
      track('sign_in', { role: next.role });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: authErrorMessage(e) };
    }
  },

  signOut: async () => {
    const auth = getAuthInstance();
    if (auth) await fbSignOut(auth).catch(() => {});
    set({ uid: null, isAnonymous: true, email: null, name: null, role: 'guest', vet: null });
  },

  // App Store 5.1.1(v): hesap oluşturulabilen uygulamada hesap silme zorunlu
  deleteAccount: async () => {
    const auth = getAuthInstance();
    const user = auth?.currentUser;
    if (!user) return { ok: true };
    try {
      const db = getDb();
      if (db) await deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
      await deleteUser(user);
      set({ uid: null, isAnonymous: true, email: null, name: null, role: 'guest', vet: null });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: authErrorMessage(e) };
    }
  },

  resetPassword: async (email) => {
    const auth = getAuthInstance();
    if (!auth) return false;
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch {
      return false;
    }
  },
}));
