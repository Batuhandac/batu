#!/usr/bin/env node
// Veteriner hekimleri odalarının herkese açık muayenehane / poliklinik / hayvan
// hastanesi listelerini indirip adreslerini konuma çevirir ve
// lib/data/chamberClinics.ts dosyasını üretir. OpenStreetMap'te olmayan pek çok
// klinik (ör. mahalle muayenehaneleri) böylece çevrimdışı listede de görünür.
//
// Kişisel veri almaz: sorumlu hekimin adı-soyadı kaydedilmez; yalnızca işletme
// adı, telefonu ve adresi. Konum, adresten OpenStreetMap Nominatim ile bulunur
// (en fazla saniyede bir istek; bulunan konumlar scripts/data/geocode-cache.json
// dosyasında saklanır, sonraki çalıştırmada yalnızca yeni adresler sorulur).
//
// Kullanım:
//   node scripts/gen-clinics-chamber.js            # indir, konumla, üret
//   node scripts/gen-clinics-chamber.js --limit 20 # ilk 20 klinikle dene (dosya yazılmaz)
//   node scripts/gen-clinics-chamber.js --retry-failed # bulunamayan adresleri yeniden sor
//   node scripts/gen-clinics-chamber.js --cache-only   # istek atmadan, önbellekteki konumlarla
// GitHub Actions'ta aylık çalışır: .github/workflows/update-clinic-data.yml
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'lib', 'data', 'chamberClinics.ts');
const CACHE = path.join(__dirname, 'data', 'geocode-cache.json');
const UA = 'Patiport-data/1.0 (+https://github.com/Batuhandac/batu)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const GAP_MS = 1100; // Nominatim kullanım politikası: saniyede en fazla 1 istek

