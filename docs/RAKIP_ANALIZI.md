# KolayVet ve biVet: yerlerini almak için ne gerekiyor?

Son güncelleme: 29 Eylül 2026. Özellikler rakiplerin kendi sitelerinden alındı (kendi
beyanları); kaynaklar en altta. Bu belge SATIS_PLANI.md'nin devamıdır.

## 1. Kısaca

- **KolayVet**: bulut tabanlı, fiyatları açık (Standart 999 TL/ay ya da 5.990 TL/yıl) [1].
  Özellik listesi çok geniş: kasa, stok, cari, e-Fatura/e-Arşiv/e-SMM, SMS, WhatsApp,
  TARBİL, laboratuvar ve POS entegrasyonu, hekim ve müşteri uygulaması, ücretsiz veri
  aktarımı [2]. Müşteri uygulamasının App Store'daki puanı yüksek, ama yorumlarda "haftalardır
  giremiyorum", "menüler gereksiz karmaşık", "kullanıcı deneyimi berbat" şikâyetleri var [3].
- **biVet**: 2000'den beri var, eski ve köklü; evcil hayvan, büyükbaş, laboratuvar ve çiftlik
  yazılımı yapıyor [4]. Pet kliniği ürününde yatan hasta, pansiyon, röntgen/lab yükleme,
  e-SMM/e-Fatura raporları, resmi raporlar ve formlar var [5]. Fiyat açıklamıyor, deneme
  sürümü yok; sahip uygulamasında giriş ve veri güncelleme sorunları olduğu yazılmış (rakip
  bir firmanın blogunda, tarafsız değil) [6].
- **Bugünkü durumumuz:** Hekimin günlük işinin küçük bir kısmını yapıyoruz (hasta kartı,
  aşı/kayıt, hatırlatma, sahibe aktarma, tahsilat denemesi). Bir kliniğin KolayVet ya da
  biVet'i **bırakıp** bize geçmesi için kasa, randevu takvimi, muayene kaydı, stok, cari ve
  e-SMM şart. Bunlar olmadan "yanında kullanılan ek araç" olarak kalırız.

## 2. Özellik karşılaştırması

✓ var · ~ kısmen · — rakipte sitesinde belirtilmemiş, bizde yok. Rakip sütunları kendi sitelerine göre [2][5].

