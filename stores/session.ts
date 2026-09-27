// Oturum durumu: anonim kullanıcı ya da veteriner hekim.
// Anonim oturum ilk ihtiyaçta (soru sorma, yorum, mesaj) açılır; okuma için gerekmez.
import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { getAuthInstance, fetchVetProfile, authErrorMessage, type VetProfile } from '@/lib/auth';

interface SessionState {
  ready: boolean;
  uid: string | null;
  isAnonymous: boolean;
  email: string | null;
  vet: VetProfile | null;
  init: () => void;
  ensureUser: () => Promise<string | null>;
  vetSignIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  vetSignOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

let started = false;
let readyWaiters: (() => void)[] = [];

export const useSession = create<SessionState>((set, get) => ({
  ready: false,
  uid: null,
  isAnonymous: true,
  email: null,
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
      if (!user) {
        set({ uid: null, isAnonymous: true, email: null, vet: null, ready: true });
      } else {
        const vet = user.isAnonymous ? null : await fetchVetProfile(user.uid);
        set({ uid: user.uid, isAnonymous: user.isAnonymous, email: user.email, vet, ready: true });
      }
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
      set({ uid: cred.user.uid, isAnonymous: true, email: null, vet: null });
      return cred.user.uid;
    } catch {
      return null;
    }
  },

  vetSignIn: async (email, password) => {
    const auth = getAuthInstance();
    if (!auth) return { ok: false, message: 'Şu anda giriş yapılamıyor.' };
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const vet = await fetchVetProfile(cred.user.uid);
      if (!vet) {
        await signOut(auth);
        return {
          ok: false,
          message: 'Bu hesap henüz bir kliniğe bağlanmamış. Doğrulama tamamlanınca sana haber vereceğiz.',
        };
      }
      set({ uid: cred.user.uid, isAnonymous: false, email: cred.user.email, vet });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: authErrorMessage(e) };
    }
  },

  vetSignOut: async () => {
    const auth = getAuthInstance();
    if (auth) await signOut(auth).catch(() => {});
    set({ uid: null, isAnonymous: true, email: null, vet: null });
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