// Oda başına: listelerin adresi, ilin adı ve uygulamada gösterilecek kaynak adı.
// Yeni bir odanın listesi aynı biçimdeyse buraya eklemek yeter.
const CHAMBERS = [
  {
    key: 'ank',
    city: 'Ankara',
    label: 'Ankara Veteriner Hekimleri Odası',
    // Adres sonundaki "İlçe/Ankara" bazen bitişik yazılmış ("No:67/AYenimahalle/Ankara")
    districts: [
      'Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ',
      'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören',
      'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle',
    ],
    pages: [
      { url: 'https://www.avho.org.tr/muayenehaneler/', type: 'VM' },
      { url: 'https://www.avho.org.tr/poliklinikler/', type: 'VP' },
      { url: 'https://www.avho.org.tr/hayvan-hastaneleri/', type: 'HH' },
    ],
    // Liste eksik gelirse (site değişti, yarım yanıt) mevcut dosyayı koru
    minRows: 400,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Liste okuma ────────────────────────────────────────────────────────────
const ENTITIES = { '&amp;': '&', '&#8211;': '-', '&#8217;': '’', '&#8216;': '‘', '&#038;': '&', '&nbsp;': ' ', '&quot;': '"' };
function text(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#?\w+;/g, (e) => ENTITIES[e] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tablo satırları: [ad, sorumlu hekim, telefon, adres]. Başlık satırları atlanır. */
function parseRows(html) {
  const rows = [];
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => text(m[1]));
    if (cells.length < 4 || /Adı$/i.test(cells[0]) || !cells[0] || !cells[3]) continue;
    rows.push({ name: cells[0], phone: cells[2], address: cells[3] });
  }
  return rows;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

// ─── Ad, telefon, adres düzenleme ──────────────────────────────────────────
const TYPE_SUFFIX = { VM: 'Veteriner Muayenehanesi', VP: 'Veteriner Polikliniği', HH: 'Hayvan Hastanesi' };

/** "Vetmagic VM" → "Vetmagic Veteriner Muayenehanesi". Kişi adı gibi görünen kaydı atlar. */
function cleanName(raw, pageType = 'VM') {
  const name = raw.replace(/\s+/g, ' ').trim();
  const m = name.match(/^(.*?)\s*\b(VM|VP|HH)$/);
  // Türü yazılmamış ve SOYADI büyük harfle: listede işletme adı yerine hekimin
  // adı yazılmış demektir; kişisel veri almamak için atla.
  if (!m && /\s[A-ZÇĞİÖŞÜ]{2,}$/.test(name) && !/hastane|klini|veteriner/i.test(name)) return null;
  const base = m ? m[1].trim() : name;
  const type = m ? m[2] : pageType;
  if (!base) return TYPE_SUFFIX[type];
  if (type === 'HH') return /hastane/i.test(base) ? base : `${base} ${TYPE_SUFFIX.HH}`;
  // Adında zaten tür geçiyorsa tekrar etme ("Delta Veteriner Sağlık Merkezi")
  if (/veteriner|hastane|klini[kğ]|poliklini/i.test(base)) return base;
  return `${base} ${TYPE_SUFFIX[type]}`;
}

/** "0532 637 27 41" / "0 312 995 05 25" → "+90 532 637 27 41" */
function cleanPhone(raw) {
  const d = (raw || '').replace(/\D/g, '').replace(/^0+/, '').replace(/^90(?=\d{10}$)/, '');
  if (d.length !== 10) return null;
  return `+90 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

// Kısaltmadan sonra boşluk, rakam ya da bitişik "No:" gelebilir ("Cad.No:41")
const END = String.raw`(?=[\s\d,]|N[oO]?\s*[:.]|$)`;
const ABBR = [
  [new RegExp(String.raw`\bMah\.?` + END, 'g'), 'Mahallesi '],
  [new RegExp(String.raw`\bCa?d\.?` + END, 'g'), 'Caddesi '],
  [new RegExp(String.raw`\bSo?k\.?` + END, 'g'), 'Sokak '],
  [new RegExp(String.raw`\bBu?lv?\.?` + END, 'g'), 'Bulvarı '],
];

/**
 * "Bağlıca Mah. Mermeroğlu Cad. No:61/2A Etimesgut/Ankara" →
 * { mahalle: "Bağlıca", street: "Mermeroğlu Caddesi", no: "61", door: "61/2A",
 *   district: "Etimesgut", display: "Bağlıca Mahallesi, Mermeroğlu Caddesi No:61/2A" }
 */
function parseAddress(raw, city, districts = []) {
  let a = raw.replace(/\s+/g, ' ').trim();
  let district = null;
  const known = districts.length ? a.match(new RegExp(`(${districts.join('|')})\\s*/\\s*${city}\\s*$`, 'i')) : null;
  const tail = known ?? a.match(/\s*([^\s/]+)\s*\/\s*([^\s/]+)\s*$/);
  if (tail && (known || tail[2].toLocaleLowerCase('tr') === city.toLocaleLowerCase('tr'))) {
    district = tail[1];
    a = a.slice(0, tail.index).trim();
  }
  a = a.replace(/(?<!\p{L})Şht\.\s*/gu, 'Şehit ');
  a = a.replace(/\b(Mah|Cad|Sok|Bulv|Blv)\.(?=\p{Lu})/gu, '$1. '); // "Mah.Akıncılar" → "Mah. Akıncılar"
  a = a.replace(/(\d+\.)(?=[A-Za-zÇĞİÖŞÜçğıöşü])/g, '$1 '); // "655.Sok." → "655. Sok."
  for (const [re, full] of ABBR) a = a.replace(re, full);
  // Numaralı caddeler OpenStreetMap'te "1408. Cadde" diye yazılır
  a = a
    .replace(/(?<![\d./])(\d+) (Caddesi|Sokak)\b/g, '$1. $2') // "142 Cad." → "142. Cadde"
    .replace(/(\d+\.) Caddesi/g, '$1 Cadde')
    .replace(/\s+/g, ' ')
    .trim();

  const mah = a.match(/^(.+?) Mahallesi\b/);
  const mahalle = mah ? mah[1].trim() : null;
  const rest = mah ? a.slice(mah[0].length).trim() : a;
  // \\b Türkçe harflerde (ı) çalışmaz; sonrasını boşlukla sına
  const st = rest.match(/^(.+?\s(?:Caddesi|Cadde|Sokak|Bulvarı|Yolu|Meydanı))(?=[\s,]|$)/);
  const street = st ? st[1].trim() : null;
  const noM = a.match(/\bN(?:o)?\s*[:.]?\s*(\d+)\s*([^\s,]*)/i) || rest.match(/(?:Caddesi|Sokak|Bulvarı)\s+(\d+)([^\s,]*)/);
  const no = noM ? noM[1] : null;
  const door = noM ? (noM[1] + (noM[2] || '')).replace(/^(\d+)(?=[A-Za-zÇĞİÖŞÜçğıöşü])/, '$1') : null;

  // Uygulamada gösterilecek adres: "Mahalle Mahallesi, Sokak No:12/A"
  const display = mahalle
    ? `${mahalle} Mahallesi, ${rest.replace(/\s*\bN(?:o)?\s*[:.]?\s*(\d)/i, ' No:$1').trim()}`
    : a.replace(/\s*\bN(?:o)?\s*[:.]?\s*(\d)/i, ' No:$1');
  return { mahalle, street, no, door, district, display: display.replace(/\s+/g, ' ').trim() };
}

// ─── Konumlama ──────────────────────────────────────────────────────────────
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch {
    return {};
  }
}
function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b, 'tr')));
  fs.writeFileSync(CACHE, JSON.stringify(sorted, null, 1) + '\n');
}

const fold = (s) =>
  (s || '')
    .replace(/[âÂ]/g, 'a') // "Balâ" = "Bala"
    .replace(/[îÎ]/g, 'i')
    .replace(/[ûÛ]/g, 'u')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');

let lastRequest = 0;
async function nominatim(q, extra = '') {
  const wait = lastRequest + GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  const url = `${NOMINATIM}?format=jsonv2&addressdetails=1&limit=10&countrycodes=tr&accept-language=tr${extra}&q=${encodeURIComponent(q)}`;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      if (i === 2) throw e;
      await sleep(5000 * (i + 1));
    }
  }
  return [];
}

// Sonucun istenen ilçe ve ilde olduğunu doğrula (aynı adlı cadde başka ilçede de olabilir)
function inPlace(r, district, city) {
  const vals = Object.values(r.address || {}).map(fold);
  const okCity = vals.includes(fold(city));
  const okDistrict = !district || vals.includes(fold(district));
  return okCity && okDistrict;
}

const AREA_TYPES = ['suburb', 'neighbourhood', 'quarter', 'village', 'hamlet', 'town', 'residential', 'city_district'];
const round6 = (n) => Math.round(Number(n) * 1e6) / 1e6;

function km(aLat, aLng, bLat, bLng) {
  const r = (x) => (x * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// "Y. Bahçelievler" → "Yukarı Bahçelievler", "GOP" → "Gaziosmanpaşa"
function mahalleName(m) {
  return m.replace(/^Y\.\s*/, 'Yukarı ').replace(/^A\.\s*/, 'Aşağı ').replace(/^GOP$/, 'Gaziosmanpaşa');
}

// Sokak adının ayırt edici kısmı: "Mermeroğlu Caddesi" → "mermeroglu", "3408. Cadde" → "3408"
function streetCore(street) {
  return fold(street.replace(/(?<!\p{L})(Caddesi|Cadde|Sokak|Sokağı|Bulvarı|Yolu|Meydanı|Şehit|Prof|Dr)(?!\p{L})\.?/gu, ' '));
}

/** Mahallenin merkezi ve sınır kutusu (aynı mahalle bir kez sorulur). */
const areaMemo = new Map();
async function findArea(mahalle, district, city) {
  const key = `${mahalle}|${district}|${city}`;
  if (areaMemo.has(key)) return areaMemo.get(key);
  const name = mahalleName(mahalle);
  const want = fold(name).slice(0, 6);
  // OpenStreetMap'te mahalle adı bazen bitişik yazılır: "Yıldız Evler" → "Yıldızevler"
  const variants = [name, ...(name.includes(' ') ? [name.replace(/\s+/g, '')] : [])];
  let found = null;
  for (const v of variants) {
    for (const r of await nominatim(`${v} Mahallesi, ${district}, ${city}`)) {
      if (!inPlace(r, district, city)) continue;
      const isArea = AREA_TYPES.includes(r.addresstype) || r.category === 'boundary' || r.category === 'place';
      if (!isArea || !fold(r.name).includes(want)) continue;
      const [s, n, w, e] = (r.boundingbox || []).map(Number);
      found = { lat: round6(r.lat), lng: round6(r.lon), bbox: Number.isFinite(s) ? [s, n, w, e] : null };
      break;
    }
    if (found) break;
  }
  if (!found) {
    for (const f of await photon(`${name} Mahallesi, ${district}, ${city}`)) {
      const pr = f.properties || {};
      if ((pr.type !== 'district' && pr.type !== 'locality') || !photonInPlace(pr, district, city)) continue;
      if (!fold(pr.name).includes(want)) continue;
      const [lng, lat] = f.geometry.coordinates;
      const ext = pr.extent; // [w, n, e, s]
      found = { lat: round6(lat), lng: round6(lng), bbox: ext ? [ext[3], ext[1], ext[0], ext[2]] : null };
      break;
    }
  }
  areaMemo.set(key, found);
  return found;
}

// Photon (komoot): OpenStreetMap tabanlı, yazım farklarına daha toleranslı arama.
// Nominatim bulamadığında yedek olarak kullanılır.
const PHOTON = 'https://photon.komoot.io/api/';
async function photon(q) {
  const wait = lastRequest + GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  try {
    const res = await fetch(`${PHOTON}?limit=8&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) return [];
    return (await res.json()).features || [];
  } catch {
    return [];
  }
}
function photonInPlace(pr, district, city) {
  const vals = [pr.city, pr.county, pr.district, pr.state].map(fold);
  return vals.includes(fold(city)) && (!district || vals.some((v) => v.includes(fold(district))));
}

