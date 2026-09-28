# Patiport → TestFlight (Tek Seferlik Kılavuz)

> ⚠️ TestFlight'a yükleme **senin Apple Developer + Expo (EAS) hesabınla** yapılır.
> Bu adımlar senin bilgisayarında, senin oturumunla çalıştırılır — kimlik bilgileri
> bende yok, bu yüzden son submit adımını sen tetiklemelisin.

## Ön Koşullar (bir kez)

1. **Apple Developer Program** üyeliği ($99/yıl) — https://developer.apple.com
2. **Expo hesabı** (ücretsiz) — https://expo.dev/signup
3. Node 20+ ve `npm i -g eas-cli`
4. App Store Connect'te **com.patisos.app** bundle ID ile bir uygulama kaydı

## Tek Seferlik Çalıştırma

```bash
# 1. Projeye gir
cd pati-sos
npm install

# 2. EAS'e giriş yap (kendi Expo hesabın)
eas login

# 3. Projeyi EAS'e bağla — bu app.json'daki projectId'yi otomatik doldurur
eas init

# 4. iOS production build (EAS bulutta derler, ~15-20 dk)
#    İlk seferde Apple Developer girişine yönlendirir,
#    sertifika + provisioning profili'ni EAS senin için üretir.
eas build -p ios --profile production

# 5. TestFlight'a gönder
eas submit -p ios --latest
```

`eas submit` ilk çalıştırıldığında App Store Connect API Key ister:
- App Store Connect → Users and Access → Integrations → App Store Connect API
- "Generate API Key" (Admin/App Manager rolü), `.p8` dosyasını indir
- EAS prompt'una Key ID, Issuer ID ve `.p8` yolunu gir

Submit bittikten ~10-15 dk sonra build, App Store Connect → TestFlight sekmesinde
"Processing" → "Ready to Test" olur. İç test grubuna kendini ekleyip telefonda
TestFlight uygulamasıyla test edebilirsin.

## Yayın Öncesi Veri

Klinik listesi üç kaynaktan gelir ve build'e gömülü OpenStreetMap verisiyle
(`lib/data/clinics.ts`, GitHub Actions ile her ayın 1.inde güncellenir) anahtar olmadan
da çalışır. Canlı ve daha zengin veri için:

- **Google Places (New)** anahtarı: GitHub secret `EXPO_PUBLIC_GOOGLE_PLACES_KEY`
  (bkz. `.github/SECRETS_SETUP.md`). Yerelde `.env` içine aynı adla yazılır.
- **Firebase**: yapılandırma `app.json > extra.firebase` içinde. Yayından önce
  `firestore.rules` ve `storage.rules` Firebase Console'da yayınlanmış olmalı
  (bkz. `FIREBASE_SETUP.md`). Bildirim/talep moderasyonu: `YONETICI_REHBERI.md`.

## Mağaza Görselleri

`store/screenshots/` içinde 7 adet 1290×2796 (6.7") App Store görseli hazır:
- `01_acil.png` — "Acilde en yakın açık veteriner."
- `02_bakim.png` — "Aşı ve parazit gününü unutma."
- `03_kart.png` — "Dostunun sağlık kartı cebinde."
- `04_sor.png` — "Aklına takılanı veterinere sor."
- `05_liste.png` — "Açık ve yakın olan önce."
- `06_ilkyardim.png` — "Veterinere ulaşana kadar."
- `07_gece.png` — "Gece 03:00'te de göz yormaz." (koyu tema)

Görseller uygulamanın gerçek ekranlarından, örnek verilerle üretildi. App Store Connect →
uygulaman → 6.7" Display bölümüne bu sırayla yükle.
