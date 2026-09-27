# Yönetici Rehberi — başvurular, onaylar, bildirimler

Uygulamada giriş/hesap yok; her şey **Firebase Console → Firestore Database**
üzerinden yönetilir. Günde bir kez bakman yeterli.

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
6. Uygulama profilleri 10 dakikada bir yeniler; klinik **"✓ Klinik onaylı"** görünür.

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
