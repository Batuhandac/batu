#!/usr/bin/env node
// OpenStreetMap'teki Türkiye veteriner kliniklerini (amenity=veterinary) çekip
// lib/data/clinics.ts dosyasını üretir — uygulamanın çevrimdışı klinik listesi.
//
// Veri: © OpenStreetMap katkıcıları, ODbL 1.0 — https://www.openstreetmap.org/copyright
// Uygulamada bu veri gösterilirken "© OpenStreetMap katkıcıları" atfı zorunlu.
//
// Kullanım:
//   node scripts/gen-clinics-osm.js                 # Overpass API'den indir
//   node scripts/gen-clinics-osm.js --input x.json  # kayıtlı Overpass yanıtından üret
// GitHub Actions'ta aylık çalışır: .github/workflows/update-clinic-data.yml
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'lib', 'data', 'clinics.ts');
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="TR"][admin_level=2]->.tr;
(
  nwr["amenity"="veterinary"](area.tr);
  nwr["healthcare"="veterinary"](area.tr);
);
out center tags;`;
// Veri kaybını önle: Overpass eksik yanıt verirse mevcut dosyanın üzerine yazma
const MIN_EXPECTED = 200;

async function download() {
  let lastErr;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'pati-sos-data/1.0 (https://github.com/Batuhandac/pati-sos)',
        },
        body: 'data=' + encodeURIComponent(QUERY),
      });
      if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
      const json = await res.json();
      if (json.remark && /error|timed out/i.test(json.remark)) throw new Error(`${url} → ${json.remark}`);
      console.log(`✓ ${url}: ${json.elements?.length ?? 0} öğe`);
      return json;
    } catch (e) {
      lastErr = e;
      console.warn(`✗ ${e.message}`);
    }
  }
  throw lastErr;
}

const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ') : null);
const first = (v) => clean(v ? v.split(';')[0] : null);

function trLower(s) {
  return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

function toSeed(el) {
  const t = el.tags || {};
  const name = clean(t.name) || clean(t['name:tr']);
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!name || typeof lat !== 'number' || typeof lng !== 'number') return null;
  // Kapanmış / terk edilmiş işaretliyse alma
  if (t.disused === 'yes' || t['disused:amenity'] || t.abandoned === 'yes' || t.end_date) return null;

  const street = clean(t['addr:street']);
  const no = clean(t['addr:housenumber'])?.replace(/\s*;\s*/g, ', ') ?? null;
  const address =
    clean(t['addr:full']) ||
    [clean(t['addr:neighbourhood']) || clean(t['addr:suburb']), street && (no ? `${street} No:${no}` : street)]
      .filter(Boolean)
      .join(', ') ||
    null;

  const province = clean(t['addr:province']);
  const cityTag = clean(t['addr:city']);
  // Türkiye'de addr:city bazen il, bazen ilçe olarak girilmiş
  const district = clean(t['addr:district']) || (province && cityTag && cityTag !== province ? cityTag : null);
  const city = province || cityTag;

  const opening = clean(t.opening_hours);
  const nameL = trLower(name);
  const emergency =
    t.emergency === 'yes' ||
    /acil|7\s*\/\s*24|24 saat|nöbetçi/.test(nameL) ||
    opening === '24/7';

  return {
    id: `osm-${el.type[0]}${el.id}`,
    name,
    address,
    district,
    city,
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    phone: first(t.phone) || first(t['contact:phone']) || first(t['contact:mobile']) || first(t.mobile),
    opening_hours: opening,
    emergency,
  };
}

function render(clinics) {
  const lines = clinics.map((c) => '  ' + JSON.stringify(c) + ',');
  return `// OTOMATİK ÜRETİLDİ — elle düzenleme. Yeniden üret: node scripts/gen-clinics-osm.js
// Veri: © OpenStreetMap katkıcıları, ODbL 1.0 — https://www.openstreetmap.org/copyright
// ${clinics.length} veteriner kliniği (Türkiye, amenity=veterinary)
import type { SeedClinic } from './types';

export const CLINICS: SeedClinic[] = [
${lines.join('\n')}
];
`;
}

async function main() {
  const i = process.argv.indexOf('--input');
  const json = i > -1 ? JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf8')) : await download();

  const byId = new Map();
  for (const el of json.elements || []) {
    const c = toSeed(el);
    if (c && !byId.has(c.id)) byId.set(c.id, c);
  }
  const clinics = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  if (i === -1 && clinics.length < MIN_EXPECTED) {
    throw new Error(`Sadece ${clinics.length} klinik geldi (beklenen ≥ ${MIN_EXPECTED}) — dosya değiştirilmedi.`);
  }

  fs.writeFileSync(OUT, render(clinics));
  const withPhone = clinics.filter((c) => c.phone).length;
  const withHours = clinics.filter((c) => c.opening_hours).length;
  console.log(`✓ ${OUT}: ${clinics.length} klinik · telefonlu ${withPhone} · saatli ${withHours}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
