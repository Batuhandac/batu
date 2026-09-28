# Patiport — Sosyal medya rehberi

> Instagram için hazır açılış paketi (sıra, metinler, Reels, kurulum): `INSTAGRAM.md`.

Uygulamadaki sade dilin sosyal medyadaki karşılığı. Amaç takipçi toplamak değil,
insanların acil anında Patiport'u hatırlaması ve her gün bakım takvimi için açması.
Tasarım ve dil kuralları `brand/BRAND.md`, arka plandaki araştırma `docs/ARASTIRMA.md`.

## 1. Kime konuşuyoruz?

| Kitle | Nerede | Ne istiyor |
| --- | --- | --- |
| Kedi ve köpek sahipleri (25–45 yaş, büyükşehir) | Instagram, TikTok | Acil anında ne yapacağını bilmek, aşı günlerini unutmamak |
| Yeni sahiplenenler | Instagram, TikTok | İlk aşılar, ilk veteriner, temel bakım |
| Veteriner hekimler ve klinikler | LinkedIn, Instagram | Doğru klinik bilgisi, hasta sahiplerinden düzenli soru ve mesaj |

## 2. Hesaplar

Instagram hesabı: `@patiport`. Açılan `@patisos.app` hesabının kullanıcı adını
Ayarlar → Profili düzenle → Kullanıcı adı'ndan `patiport` yap; takipçiler korunur. Diğer
platformlarda da aynı adı kullan (TikTok, X, YouTube: `patiport`); alınmışsa `patiport.app`.

**Instagram biyografisi** (150 karakter sınırı):

> Acilde en yakın açık veteriner. Aşı ve bakım takvimi, sağlık kartı, veterinere soru. Ücretsiz, reklamsız.

**TikTok biyografisi** (80 karakter sınırı):

> Acilde en yakın açık veteriner. Aşı takvimi ve ilk yardım.

**LinkedIn / X**:

> Patiport, evcil hayvan sahipleri için acil veteriner bulucu ve bakım takvimi. Veteriner hekimlere ücretsiz ve reklamsız doğrulanmış klinik profili sunar.

Biyografi bağlantısı: App Store sayfası yayına girince o bağlantı. O zamana kadar bağlantı koyma.
İletişim: destek@patiport.app

## 3. Görsel kurallar

- Renkler uygulamayla aynı: pastel zeminler (şeftali `#FFE4D6`, tereyağı `#FFF0C7`, nane `#D9F2E3`,
  gökyüzü `#D9EAFB`, lila `#E9E1FA`, gül `#FBE0E8`) ya da beyaz, yazı `#111214`, marka yeşili
  `#23845E`. Kırmızı (`#D92D20`) yalnızca uyarı gönderilerinde.
- **Maskotlar:** tombul kedi, köpek ve tavşan (`lib/art/faces.ts`). Telefonun ya da kartın
  kenarından bakarlar ya da köşede dururlar. Bilgi sayfalarında (5 durum dizisinin iç sayfaları)
  maskot kullanılmaz; ciddi bilgi sade kalır.
- Yazı tipleri uygulamayla aynı: başlıkta **Baloo 2** (kalın), metinde **Nunito**. İkisi de
  Google Fonts'ta ücretsiz; Canva'da yoksa yüklenebilir. Bir görselde en fazla iki yazı boyutu.
- Görselde tek fikir: bir başlık, en fazla iki satır açıklama, gerekiyorsa bir uygulama ekranı.
- Gradyan, parıltı, gölge ve emoji yok. Sevimlilik maskotlardan gelir.
- Yapay zekâyla üretilmiş hayvan fotoğrafı ya da stok fotoğraf yok. Fotoğraf gerekirse
  yalnızca izin alınmış gerçek dost fotoğrafları.
- Logo sol üstte küçük. Logonun rengi değiştirilmez.

## 4. Hazır görseller (`gorseller/`)

