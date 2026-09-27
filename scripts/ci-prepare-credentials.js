/**
 * CI yardımcı script'i (GitHub Actions için).
 * - App Store Connect API anahtarını (.p8) repo köküne yazar — SADECE secret varsa.
 * - eas.json submit profilini API anahtarıyla doldurur — SADECE tüm ASC secret'ları varsa.
 * - EXPO_PUBLIC_* secret'larını eas.json build profillerinin env alanına yazar (varsa).
 *
 * ASC secret'ları yoksa hata vermez: EAS sunucusunda kayıtlı olan App Store Connect
 * API anahtarı (eas submit ile daha önce kaydedilmiş) non-interactive submit'te
 * otomatik kullanılır. Bu dosya gizli bilgi İÇERMEZ.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const easPath = path.join(root, 'eas.json');

const ascKeys = ['ASC_API_KEY_P8', 'ASC_KEY_ID', 'ASC_ISSUER_ID', 'APPLE_TEAM_ID'];
const haveAllAsc = ascKeys.every((k) => !!process.env[k]);

if (haveAllAsc) {
  // 1) .p8 dosyasını yaz
  const p8 = process.env.ASC_API_KEY_P8.replace(/\\n/g, '\n');
  const p8Path = path.join(root, 'asc_api_key.p8');
  fs.writeFileSync(p8Path, p8.endsWith('\n') ? p8 : p8 + '\n');
  console.log('✓ asc_api_key.p8 yazıldı');

  // 2) eas.json submit profilini doldur
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

// 3) EXPO_PUBLIC_* değişkenleri (opsiyonel — sadece tanımlıysa).
//    .env gitignore'da olduğu için EAS sunucusuna yüklenmez; bu yüzden değerler
//    eas.json build profillerinin env alanına yazılır. EAS CLI bu env'i build
//    sunucusuna iletir, Metro paketlerken koda gömer.
const publicKeys = [
  'EXPO_PUBLIC_GOOGLE_PLACES_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_POSTHOG_KEY',
];
const provided = publicKeys.filter((k) => !!process.env[k]);
if (provided.length) {
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  for (const profile of Object.values(eas.build || {})) {
    profile.env = profile.env || {};
    for (const k of provided) profile.env[k] = process.env[k];
  }
  fs.writeFileSync(easPath, JSON.stringify(eas, null, 2) + '\n');
  console.log(`✓ eas.json build env güncellendi: ${provided.join(', ')}`);
} else {
  console.log('ℹ EXPO_PUBLIC_* secret yok — Google Places kapalı, gömülü klinik verisiyle build');
}
