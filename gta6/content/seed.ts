import type { Cheat, Mission, Guide, MapLocation, ContentUpdate } from '@/types';

const NOW = '2026-11-11T12:00:00Z';

/**
 * Pre-launch seed. Rule: nothing here claims a working GTA VI code.
 * Every cheat is `unverified` until the team tests it on a retail copy on launch day.
 * Replace / extend via Supabase after launch; this file is only the offline fallback.
 */
export const SEED_CHEATS: Cheat[] = [
  {
    id: 'c-invincibility', slug: 'invincibility', category: 'player',
    title: { tr: 'Ölümsüzlük', en: 'Invincibility' },
    effect: { tr: 'Belirli bir süre hasar almazsın.', en: 'Take no damage for a limited time.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
    notes: { tr: 'GTA III, Vice City, San Andreas, IV ve V hikaye modunda vardı. GTA VI için Rockstar açıklama yapmadı.', en: 'Present in story mode of GTA III, Vice City, San Andreas, IV and V. Rockstar has not confirmed it for GTA VI.' },
  },
  {
    id: 'c-full-health-armor', slug: 'full-health-armor', category: 'player',
    title: { tr: 'Tam Can ve Zırh', en: 'Full Health & Armor' },
    effect: { tr: 'Can ve zırhı anında doldurur.', en: 'Instantly refills health and armor.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
    notes: { tr: 'Serinin en eski hilelerinden. Doğrulanana kadar beklenti.', en: 'One of the oldest series cheats. Expectation until verified.' },
  },
  {
    id: 'c-weapons', slug: 'weapon-set', category: 'weapon',
    title: { tr: 'Silah Paketi', en: 'Weapon Set' },
    effect: { tr: 'Tüm temel silahları ve mermiyi verir.', en: 'Gives all basic weapons and ammo.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-wanted-down', slug: 'lower-wanted-level', category: 'world',
    title: { tr: 'Aranma Seviyesini Düşür', en: 'Lower Wanted Level' },
    effect: { tr: 'Polis aranma seviyesini bir yıldız düşürür.', en: 'Drops the wanted level by one star.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-wanted-up', slug: 'raise-wanted-level', category: 'world',
    title: { tr: 'Aranma Seviyesini Yükselt', en: 'Raise Wanted Level' },
    effect: { tr: 'Aranma seviyesini bir yıldız artırır.', en: 'Raises the wanted level by one star.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-spawn-sports', slug: 'spawn-sports-car', category: 'vehicle',
    title: { tr: 'Spor Araba Çağır', en: 'Spawn Sports Car' },
    effect: { tr: 'Yanında bir spor araba belirir.', en: 'Spawns a sports car next to you.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-spawn-bike', slug: 'spawn-motorcycle', category: 'vehicle',
    title: { tr: 'Motosiklet Çağır', en: 'Spawn Motorcycle' },
    effect: { tr: 'Yanında bir motosiklet belirir.', en: 'Spawns a motorcycle next to you.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-spawn-heli', slug: 'spawn-helicopter', category: 'vehicle',
    title: { tr: 'Helikopter Çağır', en: 'Spawn Helicopter' },
    effect: { tr: 'Yanında bir helikopter belirir.', en: 'Spawns a helicopter next to you.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-slow-mo', slug: 'slow-motion', category: 'world',
    title: { tr: 'Ağır Çekim', en: 'Slow Motion' },
    effect: { tr: 'Oyun hızını düşürür, tekrar girince kademeli artar.', en: 'Slows the game down, cycles with repeated entry.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-weather', slug: 'change-weather', category: 'world',
    title: { tr: 'Hava Durumunu Değiştir', en: 'Change Weather' },
    effect: { tr: 'Hava durumunu sırayla değiştirir.', en: 'Cycles through weather states.' },
    codes: {}, status: 'unverified', updatedAt: NOW,
  },
  {
    id: 'c-moon-gravity', slug: 'moon-gravity', category: 'world',
    title: { tr: 'Ay Yerçekimi', en: 'Moon Gravity' },
    effect: { tr: 'Düşük yerçekimi.', en: 'Low gravity.' },
    codes: {}, status: 'rumor', updatedAt: NOW,
    notes: { tr: 'GTA V\'de vardı. GTA VI için sosyal medyada "sızdı" diye dolaşan kodlar GTA V kodlarının kopyası.', en: 'Was in GTA V. Codes "leaked" on social media for GTA VI are copies of GTA V codes.' },
  },
  {
    id: 'c-online-cheats', slug: 'online-cheats', category: 'misc',
    title: { tr: 'GTA Online Hileleri', en: 'GTA Online Cheats' },
    effect: { tr: 'Çevrimiçi modda hile kodu.', en: 'Cheat codes in the online mode.' },
    codes: {}, status: 'debunked', updatedAt: NOW,
    notes: { tr: 'GTA Online\'da hiçbir zaman hile kodu olmadı. "Online para hilesi" vaat eden her şey dolandırıcılık ya da ban riski.', en: 'GTA Online never had cheat codes. Anything promising "online money cheats" is a scam or a ban risk.' },
  },
];

export const SEED_MISSIONS: Mission[] = [];

export const SEED_GUIDES: Guide[] = [
  {
    id: 'g-launch-checklist', slug: 'launch-checklist', category: 'launch', status: 'verified', updatedAt: NOW,
    title: { tr: 'Çıkış Günü Kontrol Listesi', en: 'Launch Day Checklist' },
    summary: { tr: '19 Kasım\'da ilk saatte oynamak için yapman gerekenler.', en: 'What to do to be playing in the first hour on November 19.' },
    body: [
      { tr: 'GTA VI 19 Kasım 2026\'da PS5 ve Xbox Series X|S için çıkıyor. PC sürümü için tarih açıklanmadı.', en: 'GTA VI launches November 19, 2026 on PS5 and Xbox Series X|S. No PC date has been announced.' },
      { tr: 'Ön yükleme açıldıysa hemen başlat. Oyun büyük; çıkış gecesi indirme kuyruğuna girmek saatler kaybettirir.', en: 'If preload is open, start it now. The game is large; downloading on launch night can cost hours.' },
      { tr: 'Konsolda boş alanı kontrol et. Güncellemeler için oyun boyutunun üstünde pay bırak.', en: 'Check free storage on your console. Leave headroom above the game size for day-one updates.' },
      { tr: 'Bildirimleri aç. Çıkışla birlikte doğruladığımız ilk hile ve görev taktiklerini anında alırsın.', en: 'Turn on notifications. You will get the first verified cheats and mission tactics as we confirm them.' },
    ],
  },
  {
    id: 'g-mission-skip', slug: 'mission-skip-explained', category: 'tricks', status: 'unverified', updatedAt: NOW,
    title: { tr: 'Görev Atlama Nasıl Çalışır?', en: 'How Mission Skipping Works' },
    summary: { tr: 'GTA V\'deki sistem ve GTA VI\'da beklediklerimiz.', en: 'The GTA V system and what we expect in GTA VI.' },
    body: [
      { tr: 'GTA V\'de bir görevi üç kez başarısız olunca "Görevi Atla" seçeneği çıkıyordu. Atlanan görevde altın madalya alınamıyordu ama hikaye ilerliyordu.', en: 'In GTA V, failing a mission three times unlocked a "Skip Mission" option. Skipped missions could not earn gold, but the story continued.' },
      { tr: 'Kontrol noktaları görev içinde otomatik kaydediyordu; ölünce en son noktadan başlıyordun.', en: 'Checkpoints saved automatically within missions; dying restarted you at the last one.' },
      { tr: 'GTA VI için beklentimiz benzer bir sistem. Çıkış günü ilk denediğimiz şeylerden biri bu olacak; doğrulayınca bu rehber "Doğrulandı" olur.', en: 'We expect a similar system in GTA VI. It is one of the first things we will test at launch; this guide flips to Verified once confirmed.' },
    ],
  },
  {
    id: 'g-how-we-verify', slug: 'how-we-verify', category: 'launch', status: 'verified', updatedAt: NOW,
    title: { tr: 'Nasıl Doğruluyoruz?', en: 'How We Verify' },
    summary: { tr: 'Bu uygulamada "Doğrulandı" rozeti ne anlama geliyor.', en: 'What the Verified badge means in this app.' },
    body: [
      { tr: 'Her kodu ve taktiği oyunun perakende sürümünde kendimiz deniyoruz. Ekran kaydı alıyoruz.', en: 'We try every code and tactic ourselves on a retail copy and record the screen.' },
      { tr: 'Çalışan içerik "Doğrulandı", çalışmayan "Yalanlandı" olur. Kaynağı belirsiz olanlar "Söylenti" olarak kalır.', en: 'Working content becomes Verified, failing content becomes Debunked. Unclear sources stay Rumor.' },
      { tr: 'Çıkıştan önce gördüğün hiçbir hile kodu gerçek değil. Rockstar GTA VI için hile açıklamadı.', en: 'No cheat code you see before launch is real. Rockstar has not announced cheats for GTA VI.' },
    ],
  },
];

export const SEED_LOCATIONS: MapLocation[] = [
  { id: 'l-vice-city', slug: 'vice-city', type: 'city', x: 72, y: 70, status: 'verified', updatedAt: NOW,
    name: { tr: 'Vice City', en: 'Vice City' },
    description: { tr: 'Leonida\'nın neon kalbi. Fragmanlarda ve resmi sitede gösterilen ana şehir.', en: 'The neon heart of Leonida. The main city shown in trailers and on the official site.' } },
  { id: 'l-leonida-keys', slug: 'leonida-keys', type: 'region', x: 55, y: 90, status: 'verified', updatedAt: NOW,
    name: { tr: 'Leonida Keys', en: 'Leonida Keys' },
    description: { tr: 'Güneydeki ada zinciri. Tekne, dalış ve kıyı yaşamı.', en: 'The island chain to the south. Boats, diving and coastal life.' } },
  { id: 'l-grassrivers', slug: 'grassrivers', type: 'region', x: 45, y: 62, status: 'verified', updatedAt: NOW,
    name: { tr: 'Grassrivers', en: 'Grassrivers' },
    description: { tr: 'Bataklıklar ve timsahlar. Airboat bölgesi.', en: 'Swamps and alligators. Airboat country.' } },
  { id: 'l-port-gellhorn', slug: 'port-gellhorn', type: 'city', x: 22, y: 28, status: 'verified', updatedAt: NOW,
    name: { tr: 'Port Gellhorn', en: 'Port Gellhorn' },
    description: { tr: 'Kuzeybatıdaki liman kasabası. Motel ve barlar.', en: 'Port town in the northwest. Motels and bars.' } },
  { id: 'l-ambrosia', slug: 'ambrosia', type: 'region', x: 40, y: 18, status: 'verified', updatedAt: NOW,
    name: { tr: 'Ambrosia', en: 'Ambrosia' },
    description: { tr: 'Kuzeyde sanayi ve tarım bölgesi.', en: 'Industrial and farming region in the north.' } },
  { id: 'l-mount-kalaga', slug: 'mount-kalaga', type: 'landmark', x: 60, y: 12, status: 'verified', updatedAt: NOW,
    name: { tr: 'Mount Kalaga', en: 'Mount Kalaga' },
    description: { tr: 'Kuzeydeki milli park ve dağlık alan.', en: 'National park and mountain area in the north.' } },
  { id: 'l-hamlet', slug: 'hamlet', type: 'city', x: 30, y: 45, status: 'verified', updatedAt: NOW,
    name: { tr: 'Hamlet', en: 'Hamlet' },
    description: { tr: 'Küçük iç bölge kasabası.', en: 'Small inland town.' } },
];

export const SEED_UPDATES: ContentUpdate[] = [
  {
    id: 'u-0001', kind: 'news', createdAt: NOW,
    title: { tr: 'Leonida Codes hazır', en: 'Leonida Codes is live' },
    body: { tr: '19 Kasım\'da oyunla birlikte doğrulama başlıyor. İlk doğrulanan hile için bildirimleri aç.', en: 'Verification starts with the game on November 19. Turn on notifications for the first verified cheat.' },
  },
];
