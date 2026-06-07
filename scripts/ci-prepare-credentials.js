/**
 * CI yardımcı script'i (GitHub Actions için).
 * - App Store Connect API anahtarını (.p8) repo köküne yazar.
 * - eas.json içindeki submit profilini API anahtarıyla doldurur.
 * - app.json içindeki placeholder projectId'yi temizler (eas init yenisini üretir).
 * - .env dosyasını Supabase/PostHog secret'larından oluşturur (varsa).
 *
 * Bu dosya gizli bilgi İÇERMEZ; tüm değerleri ortam değişkenlerinden okur.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`HATA: ${name} secret'ı boş. GitHub repo → Settings → Secrets'tan ekle.`);
    process.exit(1);
  }
  return v;
}

// 1) .p8 dosyasını yaz
const p8 = need('ASC_API_KEY_P8').replace(/\\n/g, '\n');
const p8Path = path.join(root, 'asc_api_key.p8');
fs.writeFileSync(p8Path, p8.endsWith('\n') ? p8 : p8 + '\n');
console.log('✓ asc_api_key.p8 yazıldı');

// 2) eas.json submit profilini doldur
const easPath = path.join(root, 'eas.json');
const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
eas.submit = eas.submit || {};
eas.submit.production = eas.submit.production || {};
eas.submit.production.ios = {
  ascApiKeyPath: './asc_api_key.p8',
  ascApiKeyId: need('ASC_KEY_ID'),
  ascApiKeyIssuerId: need('ASC_ISSUER_ID'),
  appleTeamId: need('APPLE_TEAM_ID'),
};
fs.writeFileSync(easPath, JSON.stringify(eas, null, 2) + '\n');
console.log('✓ eas.json submit profili güncellendi');

// 3) app.json placeholder projectId temizliği
const appPath = path.join(root, 'app.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
const extra = app.expo && app.expo.extra;
if (extra && extra.eas && extra.eas.projectId === 'YOUR_EAS_PROJECT_ID') {
  delete extra.eas.projectId;
  if (Object.keys(extra.eas).length === 0) delete extra.eas;
  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');
  console.log('✓ Placeholder projectId temizlendi (eas init yenisini üretecek)');
}

// 4) .env (opsiyonel — sadece tanımlıysa)
const envLines = [];
for (const k of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_POSTHOG_KEY']) {
  if (process.env[k]) envLines.push(`${k}=${process.env[k]}`);
}
if (envLines.length) {
  fs.writeFileSync(path.join(root, '.env'), envLines.join('\n') + '\n');
  console.log(`✓ .env yazıldı (${envLines.length} değişken)`);
} else {
  console.log('ℹ .env atlandı (Supabase/PostHog secret yok — demo build)');
}
