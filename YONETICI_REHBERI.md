# Yönetici Rehberi — başvurular, onaylar, topluluk, mesajlar

Kullanıcılar kayıt olmaz: uygulama arka planda görünmez bir anonim oturum açar.
Veteriner hekimler senin açtığın e-posta hesabıyla girer. Her şey **Firebase
Console** üzerinden yönetilir. Günde bir kez bakman yeterli; **şikayetlere
24 saat içinde** bakmak App Store kuralı gereği zorunlu (bkz. 7).

## 0. İlk kurulum (bir kez)

1. **Authentication → Başlayın (Get started)** → *Sign-in method* sekmesinde
   **Anonymous** ve **Email/Password** yöntemlerini etkinleştir. Bu yapılmadan
   topluluk, yorum ve mesajlaşma "şu anda kullanılamıyor" der.
2. **Firestore Database → Rules**: depodaki `firestore.rules` içeriğini yapıştır → Publish.
3. **Storage → Rules**: depodaki `storage.rules` içeriğini yapıştır → Publish.
4. Ek dizin (index) gerekmez; sorgular varsayılan dizinlerle çalışacak şekilde yazıldı.

## 1. Veteriner hekim başvuruları (`clinic_claims`)

Klinikler reklam veremediği için Pati SOS onlara **ücretsiz, doğru bilgi** ile
görünürlük sunar. Başvuru gelince:

1. `clinic_claims` koleksiyonunda `status: "pending"` olan belgeyi aç.
2. **`claimant_phone` numarasını ara.** Kişinin o klinikte çalıştığını doğrula
   (klinik sabit hattından geri aramak en güvenlisi). Doğrulamadan onaylama —
   acil anında yanlış numara göstermek en büyük risk.
3. `clinic_profiles` koleksiyonunda **belge kimliği = başvurudaki `clinic_id`**
   olacak şekilde yeni belge oluştur (`clinic_id` boşsa klinik listede yok:
   önce `community_clinics`'e ekleyip `status: "approved"` yap, belge kimliğini
   `comm-<belgeKimliği>` olarak kullan).
4. Alanlar (hepsi isteğe bağlı, sadece doğruladıklarını yaz):

| Alan | Tür | Örnek |
|---|---|---|
| `phone` | string | `0312 123 45 67` |
| `emergency_phone` | string | `0532 000 00 00` (mesai dışı hat) |
| `opening_hours` | string | `Mo-Sa 09:00-20:00; Su off` |
| `is_24_7` | boolean | `true` |
| `accepts_emergency` | boolean | `true` |
| `services` | array | `["Kedi", "Köpek", "Cerrahi"]` |
| `note` | string | `Gece gelmeden önce mutlaka arayın.` |
| `verified_at` | timestamp | bugünün tarihi |

   **`opening_hours` yazımı** (OpenStreetMap biçimi):
   - Günler: `Mo Tu We Th Fr Sa Su` · aralık `Mo-Fr` · liste `Mo,We`
   - Saat: `09:00-19:00` · öğle arası `09:00-12:30,13:30-19:00` · gece `20:00-02:00`
   - Kurallar `;` ile: `Mo-Fr 09:00-19:00; Sa 10:00-16:00; Su off`
   - 7/24 için `is_24_7: true` yeterli.
   Anlaşılmayan bir yazım olursa uygulama saati "bilinmiyor" gösterir (yanlış "açık" demez).

5. Başvurudaki `status` alanını `approved` (ya da `rejected`) yap.
6. Uygulama profilleri 10 dakikada bir yeniler; klinik **"Klinik onaylı"** rozetiyle görünür.
7. Hekime uygulama hesabı açmak için **6. bölüme** geç (mesajlaşma ve rozetli yanıtlar).

**Asla yapma:** ücret karşılığı sıralama, "en iyi klinik" gibi övgü metni, kampanya/indirim
yayımlamak. Sıralama yalnızca açık olma, mesafe, acil kabul, 7/24 ve doğrulanmış bilgiye göredir.

## 2. Kullanıcıların eklediği klinikler (`community_clinics`)

