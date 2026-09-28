# Patiport

Evcil hayvan sahipleri için: acil anında en yakın açık veteriner, her gün için aşı ve
parazit takvimi, acil sağlık kartı ve veterinere soru. Gece 02:00, dostun kötü — saniyeler
içinde yakındaki açık kliniği bul, tek dokunuşla ara.

## Stack

- **Mobil:** Expo (React Native) + TypeScript + expo-router; kendi tasarım sistemi `components/ds`
- **Backend:** Supabase (Postgres + Auth + RLS + RPC)
- **Admin:** Next.js (App Router, Server Actions)
- **Analytics:** PostHog
- **Haritalar:** react-native-maps + expo-location
- **Canlı klinik verisi:** Google Places API (New) — `lib/data/places.ts`
- **Topluluk ve mesajlaşma:** Firebase Firestore + Storage + Auth (anonim oturum, hekim e-posta girişi)
- **Bildirimler:** expo-notifications + Expo Push (sunucusuz, cihazdan cihaza)

## Dostlar ve bakım

- **Dost profili** (`app/pets`) — fotoğraf, doğum tarihi, cinsiyet, kısırlaştırma, çip,
  alerji ve ilaçlar. Bilgiler yalnızca telefonda saklanır.
- **Bakım takvimi** (`lib/data/care.ts`) — aşı, parazit, kontrol, ilaç. Bir gün önce
  20:00'de ve gününde 10:00'da yerel bildirim; "yapıldı" deyince tekrarlıysa sonraki kurulur.
- **Kilo takibi ve acil sağlık kartı** — klinik ararken ekranda, WhatsApp ile paylaşılabilir.
- **Pati karnesi** (`lib/game.ts`, `app/karne.tsx`) — dostun sağlığına yarayan işler pati
  puanı kazandırır: dost eklemek, kartı doldurmak, aşıyı zamanında yapmak, kilo kaydetmek.
  Beş seviye, on rozet, zamanında bakım serisi ve yeni kullanıcı için "İlk adımlar" listesi.
  Puan ayrıca saklanmaz; her seferinde telefondaki kayıtlardan hesaplanır.

## Topluluk, mesajlaşma ve içerik

- **Veterinere sor** (`app/(tabs)/community.tsx`, `lib/data/qa.ts`) — acil olmayan
  sorular; onaylı hekim yanıtları "Veteriner hekim · Klinik" rozetiyle üstte görünür,
  "Faydalı" oyları, soru sahibine yeni yanıt göstergesi. Acil belirti yazılırsa
  (`lib/utils/moderation.ts`) soru yerine hemen aramaya yönlendirilir.
- **Klinikle mesajlaşma** (`app/messages`, `lib/data/messages.ts`) — yalnızca gelen
  kutusu açık kliniklere; hekim paneli `app/vet`. Cep numarası olan kliniklerde WhatsApp.
- **Güvenlik (App Store 1.2)** — küfür/bağlantı filtresi, bildir, engelle, topluluk
  kuralları onayı (`lib/data/safety.ts`); şikayetler `content_reports`'a düşer.
- **Tek ekranlık karşılama ve ana sayfa duyuruları** — duyurular
  `lib/content/banners.ts` (mevsime göre; Firestore `app_banners` ile uygulama
  güncellemeden yönetilir).
- **Sade ama samimi görünüm** — başlıkta Baloo 2, metinde Nunito, tek marka rengi; tombul
  kedi, köpek ve tavşan maskotları (`lib/art/faces.ts`, `components/art`), pastel dost kartları. Gerekçeler
  `docs/ARASTIRMA.md`, kurallar `brand/BRAND.md`.
- Güvenlik kuralları `firestore.rules` Firestore emülatöründe 63 senaryoyla
  (kötüye kullanım denemeleri dahil) test edildi. Yönetim: `YONETICI_REHBERI.md`.

## Klinik verisi nereden geliyor?

