# Pati SOS → TestFlight (Tek Seferlik Kılavuz)

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

## Önemli: Yayın Öncesi Veri

Uygulama **seed/demo veriyle** TestFlight'a çıkabilir (test için sorun değil), ama
**App Store yayınına** çıkmadan önce admin panelden gerçek Ankara klinikleri telefon
ile doğrulanmalı. Detay: `RELEASE.md`.

## Submit Öncesi Supabase

TestFlight build'i çalışırken canlı veri görmek için `.env` dolu olmalı:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_POSTHOG_KEY=...
```
Supabase'de `supabase/schema.sql` + `nearby_clinics.sql` + `seed_demo.sql` çalıştırılmış olmalı.

## Mağaza Görselleri

`store/screenshots/` içinde 5 adet 1290×2796 (6.7") App Store görseli hazır:
- `01_sos.png` — "Gece 02:00, petin kötü. İlk açtığın app."
- `02_list.png` — "Açık. Acil kabul. Doğrulanmış. Saniyeler içinde."
- `03_verify.png` — "Maps yalan söyleyebilir. Biz son doğrulama zamanını gösteririz."
- `04_petcard.png` — "Petinin acil kartı tek tuşla kliniğe gider."
- `05_free.png` — "Ankara'da ücretsiz. Hazırlıklı ol."

Bunları App Store Connect → uygulaman → 6.7" Display bölümüne yükle.
