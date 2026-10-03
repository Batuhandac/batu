# App Store'a gönderim

App Store Connect'e kopyalanacak metinler, gizlilik ve yaş derecelendirmesi yanıtları,
inceleme notları ve gönderimden önce yapılacaklar. Uzunluklar Apple sınırlarına göre
sayıldı. Emoji yok (marka dili).

## Gönderimden önce yapılacaklar

Bunları yalnızca hesap sahibi yapabilir. Sırayla:

1. **Adı App Store Connect'te değiştir.** Yeni ad **Patiport** ("PatiSOS - Pet Emergency"
   başka bir geliştiricinin olduğu için değişti). App Store Connect → uygulama → App
   Information → Name: `Patiport: Açık Veteriner, Aşı` (29). Bundle ID (`com.patisos.app`)
   kullanıcıya görünmez, aynı kalır.
2. **patiport.app alan adını al ve e-postayı kur.** Biri almadan al
   (son bakıldığında boştu; Cloudflare, Namecheap ya da Squarespace, yıllık yaklaşık 15 USD). Sonra:
   - E-posta yönlendirme (Cloudflare Email Routing ücretsiz):
     `destek@patiport.app` → kendi e-postan. Şimdilik uygulama ve sayfalar doğrudan
     batuhanemreandac@gmail.com adresini yazıyor; yönlendirme kurulunca `lib/links.ts` →
     `SUPPORT_EMAIL` ve `site/*.html` içindeki adres `destek@patiport.app` yapılır.
   - Siteyi ve paneli alan adına bağla (aşağıda **Alan adı**). Eski
     `batuhandac.github.io/batu/...` bağlantıları kendiliğinden yeni adrese yönlenir;
     uygulamayı yeniden derlemek gerekmez.
   - Marka tescili için TÜRKPATENT'te "Patiport" araması yap; boşsa 44. ve 9. sınıflarda
     başvurmayı düşün.
3. **Gizlilik ve destek sayfalarını yayınla.** `site/` klasörü herkese açık
   `Batuhandac/batu` deposundan GitHub Pages ile yayınlanır:
   - github.com/Batuhandac/batu → Settings → Pages → Source: **GitHub Actions**.
   - Actions → "Site → GitHub Pages" → Run workflow.
   - Adresler: `https://batuhandac.github.io/batu/gizlilik`, `/kosullar`, `/destek`.
     Uygulama bu adresleri `lib/links.ts` üzerinden açar.
   - Gizlilik metnindeki "Veri sorumlusu" bölümüne ad-soyad ya da şirket unvanı ve
     adres eklenmeli (KVKK). Yayından önce bir hukukçuya okutmanı öneririm.
4. **Firebase'i aç** (`FIREBASE_SETUP.md`). İnceleme sırasında topluluk ve mesajlar
   çalışmazsa Apple "eksik uygulama" (2.1) diye reddeder.
   - Authentication → Sign-in method: **Anonymous** ve **Email/Password** açık.
   - Firestore → Rules: `firestore.rules` içeriğini yapıştır → Publish.
     (Şu an yayında değil: `app_banners` okuması 403 dönüyor.)
   - Storage → Rules: `storage.rules` → Publish.
