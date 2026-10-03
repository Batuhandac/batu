# Patiport Hekim — yol haritası

Son güncelleme: 29 Eylül 2026. Rakamların kaynakları en altta.

## Nerede duruyoruz

Türkiye'de Ekim 2025 itibarıyla 9.637 veteriner kliniği ve hayvan hastanesi var;
bunların 9.387'si muayenehane (%97), 134'ü poliklinik, 116'sı hayvan hastanesi.
Sayı son 10 yılda %93'ten fazla arttı [1].

Klinik yazılımı pazarı boş değil: KolayVet, BulutVet, PratikVet, E-vet Smart, BiVet,
selfVet, CetaSoft, Fugevet, Vetes, ProKlinik, Petinoks ve ücretsiz DoldurKabı gibi en az
on iki ürün var [2][3]. KolayVet yıllık 5.990 TL'den başlayan pakette yazarkasa POS
entegrasyonu, hasta sahibi uygulaması ve WhatsApp hatırlatması sunuyor; e-Fatura üst
pakette [4]. selfVet e-SMM modülü sunuyor [3].

Sonuç: "bir klinik programı daha" olarak girersek özellik yarışına gireriz. POS
entegrasyonu tek başına fark yaratmaz; rakiplerde var.

## Bizim farkımız

Rakiplerin "hasta sahibi uygulaması" her yazılımın kendi uygulaması; sahip onu yalnızca
o klinik için indirir. Patiport'u sahip zaten kullanıyor: acilde açık klinik bulmak, aşı
ve bakım takvimi, dost kartı. Hekim panelinden girilen kayıt sahibin telefonuna
kendiliğinden düşer, sonraki aşının hatırlatması kurulur.

Yani biz iki tarafı birden bağlayan tek ürünüz:

- **Hekime:** hastası uygulamayı zaten kullanıyor; kaydı girdiği an sahibe gider, hatırlatma
  kendiliğinden kurulur, hasta geri gelir.
- **Sahibe:** her veterinerdeki kayıt tek yerde, dostunun karnesi hep cebinde.
- **Kliniğe:** Patiport'ta onaylı görünür; acilde arayan sahip doğru numaraya ulaşır.
  Sıralama satın alınamaz, bu güven hekime de iyi gelir.

## Hedef müşteri

Tek hekimli ya da küçük ekipli **muayenehaneler** (klinik sayısının %97'si). Çoğu kâğıt,
Excel ya da WhatsApp ile takip ediyor ya da bir programı yalnızca kısmen kullanıyor.
(Bu varsayım; aşağıdaki görüşmelerle doğrulanacak.)

Mevcut programını bırakmasını istemiyoruz: Patiport Hekim yanında da kullanılabilir.
Giriş kapımız ücretsiz hasta takibi ve sahibin telefonuna giden hatırlatma.

## Fiyat (varsayım)

- **Ücretsiz:** hasta kartı, aşı/parazit takibi, sahibin uygulamasına kayıt ve hatırlatma,
  WhatsApp hatırlatma bağlantısı, onaylı klinik profili.
- **Ücretli (sonra):** tahsilat (POS + e-SMM tek adımda), toplu SMS, randevu hatırlatma,
  çoklu şube. Fiyat, görüşmelerden ve bekleme listesinden sonra belirlenecek.

## Mevzuat: tahsilat neden dert

- Serbest meslek sahibi hekimler 2008'den beri kartla ödeme için POS bulundurmak zorunda;
  1 Haziran 2020'den beri POS fişi makbuz yerine geçmiyor, her tahsilat için aynı gün ayrıca
  e-Serbest Meslek Makbuzu (e-SMM) kesilmeli [5][6]. Yani iş iki ayrı adım.
- 2024'te bankalar muayenehanelerden yeni nesil yazarkasa POS istemeye başladı; Gelir İdaresi
  14.11.2024'te serbest meslek erbabının POS'unu iade etmesi gerekmediğini açıkladı [5].
- Mama/aksesuar satan ya da şirket olarak çalışan kliniklerde yazarkasaya bağlı olmayan tek
  başına banka POS'u kullanılamıyor (1.1.2016'dan beri) [7].
- 2026'da e-belge düzenlememenin cezası belge tutarının %10'u, en az 17.000 TL [8].
- Gelir İdaresi 9.7.2025'te fiziki ve sanal ödeme sistemleri için bir tebliğ taslağı
  yayımladı, 17.11.2025'te güncelledi [9]. Kesinleşip kesinleşmediği doğrulanmalı.

## Aşamalar