1. **OpenStreetMap (gömülü, çevrimdışı)** — `lib/data/clinics.ts`. Türkiye'deki
   `amenity=veterinary` kayıtları; `update-clinic-data` workflow'u ayda bir
   (`scripts/gen-clinics-osm.js`) yeniler. © OpenStreetMap katkıcıları, ODbL.
2. **Google Places (canlı)** — `EXPO_PUBLIC_GOOGLE_PLACES_KEY` tanımlıysa konumun
   çevresindeki en yakın veterinerler + 7/24/acil veterinerler. Telefon ve saat
   bilgisi OSM'den çok daha dolu. Kurulum: `.github/SECRETS_SETUP.md`.
   Anahtar yoksa listede yalnızca OSM'deki klinikler olur.
3. **Apple Haritalar (canlı, iOS, anahtarsız)** — `lib/data/apple.ts`, yerel Expo
   modülü `modules/apple-poi` (MapKit `MKLocalSearch`). Ad, adres, telefon; saat yok.
4. **Veteriner hekimleri odası listeleri (gömülü, çevrimdışı)** —
   `lib/data/chamberClinics.ts`. Şimdilik Ankara Veteriner Hekimleri Odası'nın herkese
   açık muayenehane, poliklinik ve hayvan hastanesi listeleri. OSM'de olmayan mahalle
   muayenehaneleri böylece anahtarsız da listede. `scripts/gen-clinics-chamber.js`
   adresleri OpenStreetMap Nominatim ile konuma çevirir (saniyede 1 istek, sonuçlar
   `scripts/data/geocode-cache.json`'da; sonraki çalıştırmada yalnızca yeni adresler
   sorulur) ve aylık workflow'da yenilenir. Hekimin adı alınmaz; yalnızca işletme adı,
   telefon ve adres. Kapı numarası bulunamayanların konumu cadde ya da mahalleden
   yaklaşıktır: listede mesafe "~" ile yazılır, yol tarifi koordinat yerine adresle açılır.
   Başka bir odanın listesi aynı biçimdeyse script'teki `CHAMBERS` dizisine eklenir.
5. **Topluluk** — kullanıcıların eklediği klinikler (Firestore); yönetici onayından sonra görünür.
6. **Klinik onaylı profiller** — veteriner hekimlerin "Bu klinik benim" başvurusu
   telefonla doğrulanınca yönetici `clinic_profiles` belgesini oluşturur; bu bilgiler
   diğer kaynakların üzerine yazılır. Süreç: `YONETICI_REHBERI.md`.

Aynı klinik birden çok kaynakta varsa tek kayıt gösterilir (onaylı > Google > OSM >
Apple > oda listesi > topluluk), eksik telefon/saat/adres diğer kaynaktan tamamlanır;
oda listesindeki yaklaşık konum, aynı klinik başka kaynakta varsa onun konumuyla değişir. Açık/kapalı durumu her
zaman çalışma saatlerinden cihazda hesaplanır; saat bilinmiyorsa "bilinmiyor" yazar.

Sıralama satın alınamaz: yalnızca şu an açık olma, acil kabul, 7/24, doğrulanmış
bilgi, telefonun olması, mesafe ve puan (`rankClinics`, `lib/data/query.ts`).
Klinikler ekranında kullanıcı "Önerilen / En yakın / En yüksek puan" sıralamasını
seçebilir ve ada, semte ya da ilçeye göre arayabilir (`useClinicSearch`).

## Hekim paneli (web)

Veteriner hekimler için tarayıcıdan hasta takibi: `app/panel`, `components/panel`,
`lib/data/panel.ts`. Adres: `https://batuhandac.github.io/batu/hekim/panel` (GitHub
Pages; `site-pages.yml` uygulamanın web sürümünü `/batu/hekim` altına derler).