`status: "pending"` olanları kontrol et (Google Maps'te var mı, telefon doğru mu).
Doğruysa `status` → `approved`; değilse belgeyi sil.

## 3. Hatalı bilgi bildirimleri (`clinic_reports`)

`report_type` değerleri: `missing_phone`, `wrong_phone`, `wrong_hours`, `not_emergency`,
`wrong_location`, `closed_permanently`, `other`. `detail` alanında kullanıcının yazdığı
doğru bilgi olur. Doğruladıktan sonra ilgili kliniğin `clinic_profiles` belgesini
oluştur/güncelle.

## 4. "Açık mı?" teyitleri ve arama geri bildirimleri

`clinic_pings` ve `clinic_feedback` şimdilik sadece toplanıyor (uygulamada
gösterilmiyor). Aynı kliniğe çok sayıda "telefonu açmadı" geliyorsa kliniği ara,
numarayı düzelt.

## 5. Klinik verisi (OpenStreetMap)

Çevrimdışı klinik listesi her ayın 1'inde OpenStreetMap'ten otomatik yenilenir
(GitHub → Actions → "Klinik verisini güncelle"). Elle çalıştırmak için
**Run workflow**. Eksik bir kliniği kalıcı olarak düzeltmenin en iyi yolu onu
OpenStreetMap'e eklemektir (openstreetmap.org → Düzenle) — herkes faydalanır.

## 6. Veteriner hekim hesabı ve mesajlaşma

Doğrulanmış bir klinik; hasta sahiplerinin mesajlarını yanıtlayabilir, topluluktaki
sorulara **"Veteriner hekim · Klinik adı"** rozetiyle cevap verebilir ve yorumlara
klinik yanıtı yazabilir. Hesap açmak:

1. **Authentication → Users → Add user**: hekimin e-postası, rastgele uzun bir şifre.
   Oluşan kullanıcının **User UID** değerini kopyala.
2. **Firestore → `vets`** koleksiyonunda **belge kimliği = User UID** olan belge oluştur:

| Alan | Tür | Örnek |
|---|---|---|
| `clinic_id` | string | başvurudaki `clinic_id` (clinic_profiles ile aynı) |
| `clinic_name` | string | `Çankaya Hayvan Hastanesi` |
| `name` | string | `Ayşe Yılmaz` |
| `title` | string | `Vet. Hek.` ya da `Uzm. Vet. Hek.` |

   Bu belgeye başka kişisel bilgi (telefon, e-posta) yazma; giriş yapmış herkes okuyabilir.
3. **Firestore → `clinic_inboxes`** koleksiyonunda **belge kimliği = `clinic_id`**:
   `clinic_name` (string), `open` (boolean, `true`), `response_hint` (null ya da
   `"Genelde 1 saat içinde yanıtlarız"`). Bu belge varsa ve `open: true` ise klinik
   sayfasında **"Mesaj gönder"** düğmesi çıkar.
4. Hekime e-postayı bildir: uygulamada **Ayarlar → Hekim girişi → "Şifremi unuttum /
   şifre oluştur"** ile kendi şifresini belirlesin. Giriş yapınca hekim paneli açılır;
   mesaj almayı oradan açıp kapatabilir.

Yeni mesajlar hekimin telefonuna bildirim olarak gider (Expo Push; sunucu gerekmez).
Hekim ayrılırsa: Authentication'da kullanıcıyı **Disable** et, `vets` belgesini sil.

## 7. Topluluk ve şikayetler (`content_reports`)

Kullanıcılar soru, yanıt, yorum ve mesajları **Bildir** ile şikayet edebilir. Her şikayet
`content_reports` koleksiyonuna düşer: `kind`, `path` (şikayet edilen belgenin yolu),
`reason` (`abuse`, `spam`, `misinfo`, `inappropriate`, `other`), `author_uid`, `reporter_uid`.

1. `path` alanındaki belgeyi Firestore'da aç (ör. `questions/abc/answers/def`).
2. Kurala aykırıysa **belgeyi sil**. Soru fotoğrafı varsa Storage'da
   `question_photos/<author_uid>/` altındaki dosyayı da sil.
3. Tekrarlayan ya da ağır ihlalde **Authentication → Users**'da `author_uid` ile kullanıcıyı
   bulup **Disable** et (bir daha yazamaz).
4. Şikayetin `status` alanını `done` yap.

Uygulama ayrıca cihazda küfür/hakaret filtresi, bağlantı engeli ve acil durum uyarısı
uygular; kullanıcılar birbirini engelleyebilir. Tıbbi açıdan tehlikeli bir yanıt görürsen
(ör. insan ilacı önerisi) şikayet beklemeden sil.

## 8. Ana sayfa bannerları (`app_banners`)

Uygulamayla gelen bannerlar (`lib/content/banners.ts`): `sor`, `kart`, `sicak` (Haz–Eyl),
`antifriz` (Kas–Mar), `parazit` (Nis–Eki), `ara`, `hekim`. Uygulamayı güncellemeden
yeni banner eklemek için `app_banners` koleksiyonuna belge ekle:

| Alan | Tür | Açıklama |
|---|---|---|
| `title` | string | En çok 60 karakter |
| `text` | string | En çok 90 karakter |
| `cta` | string | Düğme yazısı, en çok 20 karakter |
| `route` | string | Uygulama içi sayfa: `/community`, `/first-aid`, `/pets/create`, `/nearby`, `/vets` |
| `url` | string | Ya da `https://` ile başlayan bağlantı |
| `tag` | string | Küçük etiket: `Yeni`, `Bayram`, `İpucu` |
| `art` | string | `emergency`, `petcard`, `community`, `vet`, `heat`, `vaccine`, `shield`, `chat` |
| `tone` | string | `teal`, `coral`, `honey`, `night` |
| `order` | number | Küçük olan önce |
| `active` | boolean | `false` ise gösterilmez |
| `starts_at` / `ends_at` | string | `2026-12-25` biçiminde tarih aralığı (isteğe bağlı) |
| `months` | array | `[6,7,8]` gibi aylar (isteğe bağlı) |

Uygulamayla gelen bir bannerı kapatmak için **aynı kimlikle** (`sicak` gibi) `active: false`
olan bir belge oluştur. Bannerlar reklam değildir: ücretli tanıtım, klinik övgüsü ya da
ürün satışı koyma (hem klinikler reklam veremez hem de uygulama "reklamsız" sözü veriyor).
