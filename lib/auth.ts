// Firebase Auth — kullanıcılar görünmez biçimde anonim oturum açar (kayıt ekranı
// yok); topluluk gönderileri ve mesajlar bu kimliğe bağlanır. Veteriner hekimler
// yöneticinin oluşturduğu e-posta hesabıyla girer (bkz. YONETICI_REHBERI.md).
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseApp, getDb } from '@/lib/firebase';

let _auth: Auth | null = null;

export function getAuthInstance(): Auth | null {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    if (Platform.OS === 'web') {
      _auth = getAuth(app);
    } else {
      // RN derlemesinde firebase/auth bu fonksiyonu dışa aktarır; tip tanımında yok.
      const rn = (FirebaseAuth as unknown as {
        getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
      }).getReactNativePersistence;
      try {
        _auth = initializeAuth(app, rn ? { persistence: rn(AsyncStorage) } : {});
      } catch {
        _auth = getAuth(app); // hızlı yenilemede zaten başlatılmış olabilir
      }
    }
  } catch {
    _auth = null;
  }
  return _auth;
}

// ─── Veteriner hekim profili ─────────────────────────────────────────────────
// vets/{uid} belgesini yalnızca yönetici oluşturur; kural tarafında da
// "veteriner yanıtı" rozeti ve klinik gelen kutusu bu belgeye bakar.
export interface VetProfile {
  uid: string;
  clinic_id: string;
  clinic_name: string;
  name: string;
  title: string | null; // "Vet. Hek.", "Uzm. Vet. Hek." …
}

export async function fetchVetProfile(uid: string): Promise<VetProfile | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'vets', uid));
    if (!snap.exists()) return null;
    const d = snap.data() as Partial<VetProfile>;
    if (!d.clinic_id || !d.clinic_name || !d.name) return null;
    return { uid, clinic_id: d.clinic_id, clinic_name: d.clinic_name, name: d.name, title: d.title ?? null };
  } catch {
    return null;
  }
}

export function vetDisplayName(v: Pick<VetProfile, 'name' | 'title'>): string {
  return v.title ? `${v.title} ${v.name}` : v.name;
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-posta ya da şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantını kontrol edip tekrar dene.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış. Bizimle iletişime geç.';
    default:
      return 'Giriş yapılamadı. Biraz sonra tekrar dene.';
  }
}
