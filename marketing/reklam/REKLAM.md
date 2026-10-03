# Instagram reklamları (Ekim 2026)

İki ayrı kampanya: **hekimler** (web paneli yayında, hemen açılabilir) ve **hayvan sahipleri**
(App Store onayından sonra). Videolar `videolar/` (1080×1920, 9:16: Reels ve Hikâye),
görseller `gorseller/` (1080×1350, 4:5: Akış). Marka dili aynı: emoji yok, sayı uydurulmaz.

| Dosya | Kitle | Süre / boyut | Ne gösteriyor |
| --- | --- | --- | --- |
| `videolar/hekim-01_hatirlatma.mp4` | Hekim | 15 sn | Aşıyı kaydet; sonraki tarih sahibin takvimine düşer, uygulamanın gerçek hatırlatma metni |
| `videolar/hekim-02_tahsilat.mp4` | Hekim | 18 sn | Tutar → QR → "Ödeme alındı", makbuz özeti |
| `videolar/hekim-03_kurucu-klinik.mp4` | Hekim | 11 sn | Erken erişim şeridi, Paketiniz kartı, kurucu klinik |
| `videolar/sahip-01_gece-0300.mp4` | Sahip | 12 sn | Acil: en yakın açık klinik, tek dokunuşla ara |
| `videolar/sahip-02_asi.mp4` | Sahip | 13 sn | Aşıyı takvime ekle, hatırlatma |
| `gorseller/hekim-a_hatirlatma.png` | Hekim | 4:5 | Kayıt ekle + sahibin telefonundaki bildirim |
| `gorseller/hekim-b_tahsilat.png` | Hekim | 4:5 | QR ile ödeme ekranı |
| `gorseller/hekim-c_kurucu-klinik.png` | Hekim | 4:5 | Teklif: ilk 50 klinik, tarihler |
| `gorseller/sahip-a_acil.png` | Sahip | 4:5 | Acil ekranı |
| `gorseller/sahip-b_asi.png` | Sahip | 4:5 | Yaklaşan bakım listesi |

Her videonun `_kapak.png` dosyası var. Videolar sessizdir (boş ses izi). Ses eklemek
istersen yalnızca Meta'nın **Sound Collection** kitaplığından seç: Instagram'daki popüler
müzikler reklamda kullanılamaz.

## Bir kez yapılacaklar

1. Instagram hesabı profesyonel (İşletme) olsun ve bir Facebook sayfasına bağlansın
   (Meta Business Suite → Ayarlar → Hesaplar).
2. Reklamları **Reklam Yöneticisi**'nden aç (adsmanager.facebook.com), gönderideki "Öne
   çıkar" düğmesinden değil: kitle, yerleşim ve ölçüm orada daha iyi.
3. Reklam hesabına ödeme yöntemi ekle; para birimi TRY, saat dilimi İstanbul.
4. Hekim reklamlarını profilde yayınlamadan ("yalnızca reklam") aç; profildeki takipçilerin
   çoğu hayvan sahibi.

## Kampanya 1: Hekimler (şimdi)

- **Amaç:** Trafik → web sitesi.
- **Bağlantı:** `https://batuhandac.github.io/batu/hekim/?utm_source=instagram&utm_medium=paid&utm_campaign=hekim-erken-erisim`
  Alan adına geçince yalnızca adres değişir.
- **Kitle:** Konum Ankara (il). Yaş 24–65. Detaylı hedefleme: ilgi alanı "Veterinerlik",
  "Veteriner hekim"; iş unvanı "Veteriner hekim" (listede çıkarsa). Kitle küçük kalırsa
  Meta'nın genişletme önerisini açabilirsin.
- **Yerleşim:** Instagram Reels, Hikâyeler ve Akış. Videolar Reels ve Hikâye'ye, görseller
  Akış'a gider; Reklam Yöneticisi'nde her yerleşime uygun dosyayı seç.
- **Bütçe (öneri):** tek reklam setinde üç reklam, günlük 150–200 TL, 7 gün. Yedinci gün
  bağlantı tıklaması başına maliyeti en düşük olanı bırak, diğerlerini kapat.
- **Ölçüm:** sitedeki başvurular Firestore `clinic_claims` koleksiyonuna düşer; panel ilk
  açılınca `clinic_plans` oluşur. Haftalık: tıklama, tıklama başı maliyet, başvuru sayısı.

### Metinler

**Hekim 1: Hatırlatma** (`hekim-01_hatirlatma.mp4` / `hekim-a_hatirlatma.png`)
- Ana metin: Aşıyı panelden kaydedin. Hasta sahibi Patiport kullanıyorsa sonraki tarih onun
  takvimine düşer, bir gün önce ve gününde hatırlatılır. Kullanmıyorsa WhatsApp ile tek
  dokunuşla hatırlatın. Hasta takibi her zaman ücretsiz.
