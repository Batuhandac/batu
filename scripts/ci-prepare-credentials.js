/**
 * CI yardımcı script'i (GitHub Actions için).
 * - App Store Connect API anahtarını (.p8) repo köküne yazar — SADECE secret varsa.
 * - eas.json submit profilini API anahtarıyla doldurur — SADECE tüm ASC secret'ları varsa.
 * - .env dosyasını Supabase/PostHog secret'larından oluşturur (varsa).
 *
 * ASC secret'ları yoksa hata vermez: EAS sunucusunda kayıtlı olan App Store Connect
 * API anahtarı (eas submit ile daha önce kaydedilmiş) non-interactive submit'te
 * otomatik kullanılır. Bu dosya gizli bilgi İÇERMEZ.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();

const ascKeys = ['ASC_API_KEY_P8', 'ASC_KEY_ID', 'ASC_ISSUER_ID', 'APPLE_TEAM_ID'];
const haveAllAsc = ascKeys.every((k) => !!process.env[k]);

if (haveAllAsc) {
  // 1) .p8 dosyasını yaz
  const p8 = process.env.ASC_API_KEY_P8.replace(/\\n/g, '\n');
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
    ascApiKeyId: process.env.ASC_KEY_ID,
    ascApiKeyIssuerId: process.env.ASC_ISSUER_ID,
    appleTeamId: process.env.APPLE_TEAM_ID,
  };
  fs.writeFileSync(easPath, JSON.stringify(eas, null, 2) + '\n');
  console.log('✓ eas.json submit profili güncellendi (CI secret kullanıldı)');
} else {
  console.log('ℹ ASC secret\'ları eksik — EAS sunucusunda kayıtlı API anahtarı kullanılacak (non-interactive submit).');
}

// 3) .env (opsiyonel — sadece tanımlıysa)
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