/**
 * Adresi konuma çevirir. Önce mahalle bulunur; sokak yalnızca o mahallenin
 * içinde (biraz payla) aranır ki uzun caddelerde ya da aynı numaralı sokakların
 * başka mahallelerde olmasında yanlış yere düşmesin. Sokak bulunamazsa mahalle
 * merkezi kullanılır. approx: null (kapı numarası), 'street' ya da 'area'.
 */
async function geocode(p, city) {
  const area = p.mahalle && p.district ? await findArea(p.mahalle, p.district, city) : null;
  if (p.street) {
    const core = streetCore(p.street);
    let extra = '';
    if (area) {
      const pad = 0.006; // ≈ 600 m
      const [s, n, w, e] = area.bbox && area.bbox[1] - area.bbox[0] < 0.08 ? area.bbox : [area.lat, area.lat, area.lng, area.lng];
      extra = `&bounded=1&viewbox=${w - pad},${n + pad},${e + pad},${s - pad}`;
    }
    const q = `${p.street}${p.no ? ` ${p.no}` : ''}, ${p.district ?? ''}, ${city}`;
    const hits = (await nominatim(q, extra)).filter(
      (r) => inPlace(r, p.district, city) && core && fold(r.address?.road ?? r.name).includes(core)
    );
    if (hits.length) {
      const house = hits.find((r) => r.address?.house_number && p.no && r.address.house_number.split(/[^0-9]/)[0] === p.no);
      // Aynı caddenin parçalarından mahalleye en yakını
      const best = house ?? (area ? hits.sort((a, b) => km(area.lat, area.lng, a.lat, a.lon) - km(area.lat, area.lng, b.lat, b.lon))[0] : area ? null : hits[0]);
      // Mahalle bulunamadıysa caddenin hangi ucunda olduğu bilinmez: yalnızca "yakın" say
      if (best) return { lat: round6(best.lat), lng: round6(best.lon), approx: house ? null : area ? 'street' : 'area' };
    }
  }
  if (p.street && area) {
    // Nominatim'de sokak yok; Photon'da mahallenin yakınında ara
    const core = streetCore(p.street);
    const hits = (await photon(`${p.street}${p.no ? ` ${p.no}` : ''}, ${p.district ?? ''}, ${city}`)).filter((f) => {
      const pr = f.properties || {};
      if (!photonInPlace(pr, p.district, city) || !core) return false;
      const [lng, lat] = f.geometry.coordinates;
      return fold(pr.street ?? pr.name).includes(core) && km(area.lat, area.lng, lat, lng) < 2;
    });
    if (hits.length) {
      const [lng, lat] = hits[0].geometry.coordinates;
      const house = hits[0].properties.housenumber?.split(/[^0-9]/)[0] === p.no;
      return { lat: round6(lat), lng: round6(lng), approx: house ? null : 'street' };
    }
  }
  if (area) return { lat: area.lat, lng: area.lng, approx: 'area' };
  return null;
}