- Onaylı hekim hesabıyla giriş (uygulamadaki hekim hesabıyla aynı).
- Hasta kartı: tür, ırk, doğum tarihi, kilo, çip, alerji, sahip bilgisi.
- Kayıtlar: aşı, kuduz, iç/dış parazit, kontrol, ilaç, kilo, muayene notu. Türe göre
  sonraki tarih önerilir (karma aşı 1 yıl, iç parazit 3 ay…); hekim değiştirebilir.
- "Bu hafta": gecikmiş ve 7 gün içinde gelen aşı/kontroller; telefonu olan sahibe
  WhatsApp ile hazır hatırlatma metni.
- **Sahip bağlantısı:** sahip dostunun sayfasında "Veterinerime bağla" ile 24 saatlik
  6 haneli kod alır (`lib/data/vetLink.ts`). Hekim kodu panele yazınca hasta kartı
  dolu gelir. Hekimin girdiği kayıtlar sahip uygulamayı açınca takvime işlenir: aynı
  türdeki bekleyen bakım "yapıldı" olur, sonraki tarih hekimin yazdığı olur ve bir gün
  önce/gününde hatırlatma kurulur (`applyVetRecord`, `lib/data/care.ts`).
- Firestore: `pet_links/{kod}`, `clinic_patients/{klinik}/patients/{hasta}/records`.
  Kurallar ve emülatör testleri: `firestore.rules` (klinik yalnızca kendi hastalarını,
  sahip yalnızca kendi dostunun kaydını görür).

Sırada: randevu, tahsilat kaydı ve e-Arşiv, yazarkasa POS'a tutar gönderme (GMP3).

## App Store

Mağaza metinleri, gizlilik yanıtları, inceleme notları ve gönderim adımları:
[`store/APP_STORE.md`](store/APP_STORE.md). Gizlilik, koşullar ve destek sayfaları `site/`
klasöründe; GitHub Pages ile yayınlanır.

## Kurulum

### 1. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) → New project (Ankara/EU için Frankfurt)
2. SQL Editor'da şu sırayla çalıştır:
   - `supabase/schema.sql`
   - `supabase/nearby_clinics.sql`
   - `supabase/seed_demo.sql` (demo verisi için)
3. Settings → API'den `URL` ve `anon public key` al

### 2. PostHog Projesi

1. [app.posthog.com](https://app.posthog.com) → New project
2. Project API Key'i al

### 3. Env Dosyası

```bash
cp .env.example .env
# Doldur:
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_POSTHOG_KEY=...
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Expo Başlat

```bash
npm install
npx expo start
```

## Admin Panel

```bash
cd admin
cp .env.example .env.local
# Doldur: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
# http://localhost:3000
```

## Seed Script (Google Places)

```bash
# .env.local'e ekle:
# GOOGLE_MAPS_API_KEY=...
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
node scripts/seed-clinics.js
```

## Güvenlik

- `EXPO_PUBLIC_*` → sadece client-safe değerler
- `SERVICE_ROLE_KEY` → **asla** app bundle'a girmesin; sadece admin/ ve scripts/
- RLS tüm tablolarda aktif
- `emergency_score` hesaplaması tamamen server-side (RPC)

## Env Değişkenleri

| Değişken | Nerede | Açıklama |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Mobil app | Supabase proje URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobil app | Public anon key |
| `EXPO_PUBLIC_POSTHOG_KEY` | Mobil app | PostHog proje key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin + Seed ONLY | Service role key |
| `GOOGLE_MAPS_API_KEY` | Seed script ONLY | Places API key |

## Proje Yapısı

```
pati-sos/
├── app/                    # Expo Router sayfaları
│   ├── (onboarding)/       # Welcome + Location permission
│   ├── (tabs)/             # Ana sekmeler
│   ├── clinic/[id]/        # Klinik detay + report + claim
│   └── pets/               # Pet kartı CRUD
├── components/             # UI bileşenleri
├── lib/                    # Supabase, hooks, utils
├── stores/                 # Zustand stores
├── supabase/               # Schema SQL + RPC
├── scripts/                # Seed script
├── admin/                  # Next.js admin paneli
└── types/                  # TypeScript tipleri
```
