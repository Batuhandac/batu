# Patiport — satış planı ve aylık gelir modeli

Son güncelleme: 29 Eylül 2026. Rakam ve iddiaların kaynakları en altta. "Varsayım" yazan
yerler doğrulanmamıştır; görüşmelerle test edilecek.

## 1. Kısa cevap

- Klinik yazılımı pazarı **kalabalık ve ucuz**. Temel özellikler (hasta kaydı, aşı hatırlatma,
  randevu, WhatsApp, POS, e-SMM) rakiplerde ayda 1.000 TL civarına, yıllık alınırsa ayda
  ~400 TL'ye var; ücretsiz seçenekler de var [1][2][5].
- "Veterinerin kaydı sahibin telefonuna düşsün" fikri de **bize özel değil**: Pet Takip bunu
  hekimlere ücretsiz veriyor [3].
- Bu yüzden özellik yarışına girip "bir klinik programı daha" olarak satamayız. Hekim, ancak
  **ona para kazandıran** şeye aylık öder: yeni hasta, geri gelen hasta, daha hızlı tahsilat.
- Bizim elimizde rakiplerin olmayan bir şey var: **sahibin acil ve günlük kullandığı uygulama**
  (açık klinik bulma, Ankara'daki odaya kayıtlı 570 klinik, klinikle mesajlaşma) ile **hekim
  panelinin** aynı üründe olması. Satış buna dayanmalı: *"Patiport size hasta getirir ve
  hastanızı geri getirir; tahsilatı da tek adımda yapar."*

## 2. Rakipler (Eylül 2026)

### Klinik yazılımları

| Ürün | Fiyat | Öne çıkan | Kaynak |
|---|---|---|---|
| KolayVet | Standart 999 TL/ay ya da 5.990 TL/yıl; Profesyonel 1.990 TL/ay ya da 11.900 TL/yıl; S Plus 4.990 TL/ay | Hatırlatma, WhatsApp, 3 kullanıcı, yılda 1.000 SMS; üst pakette e-Fatura, stok, çoklu şube | [1] |
| BulutVet | 1.000 TL + KDV/ay ya da 4.750 TL + KDV/yıl, tüm özellikler | Randevu, sahip uygulaması ve online randevu, WhatsApp, POS entegrasyonu, e-SMM, sınırsız kullanıcı, 14 gün deneme | [2] |
| selfVet | Sitede fiyat yok (deneme sonrası) | SMS hatırlatma, online randevu, e-Fatura/e-SMM, **ücretsiz veri aktarımı** | [4] |
| DoldurKabı | **Ücretsiz**, komisyon yok | Online randevu, hasta takibi, reçete, fatura, stok | [5] |
| Veterinerhekimim.com | — | Tahsilat için **ödeme linki** (SMS), taksit | [5] |
| PratikVet, E-vet Smart, BiVet, VetApp, Vetc | Çoğu fiyat vermiyor | Randevu, stok, kasa, WhatsApp toplu hatırlatma | [5][6] |

### Sahip uygulamaları

| Ürün | Ne yapıyor | Kaynak |
|---|---|---|
| Pet Takip | Ücretsiz, reklamsız; 26 aşı protokolü, 3 kademeli hatırlatma; **hekimlere ücretsiz Veteriner Paneli** (kod ya da WhatsApp davetiyle bağlanma, kayıt sahibin telefonuna "onaylı" düşer) | [3] |
| Petinoks | Aşı takibi, en yakın veteriner, NFC/QR künye; pet taksi, gezdirme, kuaför, mama satışı | [7] |
| CanDostum, Petcare | Bakım takibi | [8] |

**Dürüst sonuç:** Hasta kaydı + hatırlatma + sahibe aktarma artık "olması gereken" şey; bunu
ücretsiz vermeye devam etmeliyiz (Pet Takip ücretsiz), ama bunun için para isteyemeyiz.

## 3. İnsanlar neden Patiport'a geçsin?

### Hekim için (geçiş fırsatları)

1. **Hasta getiren uygulama.** Klinik yazılımları araçtır, müşteri getirmez. Patiport'ta sahip
   acilde ya da "yakınımdaki veteriner" ararken kliniği görür, arar, mesaj atar, randevu ister.
   Sıralama satın alınamaz; onaylı klinik doğru bilgiyle görünür. *(Randevu isteği henüz yok,
   §6'da ilk iş.)*
2. **Hasta geri gelir, SMS parası ödemeden.** Hatırlatmalar sahibin telefonuna bildirim olarak
   gider; rakiplerde hatırlatma çoğunlukla paket içindeki SMS kredisiyle yapılıyor [1][4]. Panel, hatırlatmadan sonra kaç
   hastanın geldiğini gösterirse (§6) hekim parasının karşılığını görür.
3. **Tahsilat tek adımda, POS'suz da olur.** Tutar panelden gider; sahip QR ya da linkle
   telefonundan öder, sonuç panele düşer (iyzico ile çalışıyor, deneme ortamında). Sırada
   e-SMM'nin kendiliğinden kesilmesi: mevzuat her kart tahsilatı için ayrıca e-SMM istiyor, bu
   gerçek bir dert (bkz. HEKIM_YOL_HARITASI.md).
4. **Taşımak zorunda değil.** Mevcut programının yanında kullanır. Taşımak isterse Excel/CSV
   ile hastalarını **biz aktarırız** (rakipte de var [4], yoksa geçişte eksik kalırız).
5. **Erken erişim ve kurucu klinik (yayında):** tahsilat ve e-belge dahil her şey 31 Mart
   2027'ye kadar ücretsiz; bu dönemde panele giren ilk 50 kliniğin fiyatı ücretli paket
   geldiğinde 31 Mart 2029'a kadar sabit. Fiyat en az 30 gün önce duyurulur; ücretli pakete
   geçmeyen klinik ücretsiz pakette kalır, kayıtları silinmez. Panel sırayı ve kalan günü
   gösterir (`lib/pos/plan.ts`).

### Sahip için

1. **Veterinerin kaydı kendiliğinden gelir;** elle girmek yok (Pet Takip'te de var, eşitiz).
2. **Acilde açık klinik:** Ankara'da odaya kayıtlı tüm klinikler, telefon ve yol tarifiyle.
   Baktığımız sahip uygulamalarında bu yok; Petinoks'ta yalnızca "en yakın veteriner" var [7].
3. **Klinikle mesaj, randevu ve ödeme tek yerde.**
4. **Ücretsiz, reklamsız.** Sahip tarafında ücret almayacağız; ağ büyüdükçe hekim tarafı değerlenir.
5. *(Sonra)* Kâğıt aşı karnesinin fotoğrafından kayıtları içeri alma: kâğıttan ya da başka
   uygulamadan geçişi kolaylaştırır.

## 4. Gelir modeli (varsayım, görüşmelerle test edilecek)

İlke: **Temel ücretsiz, para kazandıran ücretli.** Sahip tarafı hep ücretsiz.

| Paket | Fiyat (öneri) | İçerik |
|---|---|---|
| Ücretsiz | 0 TL | Hasta kartları, kayıtlar, sahibe aktarma ve hatırlatma, WhatsApp hatırlatma, onaylı profil |
| **Patiport Pro** | **399 TL/ay** ya da **3.990 TL/yıl** (+KDV) | Patiport'tan randevu istekleri, klinik mesaj kutusu, "hatırlatmadan geri gelen hasta" raporu, birden çok hekim, CSV dışa aktarma, zengin profil (fotoğraf, hizmetler), öncelikli destek |
| **Tahsilat** | Pro'ya dahil; kart işlemi başına iyzico komisyonu (+ küçük Patiport payı, sözleşmeye göre) | QR/link ile ödeme, makbuz, sonra e-SMM'nin kendiliğinden kesilmesi |

Neden 399 TL: Rakiplerin aylık fiyatı 999–1.000 TL, yıllık fiyatları ayda ~400–500 TL'ye
denk geliyor [1][2]. Biz tam bir klinik programı değil, yanında kullanılan bir "hasta getir,
geri getir, tahsil et" ürünüyüz; altında durmalıyız. Görüşmelerdeki "ayda ne öderdiniz" cevabı
fiyatı belirleyecek.

**Otomatik aylık tahsilat:** iyzico'nun abonelik (Subscription) API'si var [9]; klinik kartını
bir kez girer, her ay otomatik çekilir. Kurulumu ödeme sunucusuna eklenebilir.

### Aylık gelir senaryoları (yalnızca hesap, tahmin değil)

Türkiye'de 9.637 klinik var [10]. 399 TL/ay Pro ile:

| Ücretli klinik | Kapsama | Aylık abonelik geliri |
|---|---|---|
| 50 | %0,5 | 19.950 TL |
| 200 | %2,1 | 79.800 TL |
| 500 | %5,2 | 199.500 TL |

Tahsilat payı bunun üstüne eklenir; oranı iyzico sözleşmesinden sonra hesaplanır.

## 5. İlk 90 gün: satış planı

**Tek şehir: Ankara.** Elimizde odanın 570 kliniği telefonlarıyla var ve uygulama bunların
hepsini gösteriyor. Ağ etkisi tek şehirde yoğunlaşınca işe yarar.

| Hafta | İş | Hedef |
|---|---|---|
| 1–2 | 10 klinikle 15 dakikalık görüşme (HEKIM_YOL_HARITASI.md'deki sorular); Çankaya ve Etimesgut'tan başla | Fiyat ve en çok istenen özellik |
| 2–4 | Kurucu klinik teklifiyle ilk 20 klinik; her kliniğe kayıt masası için QR'lı afiş: "Aşı karnen telefonunda: Patiport" | 20 aktif klinik |
| 4–8 | Kliniklerden gelen sahipleri bağla (kod); Instagram içerikleri (kit hazır) | Klinik başına 30 bağlı dost |
| 8–12 | Pro'yu aç, ilk ücretli klinikler; tavsiye: getirdiğin her klinik için 1 ay ücretsiz | 10 ücretli klinik |

Ölçülecekler: haftada en az bir kayıt giren klinik, bağlı dost sayısı, hatırlatma sonrası gelen
hasta, randevu isteği sayısı, ücretliye geçen klinik, ayrılan klinik.

## 6. Satmak için sıradaki geliştirmeler (öncelik sırasıyla)

1. **Randevu isteği:** sahip klinik sayfasından ister, hekim panelden onaylar, iki tarafa
   hatırlatma. "Hasta getirir" sözünün kanıtı ve Pro'nun ana özelliği.
2. **Geri gelen hasta raporu:** hatırlatma gönderilen hastalardan kaçının kliniğe döndüğü.
   Hekimin "parama değiyor mu?" sorusunun cevabı.
3. **Excel/CSV ile hasta aktarımı:** geçiş engelini kaldırır.
4. **Paket ve abonelik altyapısı:** klinik paketi, erken erişim, kurucu klinik sırası ve
   (kapalı) özellik kilidi hazır. Kalan: iyzico aboneliğiyle aylık otomatik ödeme ve kliniğe
   aylık fatura. Önce şirket, vergi kaydı ve Patiport adına iyzico üye işyeri hesabı gerekir.
5. **e-SMM:** tahsilatın ardından makbuzun kendiliğinden kesilmesi (sağlayıcı seçimi ve mali
   müşavir görüşü gerekli).

## 7. Riskler

- **Pet Takip** sahip tarafında ve hekim panelinde ücretsiz rakip. Farkımız acil/klinik bulma,
  mesaj, randevu ve tahsilat olmalı; kayıt aktarımı tek başına fark değil.
- **Tavuk-yumurta:** Sahip yoksa hekim randevu almaz, hekim yoksa sahip gelmez. Tek şehir ve
  klinik üzerinden sahip toplama bu yüzden.
- **Ücretsiz klinik yazılımları** (DoldurKabı) fiyat baskısı yaratır; Pro'nun değeri "yazılım"
  değil "gelen hasta" olmalı.
- Tahsilat ve e-SMM mevzuata bağlı; canlıya geçmeden mali müşavir kontrolü şart.

## Kaynaklar

1. KolayVet fiyatları: https://www.kolayvet.com/fiyatlar
2. BulutVet fiyatları: https://bulutvet.com/pricing
3. Pet Takip: https://pettakip.app/
4. selfVet: https://selfvet.com/ ve https://selfvet.com/paketler.php
5. Web araması, Eylül 2026: DoldurKabı https://www.doldurkabi.com/veteriner-yazilimi , Veterinerhekimim.com https://veterinerhekimim.com/ , VetApp https://www.vetapp.com.tr/ , Vetc https://www.vetcyazilim.com/
6. En İyi Veteriner Yazılımı Karşılaştırması (Vetes'in blogu, 14 Ağustos 2025; tarafsız değil): https://vetesveteriner.com/blog/en-iyi-veteriner-yazilimi/
7. Petinoks: https://petinoks.app/
8. CanDostum ve Petcare: docs/ARASTIRMA.md
9. iyzico Abonelik API: https://docs.iyzico.com/en/getting-started/preliminaries/api-reference-beta/subscription/subscription/initialize-subscription
10. Türkiye'de Veteriner Klinikleri — İnteraktif Rapor 2026: https://www.vettingforvets.org/ (bkz. HEKIM_YOL_HARITASI.md)
