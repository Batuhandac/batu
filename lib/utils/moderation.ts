// Topluluk içeriği için cihaz tarafı kontroller: küfür/hakaret filtresi,
// bağlantı engeli ve acil durum belirtisi algılama. Sunucu tarafında son söz
// yönetici moderasyonundadır (bildirimler content_reports koleksiyonuna düşer).

function fold(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function tokens(s: string): string[] {
  return fold(s).split(/[^a-z0-9]+/).filter(Boolean);
}

// Türkçe katlama "sık" ile "sik"i aynı yapar; bu yüzden kısa kökler yalnızca tam
// kelime olarak, uzun kökler kelime başı olarak aranır ("sık sık kusuyor",
// "götürdüm", "tamamına" gibi masum ifadeler yakalanmasın).
const BAD_WORDS = new Set([
  'amk', 'aq', 'got', 'pic', 'ibne', 'gavat', 'yavsak', 'kahpe', 'yarak', 'amcik', 'dalyarak',
]);
const BAD_PREFIXES = ['orospu', 'siktir', 'sikeyim', 'sikerim', 'aminakoy', 'aminako', 'yarrak', 'yarrag', 'pezevenk', 'serefsiz'];
const BAD_PHRASES = [' anani sik ', ' anasini sik ', ' amina ko'];

export function containsProfanity(text: string): boolean {
  const toks = tokens(text);
  if (toks.some((w) => BAD_WORDS.has(w))) return true;
  if (toks.some((w) => BAD_PREFIXES.some((p) => w.startsWith(p)))) return true;
  const joined = ' ' + toks.join(' ') + ' ';
  return BAD_PHRASES.some((p) => joined.includes(p));
}

export function containsLink(text: string): boolean {
  return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|com\.tr|io|app|link|ly)\b)/i.test(text);
}

/** Gönderilmeden önce metni kontrol eder; sorun varsa kullanıcıya gösterilecek mesajı döner. */
export function checkCommunityText(text: string): string | null {
  if (containsProfanity(text)) return 'Metinde uygunsuz bir ifade var. Lütfen saygılı bir dille yeniden yaz.';
  if (containsLink(text)) return 'Toplulukta bağlantı paylaşılamaz. Metni bağlantısız yazabilirsin.';
  return null;
}

// ─── Acil durum belirtisi algılama ───────────────────────────────────────────
// Soru yazan biri aslında acil bir durum anlatıyorsa, yanıt beklemek yerine
// hemen bir veterineri araması gerektiğini söyleriz.
const EMERGENCY_PATTERNS = [
  'zehir', 'yuttu', 'ilac icti', 'cikolata yedi', 'uzum yedi', 'sogan yedi', 'antifriz', 'fare zehri',
  'nefes alam', 'nefes alm', 'nefes darl', 'bogul', 'solugu', 'morar',
  'kaniyor', 'kanama', 'kan kus', 'kanli kus', 'kanli ishal', 'kan geliyor',
  'nobet gec', 'kasiliyor', 'titreyerek yere', 'bayildi', 'bilinci', 'bilincsiz', 'kendinde degil', 'tepki vermiyor',
  'araba carpti', 'arac carpti', 'carpti', 'balkondan', 'pencereden dus', 'yuksekten dus',
  'felc', 'yuruyemiyor', 'arka bacaklari tutmuyor',
  'karni sisti', 'karin sismesi', 'midesi sisti', 'kusmaya calisiyor ama',
  'idrar yapamiyor', 'cis yapamiyor', 'kum kabina gidip',
  'dogum yapamiyor', 'dogumda', 'yavru takildi',
  'sicak carp', 'arabada kaldi', 'ates cok yuksek',
  'goz disari', 'gozu cikti', 'yilan sok', 'ari soktu',
];

export function looksLikeEmergency(text: string): boolean {
  const f = ' ' + tokens(text).join(' ') + ' ';
  return EMERGENCY_PATTERNS.some((p) => f.includes(fold(p)));
}
