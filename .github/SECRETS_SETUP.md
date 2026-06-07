# GitHub Actions → TestFlight Kurulumu (Sadece Tarayıcı)

Bu repo, `iOS → TestFlight` adında bir GitHub Actions workflow'u içerir. Build,
internete tam erişimi olan GitHub sunucularında çalışır — senin terminal açman
gerekmez. Tek yapman gereken: aşağıdaki gizli anahtarları (secrets) eklemek ve
workflow'u çalıştırmak.

## 1. Gizli anahtarları (Secrets) ekle

Tarayıcıda: **repo → Settings → Secrets and variables → Actions → New repository secret**

Sırayla şu secret'ları ekle:

| Secret adı | Değer | Nereden |
|---|---|---|
| `EXPO_TOKEN` | Expo erişim token'ı | expo.dev → Settings → Access Tokens → Create |
| `ASC_API_KEY_P8` | `.p8` dosyasının **tüm içeriği** (`-----BEGIN PRIVATE KEY-----` dahil) | App Store Connect → Users and Access → Integrations → App Store Connect API → Generate API Key |
| `ASC_KEY_ID` | API anahtarının Key ID'si (10 karakter) | Aynı sayfada anahtarın yanında |
| `ASC_ISSUER_ID` | Issuer ID (UUID) | Aynı sayfanın üstünde |
| `APPLE_TEAM_ID` | `U9XS8V85V3` | App Store Connect → Membership |

İsteğe bağlı (canlı veri için — yoksa demo build çıkar):

| Secret adı | Değer |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog proje key'i |

> `.p8` içeriğini eklerken: dosyayı Not Defteri ile aç, **hepsini** seç-kopyala,
> secret değerine yapıştır. Satır sonları korunur.

## 2. Workflow'u çalıştır

1. Repo → **Actions** sekmesi
2. Soldan **"iOS → TestFlight"** workflow'unu seç
3. Sağda **"Run workflow"** → **Run workflow** (yeşil buton)

Build EAS bulutunda ~15-20 dk sürer, ardından otomatik olarak TestFlight'a gönderilir.
İlk çalıştırmada EAS, App Store Connect API anahtarını kullanarak iOS sertifikasını ve
provisioning profilini otomatik üretir — interaktif Apple girişi gerekmez.

## 3. Sonuç

App Store Connect → uygulaman → **TestFlight** sekmesinde build "Processing" →
"Ready to Test" olur (~10-15 dk). Kendini iç test grubuna ekleyip telefondaki
TestFlight uygulamasıyla test edebilirsin.

## Sorun olursa

Actions sekmesinde başarısız adımın log'una bakılır. En sık karşılaşılanlar:
- **EXPO_TOKEN geçersiz** → yeni token üret, secret'ı güncelle.
- **Apple kimlik hatası** → Key ID / Issuer ID / `.p8` içeriğini kontrol et; API
  anahtarının rolü **Admin** veya **App Manager** olmalı.
- **Bundle ID kayıtlı değil** → App Store Connect'te `com.patisos.app` ile uygulama
  kaydı oluştur (EAS çoğu zaman bunu da otomatik yapar).
