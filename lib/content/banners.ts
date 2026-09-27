// Ana sayfa bannerları. Uygulamayla gelenler aşağıda; yönetici Firestore'daki
// app_banners koleksiyonundan yeni banner ekleyebilir ya da aynı id ile
// active:false yazarak buradakilerden birini gizleyebilir (YONETICI_REHBERI.md).
// Reklam değildir: yalnızca uygulama içi bilgi ve özellikler.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface Banner {
  id: string;
  tag: string;
  title: string;
  text: string;
  cta: string;
  route?: string; // uygulama içi yol, ör. /community
  url?: string; // https bağlantısı
  months?: number[]; // 1–12; yoksa her ay
  when?: 'no_pets' | 'has_pets';
  order?: number;
}

export const LOCAL_BANNERS: Banner[] = [
  {
    id: 'takvim',
    tag: 'Yeni',
    title: 'Aşı ve parazit günlerini unutma',
    text: 'Bakım takvimine ekle, zamanı gelince hatırlatalım.',
    cta: 'Takvime ekle',
    route: '/care/edit',
    when: 'has_pets',
  },
  {
    id: 'profil',
    tag: 'Başlarken',
    title: 'Dostunu tanıt',
    text: 'Fotoğrafı, yaşı ve sağlık bilgileriyle profilini oluştur.',
    cta: 'Dost ekle',
    route: '/pets/create',
    when: 'no_pets',
  },
  {
    id: 'sor',
    tag: 'Topluluk',
    title: 'Aklına takılanı veterinere sor',
    text: 'Onaylı hekimler ve pati sahipleri yanıtlıyor.',
    cta: 'Soru sor',
    route: '/community',
  },
  {
    id: 'sicak',
    tag: 'Yaz',
    title: 'Sıcak çarpmasına dikkat',
    text: 'Arabada asla bırakma, yürüyüşleri serin saatlere al.',
    cta: 'Belirtiler',
    route: '/first-aid',
    months: [6, 7, 8, 9],
  },
  {
    id: 'antifriz',
    tag: 'Kış',
    title: 'Antifriz tatlıdır, zehirlidir',
    text: 'Dökülen antifrizi hemen sil; birkaç yalamak bile tehlikeli.',
    cta: 'Ne yapmalı?',
    route: '/first-aid',
    months: [11, 12, 1, 2, 3],
  },
  {
    id: 'parazit',
    tag: 'Mevsim',
    title: 'Kene ve pire sezonu',
    text: 'Pire ve kene damlasının gününü takvime ekle.',
    cta: 'Hatırlat',
    route: '/care/edit?kind=external_parasite',
    months: [4, 5, 6, 7, 8, 9, 10],
    when: 'has_pets',
  },
  {
    id: 'hekim',
    tag: 'Hekimler için',
    title: 'Veteriner hekim misiniz?',
    text: 'Kliniğinizi ücretsiz doğrulayın, sorulara yanıt verin.',
    cta: 'Bilgi alın',
    route: '/vet',
  },
];

const CACHE_KEY = 'patisos:remote_banners';

type RemoteBanner = Banner & { active: boolean; starts_at?: string; ends_at?: string };

function parseRemote(id: string, x: any): RemoteBanner | null {
  if (typeof x?.title !== 'string' || typeof x?.cta !== 'string') return null;
  const route = typeof x.route === 'string' && x.route.startsWith('/') ? x.route : undefined;
  const url = typeof x.url === 'string' && x.url.startsWith('https://') ? x.url : undefined;
  return {
    id,
    active: x.active !== false,
    tag: typeof x.tag === 'string' ? x.tag : '',
    title: x.title.slice(0, 60),
    text: typeof x.text === 'string' ? x.text.slice(0, 90) : '',
    cta: x.cta.slice(0, 20),
    route,
    url,
    months: Array.isArray(x.months) ? x.months.filter((m: unknown) => typeof m === 'number') : undefined,
    when: x.when === 'no_pets' || x.when === 'has_pets' ? x.when : undefined,
    order: typeof x.order === 'number' ? x.order : 100,
    starts_at: typeof x.starts_at === 'string' ? x.starts_at : undefined,
    ends_at: typeof x.ends_at === 'string' ? x.ends_at : undefined,
  };
}

export async function loadCachedRemoteBanners(): Promise<RemoteBanner[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) ?? '[]');
  } catch {
    return [];
  }
}

export async function fetchRemoteBanners(): Promise<RemoteBanner[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await getDocs(collection(db, 'app_banners'));
    if (snap.metadata.fromCache) return null; // çevrimdışı: önbellekteki listeyi koru
    const list = snap.docs.map((d) => parseRemote(d.id, d.data())).filter((b): b is RemoteBanner => !!b);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
    return list;
  } catch {
    return null;
  }
}

/** Gösterilecek bannerlar: uzak (yönetici) önce, sonra mevsime ve duruma uyan yereller. */
export function selectBanners(remote: RemoteBanner[], hasPets: boolean, now = new Date()): Banner[] {
  const month = now.getMonth() + 1;
  const today = now.toISOString().slice(0, 10);
  const fits = (b: Banner & { starts_at?: string; ends_at?: string }) =>
    (!b.months || b.months.length === 0 || b.months.includes(month)) &&
    (!b.when || (b.when === 'has_pets') === hasPets) &&
    (!b.starts_at || b.starts_at <= today) &&
    (!b.ends_at || b.ends_at >= today);

  const hidden = new Set(remote.filter((r) => !r.active).map((r) => r.id));
  const overridden = new Set(remote.map((r) => r.id));
  const fromRemote = remote.filter((r) => r.active && fits(r)).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  const fromLocal = LOCAL_BANNERS.filter((b) => !hidden.has(b.id) && !overridden.has(b.id) && fits(b));
  return [...fromRemote, ...fromLocal].slice(0, 6);
}