5. **İnceleme için hekim hesabı.** Hazır: `inceleme@patiport.app` (şifre yalnızca App Store
   Connect'teki "Sign-in information" alanında; depoya yazma). Hesap, listelerde ve haritada
   görünmeyen "Örnek Veteriner Kliniği"nin (`patiport-ornek`, `lib/data/query.ts` →
   `DEMO_CLINIC`) onaylı hekimidir; onay `scripts/demo-account.mjs` ile yapıldı. İnceleme
   ekibinin topluluğa yazdıkları "Veteriner hekim · Örnek Veteriner Kliniği" rozetiyle
   görünür; onaydan sonra gerekirse Console'dan silersin.
6. **Moderasyon sözü.** Koşullarda ve uygulamada "bildirilen içerikleri 24 saat içinde
   inceliyoruz" yazıyor (Apple 1.2 bunu şart koşar). `content_reports` koleksiyonuna
   her gün bak (`YONETICI_REHBERI.md`).
7. **PostHog (isteğe bağlı).** `EXPO_PUBLIC_POSTHOG_KEY` tanımlı değilse uygulama hiçbir
   kullanım verisi göndermez. Tanımlarsan aşağıdaki gizlilik yanıtlarına
   "Usage Data" satırını ekle.

## Alan adı

Site, hekim paneli ve ödeme sunucusu yayın adresini GitHub Pages ayarından okur; kodda
bir şey değiştirmek gerekmez. Örnek alan adı `patiport.app`:

1. **DNS** (alan adını aldığın yerde): kök alan adı için dört `A` kaydı
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`;
   `www` için `CNAME` → `batuhandac.github.io`. DNS Cloudflare'deyse bu kayıtlarda turuncu
   bulutu kapat ("DNS only"), yoksa GitHub sertifika alamaz.
2. **Alan adını doğrula** (önerilir, başkası senin alan adını GitHub'da kullanamasın):
   GitHub → profil → Settings → Pages → Add a domain; verilen `TXT` kaydını DNS'e ekle.
3. **batu → Settings → Pages → Custom domain**: `patiport.app` → Save. DNS kontrolü yeşil
   olunca **Enforce HTTPS**'i işaretle (sertifika birkaç dakika ile bir saat arası sürer).
4. **Actions → "Site → GitHub Pages" → Run workflow.** Panel `patiport.app/app/panel`
   adresine derlenir, ödeme sunucusu yeni adresten gelen istekleri kabul eder.
5. **Firebase Console → Authentication → Settings → Authorized domains**: `patiport.app`
   ekle.
6. Kontrol: `patiport.app/hekim/`, `patiport.app/app/panel` açılıyor; panelde giriş,
   Ayarlar'dan iyzico bağlama ve bir nakit tahsilat çalışıyor.

Uygulamanın içindeki bağlantılar (`lib/links.ts`) eski adresi kullanmaya devam eder ve
yönlendirilir; bir sonraki uygulama sürümünde `SITE` yeni adrese çevrilebilir.

## Uygulama bilgileri

| Alan | Değer |
| --- | --- |
| Birincil dil | Türkçe |
| Ad (30) | `Patiport: Açık Veteriner, Aşı` (29) |
| Alt başlık (30) | `Aşı takvimi, sağlık kartı` (25) |
| Birincil kategori | Yaşam Tarzı (Lifestyle) |
| İkincil kategori | Yardımcı Araçlar (Utilities) |
| Fiyat | Ücretsiz |
| Gizlilik politikası URL'si | `https://batuhandac.github.io/batu/gizlilik` |
| Destek URL'si | `https://batuhandac.github.io/batu/destek` |
| Pazarlama URL'si | `https://batuhandac.github.io/batu/` |
| Telif hakkı | `2026 <satıcı adı>` |
| Bundle ID | `com.patisos.app` (ascAppId `6778331996`) |
| Şifreleme | Yok (`ITSAppUsesNonExemptEncryption: false`) |

Tıbbi kategori seçilmedi: Apple bu kategoride insan sağlığına yönelik ek belge ister,
Patiport evcil hayvan uygulaması.

### Tanıtım metni (170)

```
Yeni: Pati karnen! Aşıyı zamanında yap, dostunun kartını doldur, pati puanı topla, rozetleri aç. Acil anında en yakın açık veteriner her zaman tek dokunuş uzakta.
```

### Anahtar kelimeler (100)

Ad ve alt başlıktaki kelimeler (açık, veteriner, aşı, takvim, sağlık, kart) tekrar edilmez; virgülden sonra
boşluk yok.

```
acil,kedi,köpek,klinik,nöbetçi,hatırlatma,parazit,kuduz,karma,evcil,hayvan,kilo,çip,pet,bakım,rozet
```

### Açıklama

```
Dostun hastalandığında ilk soru: hangi veteriner şu an açık? Patiport en yakın açık kliniği bulur, tek dokunuşla aratır. Aşı ve parazit günlerini hatırlatır, dostunun sağlık kartını cebinde taşır. Ücretsiz, üyelik gerekmez, reklamsız.

ACİL ANINDA
- En yakın açık klinik, uzaklığı ve telefonuyla ekranında. Tek dokunuşla ara, yol tarifini al.
- Ararken ne söyleyeceğin hazır: dostunun kilosu, alerjileri ve ilaçları.
- Saatini bilmediğimiz bir kliniği açık göstermeyiz.
- İlk yardım rehberi: veterinere ulaşana kadar zarar vermemek için temel adımlar.

HER GÜN
- Aşı ve parazit takvimi: tarihi bir kez gir, bir gün önce ve gününde hatırlatalım. Yapınca işaretle, sonrakini biz kuralım.
- Dostunun sağlık kartı: doğum tarihi, kilo, çip numarası, alerjiler, ilaçlar. Kilosunu grafikte takip et.
- Fotoğrafı yok mu? Tüy rengini seç, sevimli maskotu hazır.

PATİ KARNEN
- Aşıyı zamanında yap, kartını doldur, kilosunu kaydet: pati puanı topla, seviye atla, rozetleri aç.
- Yalnızca dostunun sağlığına yarayan işler puan kazandırır.

VETERİNERE SOR
- Acil olmayan soruların için topluluk: beslenme, davranış, aşı, bakım.
- Onaylı veteriner hekimler "Veteriner hekim" rozetiyle yanıtlar.
- Mesajlaşmayı açan kliniklere uygulamadan yaz.

GİZLİLİĞİN SENDE
- Dostlarının kartları, bakım takvimin ve konumun yalnızca telefonunda durur.
- Hesap açmadan kullanabilirsin. Reklam yok, seni izlemiyoruz.

Klinik bilgileri OpenStreetMap katkıcılarından, Google Maps'ten, Apple Haritalar'dan, veteriner hekimleri odalarının klinik listelerinden ve kliniklerin kendisinden gelir. Patiport veteriner muayenesinin yerini tutmaz; dostun kötüyse hemen bir kliniği ara.
```

### Ekran görüntüleri

`store/screenshots/` içinde 8 görsel, 1290×2796 (6,9" iPhone). App Store Connect 6,5" bölümünü
istiyorsa aynı görsellerin 1284×2778 kopyaları `store/screenshots/6.5/` içinde. Bu sırayla yükle:

1. `01_acil.png` Acilde en yakın açık veteriner
2. `02_bakim.png` Aşı ve parazit gününü unutma
3. `03_kart.png` Dostunun sağlık kartı cebinde
4. `08_karne.png` Dostuna iyi bak, rozetleri topla
5. `04_sor.png` Aklına takılanı veterinere sor
6. `05_liste.png` Açık ve yakın olan önce
7. `06_ilkyardim.png` Veterinere ulaşana kadar
8. `07_gece.png` Gece 03:00'te de göz yormaz

Arama sonuçlarında ilk üçü görünür; acil, bakım ve kart en güçlü üçlü.

## Yaş derecelendirmesi

Apple sonucu yanıtlara göre kendisi hesaplar. Dürüst yanıtlar:

| Soru | Yanıt |
| --- | --- |
| Şiddet, cinsellik, küfür, korku, alkol/tütün/uyuşturucu, kumar | Yok |
| Tıbbi ya da tedavi bilgisi | Seyrek/hafif (ilk yardım rehberi ve hekim yanıtları; evcil hayvan için) |
| Kullanıcı içeriği (User-Generated Content) | Evet (topluluk soruları, yanıtlar, yorumlar, fotoğraflar) |
| Mesajlaşma | Evet (kliniklerle) |
| Reklam | Hayır |
| Sınırsız web erişimi | Hayır |
| Yarışma, çekiliş | Hayır |

## App Privacy (Gizlilik "besin etiketi")

"Data Used to Track You": **yok.** Uygulama reklam göstermez, ATT istemez, veri satmaz.

**Data Linked to You** (hepsi amaç: App Functionality):

| Kategori | Veri türü | Nerede |
| --- | --- | --- |
| Contact Info | Email Address | E-postalı hesap |
| Contact Info | Name | Hesap adı, topluluktaki görünen ad |
| Contact Info | Phone Number | Hekimlerin klinik başvurusu |
| User Content | Photos or Videos | Topluluk ve klinik fotoğrafları |
| User Content | Customer Support | Hatalı bilgi bildirimi, geri bildirim, şikâyet |
| User Content | Other User Content | Sorular, yanıtlar, yorumlar, kliniklerle mesajlar |
| Identifiers | User ID | Firebase kullanıcı kimliği (anonim ya da e-postalı) |
| Identifiers | Device ID | Uygulamanın ürettiği cihaz kimliği, bildirim anahtarı |

**Data Not Linked to You**:

| Kategori | Veri türü | Amaç | Nerede |
| --- | --- | --- | --- |
| Location | Precise Location | App Functionality | Klinik aramasında Google Maps Platform'a ve Apple Haritalar'a gider, bizde saklanmaz |
| Usage Data | Product Interaction | Analytics | Yalnızca PostHog anahtarı tanımlıysa |

Toplanmayanlar: dost kartları, bakım takvimi, kilo kayıtları, pati puanı. Bunlar
telefonda kalır; Apple'ın tanımına göre "toplanan" veri değildir.

## İnceleme notları (App Review Information → Notes)

```
Patiport, evcil hayvan sahipleri için ücretsiz bir uygulamadır. Hesap gerekmez: açılışta "Şimdilik hesapsız devam et" ile tüm sahip özellikleri kullanılabilir.

- Acil: Ana sayfanın altındaki "Acil veteriner bul" konuma göre en yakın açık klinikleri gösterir. Konum izni verilmezse ilçe seçilebilir.
- Bakım takvimi: Dostlarım sekmesinde bir dost ekleyip aşı tarihi girin; bir gün önce ve gününde yerel bildirim gelir.
- Pati karnesi: Ayarlar → Pati karnem. Puanlar telefondaki kayıtlardan hesaplanır, satın alma yoktur.
- Topluluk: Kullanıcı içeriği için her gönderide bildir ve engelle seçenekleri vardır; paylaşmadan önce topluluk kuralları kabul edilir. Bildirimleri 24 saat içinde inceliyoruz.
- Hesap silme: Ayarlar → hesap → Hesabı sil.
- Hekim paneli yalnızca onaylı veteriner hekimlere açıktır. Demo hekim hesabı "Sign-in information" alanındadır.

İçerik tıbbi tavsiye değildir; ilk yardım rehberinde ve toplulukta bu açıkça yazar.
```

"Sign-in required" işaretle ve 5. maddedeki demo hekim hesabını gir.

## Gönderme

1. `main` dalına push → iOS iş akışı build alır ve TestFlight'a yükler (`TESTFLIGHT.md`).
2. App Store Connect → Patiport → iOS App → **1.0 Prepare for Submission**.
3. Yukarıdaki metinleri, ekran görüntülerini, yaş derecelendirmesini, App Privacy
   yanıtlarını ve inceleme notlarını gir.
4. **Build** bölümünden TestFlight'taki son build'i seç.
5. **Add for Review → Submit.** İnceleme genelde 1–2 gün sürer. "Manually release"
   seçersen onaydan sonra yayın zamanını sen belirlersin.