// ─── Üretim ─────────────────────────────────────────────────────────────────
/**
 * Aynı mahalle merkezine düşen klinikler haritada üst üste binmesin: aynı
 * noktadakileri ~40 m yarıçaplı küçük bir halkaya dizer (hepsi zaten "yaklaşık").
 */
function spreadStacked(clinics) {
  const groups = new Map();
  for (const c of clinics) {
    const k = `${c.lat},${c.lng}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.forEach((c, i) => {
      const a = (2 * Math.PI * i) / group.length;
      const r = 0.00035 * (1 + Math.floor(i / 12) * 0.6);
      c.lat = Math.round((c.lat + r * Math.sin(a)) * 1e6) / 1e6;
      c.lng = Math.round((c.lng + (r * Math.cos(a)) / Math.cos((c.lat * Math.PI) / 180)) * 1e6) / 1e6;
      c.approx = c.approx ?? 'street';
    });
  }
}

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const trLower = (s) => s.toLocaleLowerCase('tr');

function render(clinics, chambers) {
  const labels = Object.fromEntries(chambers.map((c) => [c.key, c.label]));
  const lines = clinics.map((c) => '  ' + JSON.stringify(c) + ',');
  const today = new Date().toISOString().slice(0, 10);
  return `// OTOMATİK ÜRETİLDİ — elle düzenleme. Yeniden üret: node scripts/gen-clinics-chamber.js
// Kaynak: veteriner hekimleri odalarının herkese açık klinik listeleri
// (${chambers.map((c) => c.label).join(', ')}). Konumlar adresten bulunmuştur:
// © OpenStreetMap katkıcıları (Nominatim), ODbL 1.0. Hekim adları alınmaz.
// ${clinics.length} klinik · güncelleme: ${today}
import type { SeedClinic } from './types';

export const CHAMBER_LABELS: Record<string, string> = ${JSON.stringify(labels)};

export const CHAMBER_CLINICS: SeedClinic[] = [
${lines.join('\n')}
];
`;
}

function currentCount() {
  try {
    return fs.readFileSync(OUT, 'utf8').split('\n').filter((l) => l.startsWith('  {')).length;
  } catch {
    return 0;
  }
}

async function main() {
  // --cache-only: yalnızca daha önce konumlanmış adreslerle üret, yeni istek atma
  const cacheOnly = process.argv.includes('--cache-only');
  const li = process.argv.indexOf('--limit');
  const limit = li > -1 ? Number(process.argv[li + 1]) : Infinity;
  const cache = loadCache();
  // Önceki çalıştırmada konumu bulunamayan adresleri yeniden sor
  if (process.argv.includes('--retry-failed')) {
    for (const k of Object.keys(cache)) if (cache[k] === null) delete cache[k];
  }
  const out = [];
  const stats = { rows: 0, skipped: 0, house: 0, street: 0, area: 0, failed: 0, asked: 0 };
  const failed = [];

  for (const ch of CHAMBERS) {
    const rows = [];
    for (const page of ch.pages) {
      const got = parseRows(await fetchText(page.url)).map((r) => ({ ...r, type: page.type }));
      console.log(`✓ ${page.url}: ${got.length} satır`);
      rows.push(...got);
    }
    if (rows.length < ch.minRows && limit === Infinity && !cacheOnly) {
      throw new Error(`${ch.label}: yalnızca ${rows.length} satır (beklenen ≥ ${ch.minRows}) — dosya değiştirilmedi.`);
    }
    const ids = new Set();
    for (const row of rows.slice(0, limit)) {
      stats.rows++;
      const name = cleanName(row.name, row.type);
      // At hastanesi gibi evcil hayvana bakmayan yerleri alma
      if (!name || /\bat hastanesi\b/i.test(trLower(name))) {
        stats.skipped++;
        continue;
      }
      const p = parseAddress(row.address, ch.city, ch.districts);
      const key = `${ch.key}|${row.address}`;
      if (!(key in cache) && cacheOnly) {
        stats.skipped++;
        continue;
      }
      if (!(key in cache)) {
        stats.asked++;
        cache[key] = await geocode(p, ch.city);
        if (stats.asked % 25 === 0) {
          saveCache(cache);
          console.log(`  … ${stats.asked} adres soruldu`);
        }
      }
      const loc = cache[key];
      if (!loc) {
        stats.failed++;
        failed.push(`${name} — ${row.address}`);
        continue;
      }
      stats[loc.approx ?? 'house']++;
      let id = `vho-${ch.key}-${djb2(trLower(`${name}|${p.district ?? ''}`))}`;
      while (ids.has(id)) id += 'x';
      ids.add(id);
      out.push({
        id,
        name,
        address: p.display,
        district: p.district,
        city: ch.city,
        lat: loc.lat,
        lng: loc.lng,
        phone: cleanPhone(row.phone),
        opening_hours: null,
        emergency: /acil|7\s*\/\s*24|24 saat|nöbetçi/.test(trLower(name)),
        source: 'chamber',
        ...(loc.approx ? { approx: loc.approx } : {}),
      });
    }
  }
  if (!cacheOnly) saveCache(cache);
  out.sort((a, b) => a.id.localeCompare(b.id));
  spreadStacked(out);

  console.log(
    `✓ ${out.length} klinik · kapı no ${stats.house} · cadde ${stats.street} · mahalle ${stats.area} · bulunamadı ${stats.failed} · atlandı ${stats.skipped} · yeni sorgu ${stats.asked}`
  );
  if (failed.length) console.log('Konumu bulunamayanlar:\n  ' + failed.join('\n  '));
  if (limit !== Infinity) {
    console.log(JSON.stringify(out.slice(0, 5), null, 1));
    return;
  }
  const before = currentCount();
  if (before && out.length < before * 0.8 && !cacheOnly) {
    throw new Error(`Yalnızca ${out.length} klinik (mevcut ${before}) — dosya değiştirilmedi.`);
  }
  // Kayıtlar aynıysa dosyaya dokunma (yalnızca tarih değişip boş commit olmasın)
  const body = (src) => src.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  const next = render(out, CHAMBERS);
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (body(prev) === body(next)) {
    console.log('ℹ Oda listelerinde değişiklik yok.');
    return;
  }
  fs.writeFileSync(OUT, next);
  console.log(`✓ ${OUT}`);
}

module.exports = { cleanName, cleanPhone, parseAddress, parseRows, geocode };

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