| İş | KolayVet | biVet | Patiport bugün |
|---|---|---|---|
| Hasta sahibi ve hasta kartı | ✓ | ✓ | ✓ |
| Aşı takibi, otomatik aşı takvimi | ✓ | ✓ | ✓ (sonraki tarih önerisi) |
| Muayene kaydı (şikâyet, bulgu, tanı, tedavi) | ✓ | ✓ | ~ (serbest not) |
| Reçete | ✓ | ✓ | — |
| Randevu takvimi | ✓ | ✓ (sürükle-bırak, renkli) | — |
| Kasa, satış, barkodlu satış | ✓ | ✓ | ~ (yalnızca tahsilat) |
| Cari: alacak/borç, borç hatırlatma | ✓ | ✓ | — |
| Stok, son kullanma takibi | ✓ | ✓ | — |
| e-Fatura / e-Arşiv / e-SMM | ✓ | ✓ | — |
| POS / yazarkasa entegrasyonu | ✓ | ~ | ~ (iyzico ile link/QR, deneme ortamı) |
| SMS (toplu, özel başlık, İYS) | ✓ | ✓ (SMS/e-posta) | — (bildirim + WhatsApp bağlantısı) |
| WhatsApp | ✓ | — | ~ (hazır mesaj bağlantısı) |
| TARBİL / PETVET | ✓ (TARBİL) | ~ (ATS kayıtları) | — |
| Laboratuvar, röntgen dosyası | ✓ | ✓ | — |
| Yatan hasta, pansiyon | — | ✓ | — |
| Raporlar (gün sonu, hekim bazlı) | ✓ | ✓ | ~ (özet kartları) |
| Çoklu kullanıcı, çoklu şube | ✓ | ✓ | ~ (birden çok hekim; rol yok) |
| Veri aktarımı | ✓ ücretsiz, Excel şablonu | — | — |
| Sahip uygulaması | ✓ (kliniğe bağlı) | ✓ (kliniğe bağlı) | ✓ **bağımsız, sahip zaten kullanıyor** |
| Sahip acilde açık klinik bulur | — | — | ✓ (Ankara'da odaya kayıtlı 570 klinik) |
| Klinikle mesajlaşma | ~ (WhatsApp) | — | ✓ |
| Kayıt sahibin telefonuna kendiliğinden | ~ (bildirim) | ~ | ✓ |
| Fiyat açık | ✓ | — | ✓ |

## 3. Nerede kazanabiliriz

1. **Kullanım kolaylığı.** KolayVet'in kendi müşteri uygulamasında bile "karmaşık menü" ve
   "giriş yapamıyorum" şikâyetleri var [3]. Hekim panelimiz sade ve hızlı; bunu korumak en
   büyük silahımız.
2. **Sahip tarafı.** Onların sahip uygulaması tek kliniğin uygulaması; sahip onu nadiren
   açar. Patiport'u sahip acilde, aşı takvimi ve dost kartı için zaten açıyor. Hekimin
   hatırlatması, mesajı ve ödeme linki bu yüzden gerçekten görülür.
3. **Hasta getirme.** KolayVet ve biVet kliniğe yeni hasta getirmez. Patiport'ta klinik arayan
   sahip onaylı kliniği görür, arar, mesaj atar (randevu isteği sırada).
4. **Fiyat ve geçiş kolaylığı.** KolayVet müşterisi çoğunlukla yıllık öder; yenileme tarihi
   geçiş penceresidir. "Sözleşmeniz bitene kadar ücretsiz + verinizi biz taşırız" teklifi.
5. **biVet müşterisi fiyatı bilmiyor ve deneyemiyor**; açık fiyat ve 14 gün deneme burada fark.

## 4. Nerede kaybederiz (açıkça)

- Kasa, stok, cari, e-SMM olmadan bir klinik programı **yerine** geçemeyiz.
- TARBİL/PETVET ve laboratuvar entegrasyonları yıllar içinde birikmiş işler; resmî bir API'si
  olup olmadığı araştırılmalı (PETVET'e hekimler Bakanlığın verdiği şifreyle giriyor [7]).
- biVet'in hastane (yatan hasta, pansiyon, lab) tarafı bizim hedefimiz değil: Türkiye'deki
  kliniklerin %97'si muayenehane (HEKIM_YOL_HARITASI.md). Onlara odaklanırız.

## 5. Yerlerini almak için yapılacaklar (muayenehane için, öncelik sırasıyla)

| Sıra | Ne | Neden |
|---|---|---|
| 1 | **Veri aktarımı:** Excel/CSV'den sahip, hasta, aşı geçmişi (KolayVet ve biVet çıktılarına uygun şablon) | Geçişin 1 numaralı engeli; KolayVet bunu ücretsiz yapıyor |
| 2 | **Randevu takvimi** (gün/hafta, sürükle-bırak) + sahibin Patiport'tan randevu isteği | Her klinik her gün kullanıyor; "hasta getirir" sözünün kanıtı |
| 3 | **Muayene kaydı:** şikâyet, bulgu, tanı, tedavi, reçete notu; PDF aşı karnesi ve onam formu | Hekimin asıl işi; serbest not yetmez |
| 4 | **Kasa ve cari:** hizmet/ürün satışı, nakit/kart/link tahsilat, veresiye ve borç hatırlatma, gün sonu raporu | Para akışı olmadan program değiştirilmez |
| 5 | **e-SMM / e-Arşiv:** tahsilatın ardından makbuz/fatura (bir entegratör API'siyle) | Yasal zorunluluk; en büyük zaman kaybı |
| 6 | **Basit stok:** aşı ve ilaç, alış, satışta düşme, son kullanma uyarısı | Aşı ve ilaç satışı olan her muayenehane için |
| 7 | **Roller:** hekim, asistan, sekreter | Birden çok çalışanı olan klinik için |
| 8 | **SMS** (isteğe bağlı, İYS uyumlu) | Uygulaması olmayan sahipler için; WhatsApp bağlantısı şimdilik yetiyor |
| 9 | **TARBİL / PETVET** | Önce resmî entegrasyon yolu araştırılacak |

1–4 bittiğinde tek hekimli bir muayenehane KolayVet Standart'ın yerine Patiport'u kullanabilir;
5–6 ile Profesyonel paketin karşısına çıkarız.

## 6. Geçiş teklifi (KolayVet ve biVet kullananlara)

- Verinizi biz taşırız (Excel çıktısını gönderin, aynı gün panelinizde).
- Mevcut sözleşmeniz bitene kadar Patiport ücretsiz; sonra fiyatımız KolayVet Standart'ın
  altında.
- Hastalarınız Patiport'u zaten kullanıyorsa kayıtlarınız telefonlarına kendiliğinden gider.

## 7. Hemen yapılabilecek

- Ankara'da KolayVet ya da biVet kullanan 2–3 hekimden (tanıdık klinikler dahil) **bir örnek
  dışa aktarım dosyası** ve günlük iş akışının ekran görüntüleri istemek. Veri aktarımını
  gerçek dosyaya göre yazarız.
- Aynı hekimlere: "En çok neye sinirleniyorsunuz?" ve "Hangi özellik olmadan geçemezsiniz?"

## Kaynaklar

1. KolayVet fiyatları: https://www.kolayvet.com/fiyatlar
2. KolayVet ana sayfa ve özellikler: https://www.kolayvet.com/
3. KolayVet müşteri uygulaması, App Store yorumları: https://apps.apple.com/tr/app/kolayvet/id1529759106?l=tr
4. biVet hakkında: https://bivet.com.tr/index.php
5. biVet Pet Klinik özellikleri: https://biyazilim.com/petKlinik.php
6. En İyi Veteriner Yazılımı Karşılaştırması (Vetes'in blogu, tarafsız değil): https://vetesveteriner.com/blog/en-iyi-veteriner-yazilimi/
7. PETVET sistemi: https://veterian.com/tr/kaynaklar/blog/petvet-sistemi-nedir-veteriner-kliniklerinde-nasil-calisir/ ve İstanbul VHO: https://www.ivho.org.tr/karnemikrochip
