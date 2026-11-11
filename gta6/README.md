# Leonida Codes

Bağımsız GTA VI companion uygulaması: doğrulanmış hile kodları, görev atlama taktikleri, meta rehberler ve kendi çizdiğimiz Leonida haritası. Web + iOS + Android, tek Expo kod tabanı.

Rockstar Games / Take-Two ile bağlantılı değildir. Uygulama adı, ikon ve metadata'da "GTA" geçmez; harita ve görseller bizim çizimimizdir.

## Ürün kuralları

- Hiçbir içerik doğrulanmadan "gerçek" gösterilmez. Her kayıt `verified | unverified | rumor | debunked` taşır.
- Çıkış öncesi (19 Kasım 2026) tüm hileler `unverified`. Ekip oyunu perakende sürümde test ettikçe Supabase'den `verified`/`debunked` yapılır, uygulama anında güncellenir.
- Rockstar görseli, ekran görüntüsü, resmi harita kullanılmaz (DMCA riski).

## Çalıştırma

```bash
cd gta6
npm install
cp .env.example .env   # Supabase anahtarlarını gir (boş bırakılırsa seed içerikle çalışır)
npm run web            # tarayıcı
npm run ios / android  # dev client
npm run typecheck
```

## Supabase kurulumu (10 dk)

1. Yeni proje aç, SQL editor'de `supabase/schema.sql` çalıştır.
2. `.env` dosyasına `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` yaz.
3. Seed içeriği yükle: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:supabase`
4. Çıkıştan sonra içerik Supabase dashboard'dan (Table editor) düzenlenir. `published=false` yapılan satır uygulamada görünmez.

Uygulama açılışta Supabase'den çeker, cache'ler, erişemezse cache → seed sırasıyla düşer. Asla boş ekran yok.

## Web deploy (Vercel)

Root directory: `gta6`. `vercel.json` build komutunu ve SPA rewrite'ı içerir. Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Store build (EAS)

```bash
npx eas init                       # app.json extra.eas.projectId doldurulur (push için şart)
npx eas build -p ios --profile production
npx eas build -p android --profile production
npx eas submit -p ios              # eas.json submit.production.ios.ascAppId doldur
```

Store metadata önerisi: isim "Leonida Codes", alt başlık "Cheats, missions & meta guide". Açıklamada "unofficial fan-made guide, not affiliated with Rockstar Games or Take-Two Interactive" cümlesi olsun. Keyword alanında oyun adını kullanma (Apple 5.2.1 / metadata kuralı).

Assets klasöründeki ikonlar `scripts/make-icons.js` ile üretilmiş placeholder. Submit öncesi gerçek ikonla değiştir.

## Push bildirimi

- Kullanıcı Ayarlar'dan açınca Expo push token `push_tokens` tablosuna yazılır (dil + platform ile).
- Yeni doğrulama duyurmak için:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run push:send -- \
  --tr "Ölümsüzlük hilesi doğrulandı" --en "Invincibility cheat verified" --href /cheat/invincibility
```

`--href` ile gönderilen bildirime dokunan kullanıcı doğrudan o ekrana düşer.

## Çıkış günü iş akışı (19 Kasım)

1. Biri oynar ve test eder, ekran kaydı alır. Diğeri Supabase'de satırı günceller: `codes`, `status=verified`, `verified_at`, `source`.
2. `updates` tablosuna bir satır ekle (ana sayfadaki "Son güncellemeler" bunu gösterir).
3. `npm run push:send` ile bildirim at.
4. Görevler: `missions` tablosuna sırayla ekle; `gold_requirements`, `skip_tips`, `tips` JSON dizileri `{"tr":"...","en":"..."}` formatında.

## Yapı

```
app/            expo-router ekranları (tabs: ana, hileler, görevler, meta, harita; detaylar; ayarlar; yasal)
components/     UI parçaları, Countdown, LeonidaMap (react-native-svg, kendi çizimimiz)
constants/      tema, i18n (TR/EN), çıkış tarihi
content/seed.ts çevrimdışı seed içerik (tek kaynak; seed:supabase bunu yükler)
lib/            supabase client, içerik yükleme (remote→cache→seed), push kaydı, geri sayım
stores/         zustand: içerik + ayarlar
supabase/       schema.sql (RLS: herkese okuma, yazma sadece service role)
scripts/        seed-supabase.js, send-push.js, make-icons.js
```