- Başlık: Aşı hatırlatması kendiliğinden
- Açıklama: Veteriner hekimler için ücretsiz panel
- Düğme: Daha Fazla Bilgi Al

**Hekim 2: Tahsilat** (`hekim-02_tahsilat.mp4` / `hekim-b_tahsilat.png`)
- Ana metin: Tutarı hasta kartına yazın; hasta sahibi QR'ı telefonuyla okutup kartla ödesin.
  Para kendi iyzico hesabınıza geçer, sonuç panele anında düşer. Nakit tahsilat da kaydedilir.
- Başlık: Kartla tahsilat, POS cihazı olmadan
- Açıklama: Kartla ödeme için iyzico üye işyeri hesabı gerekir
- Düğme: Daha Fazla Bilgi Al

**Hekim 3: Kurucu klinik** (`hekim-03_kurucu-klinik.mp4` / `hekim-c_kurucu-klinik.png`)
- Ana metin: Patiport Hekim erken erişimde: tahsilat dahil her şey 31 Mart 2027'ye kadar
  ücretsiz. İlk 50 klinik kurucu klinik olur; ücretli paket geldiğinde fiyatı 31 Mart 2029'a
  kadar sabit kalır. Fiyat en az 30 gün önce duyurulur.
- Başlık: Kurucu klinik olun
- Açıklama: Hasta takibi her zaman ücretsiz
- Düğme: Kaydol

## Kampanya 2: Hayvan sahipleri (App Store onayından sonra)

- **Amaç:** Uygulama tanıtımı → App Store. Uygulama yalnızca iPhone'da: cihaz olarak
  **yalnızca iOS** seç, yoksa Android kullanıcılarına boşa gösterilir.
- **Bağlantı:** App Store Connect → Analytics → kampanya bağlantısı oluşturucudan
  `ct=ig-reklam` ile üret (örnek: `https://apps.apple.com/app/apple-store/id6778331996?pt=…&ct=ig-reklam&mt=8`).
  Böylece App Store Connect'te reklamdan gelen indirmeleri ayrı görürsün. Onaydan önce
  bağlantı çalışmaz; kampanyayı onaydan sonra aç.
- **Kitle:** Ankara (klinik verimiz en eksiksiz burada), 18–55, ilgi alanları "Kediler",
  "Köpekler", "Evcil hayvanlar". Sonra İstanbul ve İzmir'i ayrı reklam setinde dene.
- **Yerleşim:** Reels, Hikâyeler, Akış.
- **Bütçe (öneri):** günlük 150 TL ile başla; 7 gün sonra yükleme başı maliyete bak.

### Metinler

**Sahip 1: Gece 03:00** (`sahip-01_gece-0300.mp4` / `sahip-a_acil.png`)
- Ana metin: Gece 03:00, dostun hasta. Hangi veteriner açık? Patiport en yakın açık kliniği
  bulur, tek dokunuşla aratır. Saatini bilmediğimiz bir kliniği açık göstermeyiz.
  Ücretsiz, üyelik gerekmez.
- Başlık: Acilde en yakın açık veteriner
- Düğme: Yükle

**Sahip 2: Aşı** (`sahip-02_asi.mp4` / `sahip-b_asi.png`)
- Ana metin: Karma aşı, kuduz, iç ve dış parazit. Tarihi bir kez gir; bir gün önce ve
  gününde hatırlatalım. Yapınca işaretle, sonrakini biz kuralım. Ücretsiz, reklamsız.
- Başlık: Aşı gününü unutma
- Düğme: Yükle

## Kurallar ve dikkat

- **Kişisel özellik dili kullanma.** Meta, kişinin sağlığına ya da durumuna dair bilgi
  ima eden metni reddeder ("Hasta mısın?" gibi). Metinlerimiz hayvandan söz ediyor
  ("dostun hasta"); bu kalıbı koru.
- **Sayı uydurma.** "Binlerce klinik", "en çok indirilen" gibi ifadeler yok. Kurucu klinik
  sırası ve kalan gün gerçek veriyle değişir; videolardaki "179 gün kaldı" çekim gününün
  (3 Ekim 2026) değeridir.
- Videolardaki klinik ve hasta adları örnektir ("Örnek Veteriner Kliniği", "Boncuk"). Sahip
  videosundaki klinik adları uygulamadaki herkese açık listeden gelir; uygulamada nasıl
  görünüyorsa öyle.
- Reklam incelemesi genelde 24 saat içinde biter; reddedilirse gerekçeyi oku, metni düzelt,
  yeniden gönder.
- Aynı kişi bir reklamı haftada üç-dört kereden fazla görüyorsa (Reklam Yöneticisi'nde
  "Sıklık") yeni bir video ya da görselle değiştir.

Organik paylaşım planı ve genel kurallar: `../sosyal-medya/INSTAGRAM.md`, `../sosyal-medya/REHBER.md`.
