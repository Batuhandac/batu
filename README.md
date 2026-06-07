# Pati SOS

Türkiye'nin acil veteriner klinik bulucu uygulaması. Gece 02:00, petin kötü — saniyeler içinde yakındaki açık, acil kabul eden kliniği bul, tek tuşla ara.

## Stack

- **Mobil:** Expo (React Native) + TypeScript + expo-router + NativeWind
- **Backend:** Supabase (Postgres + Auth + RLS + RPC)
- **Admin:** Next.js (App Router, Server Actions)
- **Analytics:** PostHog
- **Haritalar:** react-native-maps + expo-location

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