| Aşama | Ne | Durum |
|---|---|---|
| 1 | Hekim paneli: hasta kartı, kayıtlar (aşı, parazit, kontrol, ilaç, kilo, not), sonraki tarih önerisi, bu hafta listesi, WhatsApp hatırlatma, sahibin kodla bağlanması ve telefona otomatik kayıt | Bitti |
| 2 | Hekim tanıtım sitesi, web'den başvuru (hesap + klinik), tahsilat bekleme listesi ve kısa anket | Bitti |
| 3 | 10 klinikle görüşme (aşağıdaki sorular), ilk 20 kliniği ücretsiz alma | Sırada |
| 4 | Randevu: sahip Patiport'tan randevu ister, hekim panelden onaylar; hatırlatma | Görüşmelere göre |
| 5a | Tahsilat test modu: hasta kartında tutar yazılır, "POS'a gönder" ile `clinic_pos/{clinic_id}/sales` belgesine `pending` düşer; panelin Test POS ekranı (başka sekme ya da telefon) onaylar ya da reddeder, sonuç panelde canlı görünür, makbuz taslağı çıkar. Banka çekimi ve e-SMM yok. İkinci seçenek: iyzico deneme ortamında gerçek ödeme sayfası; hasta sahibi QR'ı telefonuyla okutup kartla öder (3D Secure dahil), sonucu ödeme sunucusu (`server/odeme`, Cloudflare Worker) iyzico'dan doğrulayıp yazar. | Bu sürüm |
| 5b | Gerçek tahsilat: klinik Ayarlar'dan kendi iyzico hesabını bağlar (anahtarlar şifreli kasada), kartla ödemeler doğrudan kliniğin hesabına geçer; nakit tahsilat. Paraşüt bağlantısıyla (authorization code, şifre bize gelmez) nakit ve canlı kart tahsilatında e-SMM ya da e-Arşiv kendiliğinden kesilir; Paraşüt API izni için başvuru gerekiyor. Yazarkasa POS cihazı bağlantısı sonra. | Bu sürüm (Paraşüt izni bekleniyor) |
| 6 | Toplu SMS / WhatsApp Business, stok, çoklu şube | Sonra |

## Görüşme soruları (her klinikle 15 dakika)

1. Şu an hasta kaydını neyle tutuyorsunuz? (program adı / kâğıt / Excel)
2. Aşı hatırlatmasını nasıl yapıyorsunuz, ne kadar vakit alıyor?
3. Kartla ödemede POS'tan sonra makbuzu nasıl kesiyorsunuz? Günde kaç kez?
4. Hangi yazarkasa / POS markası? Hangi e-SMM ya da e-Arşiv programı?
5. Programınızda en çok neye sinirleniyorsunuz?
6. Hastanın telefonuna kayıt ve hatırlatma kendiliğinden gitse ne değişir?
7. Bunun için ayda ne öderdiniz?

## Ölçeceklerimiz

- Başvuran klinik, onaylanan klinik, haftada en az bir kayıt giren klinik
- Kodla bağlanan dost sayısı; hatırlatma sonrası geri gelen hasta (klinik bildirimi)
- Tahsilat bekleme listesindeki klinik ve anket cevapları (POS markası, e-SMM programı)

## Kaynaklar

1. Türkiye'de Veteriner Klinikleri — İnteraktif Rapor 2026 (Vet. Hek. A. Sercan Topcan, Burdur Mehmet Akif Ersoy Üniv. doktora çalışması): https://www.vettingforvets.org/
2. En İyi Veteriner Yazılımı Karşılaştırması 2026 (Vetes'in kendi blogu; tarafsız değil): https://vetesveteriner.com/blog/en-iyi-veteriner-yazilimi/
3. Web araması, Eylül 2026: selfVet https://selfvet.com/ , CetaSoft https://www.cetasoft.com.tr/veteriner/ , DoldurKabı https://www.doldurkabi.com/veteriner-yazilimi , ProKlinik https://sys.proklinik.net/ , Fugevet https://fugevet.com/
4. KolayVet fiyatları: https://www.kolayvet.com/fiyatlar
5. Gaziantep-Kilis Tabip Odası, muayenehanelerde POS kullanımı: https://www.gazianteptabip.org.tr/genel/muayenehanelerde-pos-cihazi-kullanimina-iliskin-uygulama-sorunlari-hakkinda-bilgilendirme-notu/
6. Hekim POS uygulaması sona erdi mi? https://www.muhasebetr.com/yazarlarimiz/ozcanugurluoglu/001/
7. YN ÖKC zorunluluğu 2026: https://www.musavirrotasi.com/blog/yn-okc-zorunlulugu-2026da-isletmeleri-nasil-etkileyecek
8. 2026 e-belge ceza tutarları: https://vergiteknolojileri.com.tr/2026-yili-elektronik-belge-duzenlenmemesine-iliskin-ceza-tutarlari
9. PwC, Fiziki ve Sanal Ödeme Sistemlerine İlişkin Genel Tebliğ Taslağı: https://www.pwc.com.tr/tr/hizmetlerimiz/vergi/dolayli-vergi/bultenler/e-donusum-bultenleri/2025/fiziki-ve-sanal-odeme-sistemlerine-iliskin-genel-teblig-taslagi-hazilanmistir.html
10. Pavo bulut entegrasyonu (Menulux Wiki): https://wiki.menulux.com/tr/pavo-yazarkasa/menulux-tarafindan-yapilacaklar
