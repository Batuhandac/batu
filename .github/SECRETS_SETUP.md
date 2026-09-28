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

İsteğe bağlı (canlı veri için — yoksa uygulama gömülü klinik listesiyle çalışır):

| Secret adı | Değer |
|---|---|
| `EXPO_PUBLIC_GOOGLE_PLACES_KEY` | Google Maps Platform API anahtarı (aşağıya bak) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog proje key'i |

Bu değerler build sırasında `eas.json` içine yazılıp EAS'a iletilir
(`scripts/ci-prepare-credentials.js`). `.env` dosyası EAS'a yüklenmediği için
CI'da kullanılmaz.

### Google Places anahtarı (canlı klinik verisi)
1. https://console.cloud.google.com → proje seç/oluştur → **Faturalandırmayı** aç
   (aylık ücretsiz kota var; kota aşılmadıkça ücret çıkmaz).
2. **APIs & Services → Library** → **"Places API (New)"** → **Enable**.
   (Eski "Places API" değil — yeni projelerde o artık açılamıyor.)
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Anahtarı düzenle:
   - **API restrictions** → *Restrict key* → sadece **Places API (New)**
   - **Application restrictions** → *iOS apps* → `com.patisos.app`
5. Anahtarı `EXPO_PUBLIC_GOOGLE_PLACES_KEY` secret'ı olarak ekle.

Bu anahtar yoksa uygulama yalnızca OpenStreetMap'teki klinikleri gösterir; Google'da
olan birçok mahalle kliniği (ör. Bağlıca'daki bir klinik) listede çıkmaz. Build log'unda
"EXPO_PUBLIC_* secret yok — Google Places kapalı" satırı bunu gösterir.

Uygulama her ~2 km'lik bölge için 4 istek atar (en yakın 20, mesafeye göre sıralı 40,
7/24 acil) ve sonucu cihazda 3 gün saklar. Klinik adıyla arama, her yeni sorgu için
1 istek daha atar. Açık/kapalı durumu çalışma saatlerinden cihazda hesaplanır.
Google Cloud'da Places API (New) için günlük kota (Quotas) koymak beklenmedik
faturayı önler.

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