| Dosya | Boyut | Ne için |
| --- | --- | --- |
| `profil.png` | 1080×1080 | Profil fotoğrafı (logo; tüm platformlar) |
| `profil-maskot.png` | 1080×1080 | Profil fotoğrafı seçeneği (maskot; TikTok ve Instagram için daha sıcak) |
| `kapak-1500x500.png` | 1500×500 | X ve LinkedIn kapak görseli |
| `one-cikan-acil.png`, `-bakim`, `-sor`, `-ilkyardim` | 1080×1920 | Instagram öne çıkan hikâye kapakları |
| `01_tanitim.png` | 1080×1350 | Tanıtım gönderisi |
| `02_insan-ilaci.png` | 1080×1350 | Uyarı: insan ilacı verme |
| `03_takvim.png` | 1080×1350 | Aşı hatırlatması özelliği |
| `04_veterinere-sor.png` | 1080×1350 | Veterinere sor özelliği |
| `05_4-ekim.png` | 1080×1350 | 4 Ekim Hayvanları Koruma Günü |
| `06a` … `06g` | 1080×1350 | Kaydırmalı gönderi: beklemeden veterinere gitmen gereken 5 durum (7 sayfa) |
| `07_hikaye-acil.png`, `08_hikaye-bakim.png` | 1080×1920 | Hikâye |
| `00_merhaba.png`, `09_maskotunu-sec.png`, `10_kim-patron.png` | 1080×1350 | Açılış gönderileri (tanışma, maskot, etkileşim) |
| `../reels/*.mp4` | 1080×1920 | Reels: Gece 03:00, aşı 10 saniyede, maskotunu seç (sessiz; müzik Instagram'da eklenir) |

App Store ekran görüntüleri aynı dille yenilendi: `store/screenshots/01_acil.png` … `07_gece.png`.

Hikâyelerdeki "Yakında App Store'da" satırı yayından sonra "App Store'da: Patiport" olarak değiştirilmeli.

## 5. İçerik dağılımı

| Tür | Oran | Örnek |
| --- | --- | --- |
| Acil bilgi ve ilk yardım | %40 | 5 acil durum, insan ilacı, zehirlenme |
| Bakım ve mevsim | %30 | Aşı günü, parazit, kış ve antifriz, yaz ve sıcak |
| Veterinere sor | %20 | Haftanın sorusu: soran ve yanıtlayan hekim izin verirse |
| Uygulama | %10 | Yeni özellik, nasıl kullanılır |

**Sıklık**

- Instagram: haftada 3 gönderi (Pzt, Çar, Cum 20:00) ve 3–5 hikâye.
- TikTok ve Reels: haftada 2 kısa video.
- LinkedIn: haftada 1, hekimlere yönelik.

Akşam 20:00, pet sahiplerinin telefona en çok baktığı saatlerden biri olarak bir başlangıç
tahminidir. İlk ay sonunda kendi istatistiklerine göre güncelle.

## 6. İlk dört hafta (28 Eylül – 25 Ekim 2026)

| Tarih | Platform | Biçim | Görsel | Metin |
| --- | --- | --- | --- | --- |
| 28 Eyl Pzt | Instagram | Gönderi | `01_tanitim.png` | A |
| 30 Eyl Çar | Instagram | Kaydırmalı | `06a`–`06g` | B |
| 1 Eki Per | TikTok, Reels | Video | Video 1 | V1 |
| 2 Eki Cum | Instagram | Gönderi | `02_insan-ilaci.png` | C |
| 4 Eki Paz | Instagram, LinkedIn | Gönderi | `05_4-ekim.png` | D |
| 5 Eki Pzt | Instagram | Gönderi | `03_takvim.png` | E |
| 6 Eki Sal | LinkedIn | Yazı | Yok ya da `kapak-1500x500.png` | L1 |
| 7 Eki Çar | Instagram | Gönderi | `04_veterinere-sor.png` | F |
| 8 Eki Per | TikTok, Reels | Video | Video 2 | V2 |
| 9 Eki Cum | Instagram | Hikâye | `07_hikaye-acil.png` | Kısa: "Acil anında en yakın açık veteriner." |
| 12 Eki Pzt | Instagram | Gönderi | `06d_5-durum-3.png` tek başına | G |
| 14 Eki Çar | Instagram | Gönderi | Haftanın sorusu (izinliyse) | H |
| 15 Eki Per | TikTok, Reels | Video | Video 3 | V3 |
| 16 Eki Cum | Instagram | Hikâye | `08_hikaye-bakim.png` | Kısa: "Aşı, parazit, kilo. Hepsi tek yerde." |
| 19 Eki Pzt | Instagram | Gönderi | `06c_5-durum-2.png` tek başına | I |
| 20 Eki Sal | LinkedIn | Yazı | Yok | L2 |
| 21 Eki Çar | Instagram | Gönderi | `01_tanitim.png` (yeniden, farklı metin) | J |
| 22 Eki Per | TikTok, Reels | Video | Video 4 | V4 |

Sonraki hafta için not: 29 Ekim Cumhuriyet Bayramı'nda birçok klinik kapalı olabilir. 28 Ekim'de
"Bayramda hangi veteriner açık?" gönderisi (`01_tanitim.png` ile) paylaş.

## 7. Hazır metinler

Hashtag'ler metnin sonunda, 3–5 tane. Emoji kullanılmaz.

**A — Tanıtım**
> Gece 03:00'te dostun hastalandığında ilk soru: hangi veteriner şu an açık?
> Patiport yakınındaki açık klinikleri bulur, tek dokunuşla aratır. Saatini bilmediğimiz bir kliniği açık göstermeyiz.
> Ücretsiz, üyelik gerekmez, reklamsız.
> #veteriner #acilveteriner #kedi #köpek #patiport

**B — Beklemeden veterinere gitmen gereken 5 durum**
> Kaydet, bir gün lazım olabilir.
> Nefes almakta zorlanma, idrar yapamayan erkek kedi, köpekte karın şişmesi ve kusamama, 5 dakikadan uzun nöbet, zehirlenme şüphesi.
> Bu durumlarda beklemek yerine kliniği ara ve yola çık. Bu içerik tedavi değildir; veterinerinin söyledikleri önce gelir.
> #ilkyardım #kedisahibi #köpeksahibi #veteriner

**C — İnsan ilacı verme**
> Parasetamol ve ibuprofen gibi ağrı kesiciler kedi ve köpekler için zehirlidir. Kediler parasetamole özellikle hassastır.
> Dostun bir ilaç yuttuysa kutusunu yanına al ve hemen veterinerini ara.
> Kaynak: FDA ve Merck Veterinary Manual.
> #kedi #köpek #evcilhayvan #ilkyardım

**D — 4 Ekim**
> Bugün 4 Ekim, Hayvanları Koruma Günü. Dostun için küçük bir iş: aşı karnesindeki tarihleri takvime ekle.
> Patiport zamanı gelince bir gün önce ve gününde hatırlatır.
> #4ekim #hayvanlarıkorumagünü #kedi #köpek

**E — Aşı takvimi**
> Karma aşı, kuduz, iç ve dış parazit. Hangisi ne zaman?
> Tarihi bir kez gir; bir gün önce ve gününde hatırlatalım. Yapınca işaretle, sonrakini biz kuralım.
> #aşıtakvimi #kedi #köpek #patiport

**F — Veterinere sor**
> Acil olmayan soruların için: beslenme, davranış, aşı, bakım.
> Onaylı veteriner hekimler ve deneyimli pati sahipleri yanıtlar. Acil bir durumdaysan soru yazma, hemen ara.
> #veteriner #kedisahibi #köpeksahibi

**G — Karın şişmesi**
> Köpeğinin karnı şişmiş, huzursuz ve kusmaya çalışıp çıkaramıyorsa bekleme. Özellikle iri ırklarda mide dönmesi olabilir; dakikalar önemli.
> Yemek ya da su verme, hemen ara ve yola çık.
> #köpek #köpeksahibi #acilveteriner

**H — Haftanın sorusu** (yalnızca soran kişi ve yanıtlayan hekim yazılı izin verirse)
> Haftanın sorusu: "[soru]"
> Veteriner hekimin yanıtı: "[yanıtın kısa özeti]"
> Sen de acil olmayan sorunu Patiport'ta sorabilirsin.
> #veteriner #kedi #köpek

**I — İdrar yapamayan kedi**
> Erkek kedin sık sık kuma gidip idrar yapamıyorsa bu bir acil durum. Saatler içinde hayati olabilir.
> "Sabah bakarız" diye bekleme; en yakın açık kliniği ara.
> #kedi #kedisahibi #acilveteriner

**J — Tanıtım (ikinci)**
> Acil anında ne söyleyeceğini de hazırladık: Patiport kliniği ararken dostunun kilosunu, alerjisini ve ilaçlarını ekranında gösterir.
> #veteriner #kedi #köpek #patiport

**L1 — LinkedIn (hekimlere)**
> Patiport'ta klinik profilleri ücretsizdir ve sıralama satın alınamaz. Hasta sahipleri en yakın açık kliniği arar; biz de saatini bilmediğimiz kliniği açık göstermeyiz.
> Kliniğinizin telefon ve çalışma saatlerini doğrulamak için uygulamadaki "Veteriner hekim misiniz?" bölümünden başvurabilirsiniz.

**L2 — LinkedIn (nasıl çalışır)**
> Hekim hesabı açan klinikler topluluktaki sorulara klinik adıyla yanıt verebilir ve hasta sahiplerinden mesaj alabilir. Yanıtlar bilgilendirme amaçlıdır; tanıtım içeriği yayınlanmaz.

## 8. Kısa video fikirleri (15–30 sn)

Hepsi gerçek uygulama ekran kaydı ve kısa bir sesle. Oyuncu, efekt ya da yapay zekâ sesi gerekmez.

1. **Gece 03:00 testi:** Uygulamayı aç, Acil'e dokun, en yakın açık klinik çıkana kadar geçen süreyi göster.
2. **Aşıyı 10 saniyede ekle:** Bakım ekle, karma aşı, tarih, kaydet. Bildirimin nasıl geleceğini göster.
3. **Acil kartı eşine gönder:** Dost profili, "WhatsApp", mesajın nasıl göründüğü.
4. **Yola çıkmadan önce:** Acil ekranındaki kontrol listesi (taşıma çantası, ambalaj, ilaçlar).
5. **Haftanın sorusu:** Hekimin izniyle, yanıtını kendisi 20 saniyede anlatsın.

## 9. Kurallar

- **Sağlık içeriği:** Her ilk yardım ya da hastalık gönderisi bir kaynağa dayanır ve yayından
  önce bir veteriner hekime okutulur. Sonunda "Bu içerik tedavi değildir; veterinerinin
  söyledikleri önce gelir." yazar.
- **Klinik tanıtımı yok:** Veteriner hekimlerin reklam ve tanıtım yapması meslek kurallarıyla
  sınırlıdır. Patiport belirli bir kliniği övmez, "en iyi klinik" demez, ücretli klinik tanıtımı
  almaz. Hekim yanıtlarında yalnızca adı ve kliniği yazılır, o da izin varsa.
- **Uydurma yok:** Sahte yorum, uydurma kullanıcı hikâyesi ya da kaynağı olmayan rakam kullanılmaz.
- **Fotoğraf izni:** Kullanıcı fotoğrafı, sahibinden yazılı izin (DM'de "paylaşabilir miyiz?"
  sorusuna "evet") alınmadan paylaşılmaz. Paylaşırken hesabı etiketlenir.
- **Kişisel veri:** DM'de sağlık bilgisi ya da adres isteme. Soruları uygulamaya yönlendir.

## 10. Yorum ve mesaj yanıtları

**Acil durum yazan birine:**
> Geçmiş olsun. Buradan teşhis koyamayız ve mesajları geç görebiliriz. Lütfen hemen bir veteriner ara. Patiport'ta "Acil veteriner bul" en yakın açık kliniği gösterir.

**Tıbbi soru soran birine (acil değilse):**
> Sorun için teşekkürler. Uygulamadaki "Topluluk" bölümünde sorarsan onaylı veteriner hekimler yanıtlayabilir. Belirtiler kötüleşirse beklemeden veterinerini ara.

**Kliniği yanlış görünen birine:**
> Haber verdiğin için teşekkürler. Klinik sayfasındaki "Hatalı bilgiyi bildir" düğmesiyle bildirirsen kontrol edip düzeltiyoruz.

**Kaba ya da saldırgan yorum:**
> Yanıt verme; gizle ya da sil. Tekrarlarsa hesabı engelle.

## 11. Ölçüm

Her pazartesi bir önceki haftaya bak:

- Kaydetme ve paylaşma sayısı (bilgi gönderilerinin asıl ölçüsü)
- Profil ziyareti ve bağlantı tıklaması
- Uygulama indirme: App Store bağlantısına kaynak kodu ekle
  (`?ct=instagram`, `?ct=tiktok`, `?ct=linkedin`). App Store Connect'te kaynağa göre indirme görünür.

İlk ay sonunda en çok kaydedilen üç gönderinin konusundan yeni gönderiler üret, en az ilgi
görenleri bırak.
