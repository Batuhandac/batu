# Leonida Codes

Bağımsız GTA VI companion uygulaması: doğrulanmış hile kodları, görev atlama taktikleri, meta rehberler ve kendi çizdiğimiz Leonida haritası. Web + iOS + Android, tek Expo kod tabanı.

Rockstar Games / Take-Two ile bağlantılı değildir. Uygulama adı, ikon ve metadata'da "GTA" geçmez.

## Ürün kuralları

- Hiçbir içerik doğrulanmadan "gerçek" gösterilmez. Her kayıt `verified | unverified | rumor | debunked` taşır.
- Çıkış öncesi (19 Kasım 2026) tüm hileler `unverified`. Ekip oyunu perakende sürümde test ettikçe Supabase'den `verified`/`debunked` yapılır, uygulama anında güncellenir.
- Görseller: resmi GTA VI tanıtım ekran görüntüleri ve fragman kareleri (© Rockstar Games) kullanılıyor. Hepsi `assets/photos/` klasöründe ve `content/media.ts` içinde tek bir haritada; bir hak sahibi ya da App Review isterse tek değişiklikle değiştirilir veya kaldırılır. Bu bilinçli alınmış bir risktir (Apple 5.2.1, Take-Two DMCA).
- Rockstar logosu ve "GTA" kelime markası uygulama adı, ikon ve store metadata'sında kullanılmaz.

## Veri kaynakları

| Veri | Kaynak | Lisans | Dosya |
|---|---|---|---|
| GTA VI Leonida konumları (1.427, 350'si isim-doğrulanmış, 26 bölge) | GTADB topluluk kataloğu (map.gtadb.org), jahid611/gta6map üzerinden normalize | Public domain / CC BY 4.0 (rolux, Yanis, Dupzor ve katkıda bulunanlar) | `content/data/leonida-locations.json`, yenilemek için `node scripts/import-leonida.js` |
| Harita karoları (koyu "Yanis" ve renkli "Dupzor" stilleri) | gta6map/gta6map.github.io reposu (yazar karoların yeniden kullanımına izin veriyor); topluluk çizimi, Rockstar varlığı değil | Topluluk çalışması, atıf: Yanis, Dupzor | z0-3 (Yanis) ve z0-2 (Dupzor) `assets/tiles/` içinde gömülü; üst seviyeler `EXPO_PUBLIC_TILES_BASE_URL` adresinden akıyor (varsayılan GitHub raw; prod için kendi depona aynala) |
| Bölge ve başlık fotoğrafları (36 adet) | gta.wiki arşivindeki resmi tanıtım görselleri ve fragman kareleri | © Rockstar Games | `assets/photos/`, `content/media.ts` |
| GTA V hikaye modu hileleri (35 kod, PS/Xbox/PC/telefon) | Oyun içi, DuckDuckGo cheat-sheet veri setiyle çapraz kontrol | Apache-2.0 (DDG), kodlar kamuya açık | `content/gtav-cheats.ts` |
| Sözlük (26 terim, TR/EN) | Kendi yazımımız | - | `content/glossary.ts` |
| GTA VI hileler, rehberler, görevler | Çıkış günü ekip doğrulaması | - | Supabase + `content/seed.ts` |

Denenip elenenler: EricSpencer00/gta-v-gold-checklist (MIT) sadece 18 görev içeriyor, eksik; nmec/gtav-vehicle-stats fiyat alanı boş. GTADB'nin kendi endpoint'i tarayıcı dışı istemcileri engelliyor, mirror kullanıldı.

## Tasarım

- Tipografi: Anton (başlıklar, sıkışık büyük harf) + Inter (gövde). İkisi de OFL, `@expo-google-fonts` üzerinden gömülü.
- Palet: Vice City gün batımı. Pembe `#FF2D8A`, turuncu `#FF7A3C`, sarı `#FFC83D`, turkuaz `#22E3D0`, zemin `#07050D`. `constants/theme.ts`.
- Her sekme tam genişlikte fotoğraf başlığıyla açılır (`components/PhotoHeader.tsx`).
- Hile kodları metin değil kontrolcü glifi olarak çizilir: PS şekilleri, Xbox harfleri, yön okları, omuz tuşları, PC klavye tuşları (`components/ButtonGlyphs.tsx`).
- Harita: kendi karo motorumuz (`components/TileMap.tsx`), sürükle, pinch, tekerlek, arama, bölge etiketleri, çakışmasız yer isimleri.

## TestFlight

Apple hesabı gerektirdiği için kendi makinende: `scripts/testflight.sh`. Adımlar: EAS projesi bağla, iOS production build, otomatik submit. İlk çalıştırmada EAS bundle id (`com.batu.leonidacodes`), sertifika ve profili Apple hesabında kendisi oluşturur.

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

İkon ve splash `assets/` içinde hazır (gün batımı güneşi + CODES).

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
components/     UI parçaları, PhotoHeader, ButtonGlyphs, Countdown, TileMap (karo harita motoru)
constants/      tema, i18n (TR/EN), çıkış tarihi
content/seed.ts çevrimdışı seed içerik (tek kaynak; seed:supabase bunu yükler)
lib/            supabase client, içerik yükleme (remote→cache→seed), push kaydı, geri sayım
stores/         zustand: içerik + ayarlar
supabase/       schema.sql (RLS: herkese okuma, yazma sadece service role)
scripts/        seed-supabase.js, send-push.js, import-leonida.js, gen-tiles-index.js, testflight.sh
```
