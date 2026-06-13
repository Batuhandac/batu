// Firebase (Firestore) — topluluk içeriği için: kullanıcı klinikleri + yorumlar.
// Yapılandırma app.json > extra.firebase veya EXPO_PUBLIC_FIREBASE_* env'den okunur.
// Yapılandırma yoksa uygulama yerel veriyle sorunsuz çalışmaya devam eder
// (topluluk özellikleri sessizce devre dışı kalır).
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import Constants from 'expo-constants';

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as { firebase?: FirebaseConfig };

const config: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? extra.firebase?.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? extra.firebase?.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extra.firebase?.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? extra.firebase?.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? extra.firebase?.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? extra.firebase?.appId,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let _db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (_db) return _db;
  try {
    const app = getApps().length ? getApp() : initializeApp(config as Required<FirebaseConfig>);
    // React Native'de güvenilir bağlantı için long-polling
    try {
      _db = initializeFirestore(app, { experimentalForceLongPolling: true });
    } catch {
      _db = getFirestore(app);
    }
    return _db;
  } catch {
    return null;
  }
}
