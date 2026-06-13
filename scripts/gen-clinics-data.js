// SQL seed dosyasını (supabase/seed_ankara.sql) yerel TS veri dosyasına çevirir.
// Kullanım: node scripts/gen-clinics-data.js
// Çıktı: lib/data/clinics.ts
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'supabase', 'seed_ankara.sql');
const outPath = path.join(__dirname, '..', 'lib', 'data', 'clinics.ts');

const sql = fs.readFileSync(sqlPath, 'utf8');

// INSERT INTO clinics (...) VALUES <rows>; bloğunu yakala
const valuesStart = sql.indexOf('VALUES', sql.indexOf('INSERT INTO clinics'));
const blockEnd = sql.indexOf(';', valuesStart);
let block = sql.slice(valuesStart + 'VALUES'.length, blockEnd);

// SQL yorumlarını (-- ... satır sonu) string dışındayken ayıkla —
// yorumlardaki parantezler/virgüller parser'ı bozuyor
(function stripComments() {
  let out = '', inStr = false;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch === "'") { inStr = !inStr; out += ch; continue; }
    if (!inStr && ch === '-' && block[i + 1] === '-') {
      while (i < block.length && block[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    out += ch;
  }
  block = out;
})();

// Satır satır: en üst seviyedeki ( ... ) gruplarını parantez sayarak ayır
const rows = [];
let depth = 0, cur = '', inStr = false;
for (let i = 0; i < block.length; i++) {
  const ch = block[i];
  if (ch === "'") {
    // '' kaçışını handle et
    if (inStr && block[i + 1] === "'") { cur += "''"; i++; continue; }
    inStr = !inStr;
    cur += ch;
    continue;
  }
  if (!inStr && ch === '(') { depth++; if (depth === 1) { cur = ''; continue; } }
  if (!inStr && ch === ')') { depth--; if (depth === 0) { rows.push(cur); cur = ''; continue; } }
  if (depth >= 1) cur += ch;
}

// Bir satırı alanlara böl (virgül, string-aware)
function splitFields(row) {
  const fields = [];
  let f = '', inStr = false, d = 0;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === "'") {
      if (inStr && row[i + 1] === "'") { f += "'"; i++; continue; }
      inStr = !inStr; f += ch; continue;
    }
    if (!inStr && ch === '(') d++;
    if (!inStr && ch === ')') d--;
    if (!inStr && ch === ',' && d === 0) { fields.push(f.trim()); f = ''; continue; }
    f += ch;
  }
  if (f.trim()) fields.push(f.trim());
  return fields;
}

function parseStr(s) {
  if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  if (s.toLowerCase() === 'null') return null;
  return s;
}
function parseBool(s) { return s.trim().toLowerCase() === 'true'; }
function parseNum(s) { return s.toLowerCase() === 'null' ? null : parseFloat(s); }

// last_verified_at ifadesini "kaç gün önce" sayısına çevir (null => null)
function parseVerified(s) {
  const t = s.trim().toLowerCase();
  if (t === 'null') return null;
  if (t === 'now()') return 0;
  const m = t.match(/now\(\)\s*-\s*interval\s*'(\d+)\s*days?'/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function slug(name, i) {
  return (
    'ank-' +
    name
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
      .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) +
    '-' + i
  );
}

const clinics = rows.map((row, i) => {
  const f = splitFields(row);
  // (name, address, district, city, lat, lng, phone, is_24_7, accepts_emergency, has_night_shift, is_verified, verification_status, last_verified_at, rating)
  const name = parseStr(f[0]);
  return {
    id: slug(name, i),
    name,
    address: parseStr(f[1]),
    district: parseStr(f[2]),
    city: parseStr(f[3]),
    lat: parseNum(f[4]),
    lng: parseNum(f[5]),
    phone: parseStr(f[6]),
    is_24_7: parseBool(f[7]),
    accepts_emergency: parseBool(f[8]),
    has_night_shift: parseBool(f[9]),
    is_verified: parseBool(f[10]),
    verification_status: parseStr(f[11]),
    verified_days_ago: parseVerified(f[12]),
    rating: parseNum(f[13]),
  };
});

const header = `// OTOMATİK ÜRETİLDİ — elle düzenleme. Kaynak: supabase/seed_ankara.sql
// Yeniden üret: node scripts/gen-clinics-data.js
import type { SeedClinic } from './types';

export const CLINICS: SeedClinic[] = `;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + JSON.stringify(clinics, null, 2) + ';\n');
console.log(`✓ ${clinics.length} klinik yazıldı → lib/data/clinics.ts`);
