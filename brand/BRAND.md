# Patiport — Marka Rehberi

Patiport, evcil hayvanı olan birinin hem her gün hem de acil anında açtığı uygulamadır.
Tasarım sade ve tanıdık ama soğuk değil: günlük ekranlarda tombul maskotlar ve pastel
renkler sevimlilik katar, acil ekranları sakin ve ciddi kalır. Gerekçeler ve kaynaklar:
`docs/ARASTIRMA.md`.

## İsim

**Patiport** = pati + port. "Port" hem kapı ve merkez demek, hem de kulağa "pasaport" gibi
gelir: dostunun sağlık pasaportu, açık veterinere açılan kapı ve bakımla ilgili her şey tek
yerde. Türkçe karakter içermez; Türkiye'de ve yurt dışında aynı yazılır, aynı okunur
(pa-ti-port). Konum iğnesi içindeki pati logosu bu anlamı taşır.

- Yazımı her zaman **Patiport**: tek kelime, yalnızca ilk harf büyük. "PatiPort", "Pati Port"
  ya da "PATIPORT" yazılmaz (sağlık kartı başlığı gibi büyük harfli yerlerde "PATİPORT").
- Ekler kesme işaretiyle: Patiport'a, Patiport'ta, Patiport'u, Patiport'un.
- Eski adı "Pati SOS"tu. App Store'da başka bir geliştiricinin benzer adlı uygulaması olduğu
  için değişti. Cihazdaki kayıt anahtarları (`patisos:*`) ve bundle ID (`com.patisos.app`)
  kullanıcı verisi kaybolmasın diye aynı kaldı.

## İlkeler

1. **Az renk.** Sıcak açık zemin, beyaz gruplar, tek marka rengi. Pasteller yalnızca dostlar ve duyurular için.
2. **Samimi yazı.** Başlıklarda tombul Baloo 2, metinde yumuşak ve okunaklı Nunito.
3. **Süs yok, sevimlilik var.** Gölge, çerçeve, gradyan, ikon dairesi, hap etiket ve parıltı
   kullanılmaz. Sevimlilik maskotlardan, pastel zeminlerden ve yumuşak köşelerden gelir.
4. **Her ekranda tek ana iş.** Dolgulu düğme ekranda bir tane olur; diğerleri gri ya da yazı.
5. **Somut metin.** "Dostunun yanındayız" gibi genel sloganlar yerine ne yaptığını söyleyen cümleler.

## Maskotlar

Tombul kedi, köpek ve tavşan ("Diğer" türler için) yüzleri: `lib/art/faces.ts` (çizim),
`components/art` (`PetFace`, `Peek`). Uygulama ve pazarlama görselleri aynı çizimi kullanır.

- **İfadeler:** mutlu, uykulu, göz kırpan, şaşkın.
- **Tüy renkleri:** turuncu, krem, gri, kahve, beyaz, siyah (kehribar gözlü). Kullanıcı
  dostunu eklerken seçer; fotoğraf eklerse fotoğraf görünür.
- **Kenardan bakma (`Peek`):** yüz bir kartın arkasında, patiler kartın üstünde.
- **Nerede:** dost avatarı (fotoğraf yoksa), duyuru kartları, boş ekranlar, karşılama, rol seçimi,
  ayarların altı, sosyal medya ve App Store görselleri.
- **Nerede değil:** acil ekranı, ilk yardım, hata mesajları. Panik anında sevimlilik dikkat dağıtır.
- Yüzün çizgileri değiştirilmez; yeni ifade gerekirse `faces.ts`'e eklenir. Yapay zekâ ile
  üretilmiş hayvan görseli kullanılmaz.

## Logo

Konum iğnesinin içinde pati: *yakınındaki veteriner*. Tek renk.

| Dosya | Kullanım |
| --- | --- |
| `logo-mark.svg` | Uygulama içi işaret (`components/ds/Logo.tsx` ile aynı çizim) |
| `logo-lockup.svg` | İşaret ve "Patiport" yazısı; web, basın, sosyal medya |
| `app-icon.svg` | iOS ikon kaynağı → `assets/icon.png` |
| `adaptive-icon.svg` | Android adaptive ön plan → `assets/adaptive-icon.png` |
| `splash.svg` | Açılış ekranı → `assets/splash.png` |
| `notification-icon.svg` | Tek renk bildirim ikonu |

- Yazı: **Patiport**, sistem yazı tipinde kalın, tek renk.
- İşaretin çevresinde en az iğne genişliğinin %25'i kadar boşluk bırakılır.
- Logo döndürülmez; gölge ya da efekt eklenmez; renkleri değiştirilmez.

## Renkler

| Rol | Açık tema | Koyu tema | Ne zaman |
| --- | --- | --- | --- |
| Marka (yeşil) | `#23845E` | `#5CC79C` | Bağlantılar, ana düğme, seçili sekme, "açık" durumu |
| Acil (kırmızı) | `#D92D20` | `#E5483B` | Yalnızca acil eylem, alerji/ilaç uyarısı ve silme |
| Uyarı (kehribar) | `#A15C07` | `#F5A524` | "Bugün", "yarın", "saat bilinmiyor" |
| Zemin | `#F5F3EF` | `#1F1C19` | Ekran arka planı (sıcak açık gri / sıcak kakao) |
| Yüzey | `#FFFFFF` | `#2A2622` | Kartlar ve liste grupları |
| Metin | `#111214` | `#F7F2EB` | Ana metin |
| İkincil metin | `#5E5E63` | `#C9C0B4` | Açıklamalar |

**Pastel zeminler** (yalnızca dost kartları, duyurular, maskot arka planları):
şeftali `#FFE4D6`, tereyağı `#FFF0C7`, nane `#D9F2E3`, gökyüzü `#D9EAFB`, lila `#E9E1FA`,
gül `#FBE0E8`. Koyu temada aynı tonların koyu karşılıkları kullanılır. Her dostun rengi
kimliğinden gelir ve hep aynı kalır.

Tüm değerler `lib/theme/index.ts` ve `lib/art/faces.ts` içindedir; ekranlarda elle renk kodu yazılmaz.

## Tipografi

- **Baloo 2** (600, 700): ekran başlıkları, bölüm başlıkları, dost adları, düğmeler. Tombul ve
  samimi; maskotlarla aynı dili konuşur.
- **Nunito** (500, 600, 700, 800): metin, açıklama, liste satırları. Yuvarlak uçlu ama küçük
  boyda da okunaklı.
- İkisi de Türkçe karakterleri doğru çizer (denendi: ş, ğ, ı, İ). Fredoka denendi ve
  elendi; "ş" harfinin çengeli kayıyor.
- Ölçek: `display` 34, `title` 28, `headline` 21, `body` 17, `callout` 16, `caption` 13.
- Kalın metin için `fontWeight` yazılır; Text bileşeni aynı ailenin doğru kesimini seçer
  (`fontFor`).
- Grup başlıkları (`overline`) küçük harfle yazılır; Text bileşeni Türkçe kurala göre büyütür
  (`trUpper`: `i → İ`, `ı → I`).

## Bileşenler

- **Liste grupları** (`Group`, `ListRow`): beyaz, 20 px köşe, ince ayırıcı ikondan sonra başlar.
  Satır ikonları pastel yuvarlak kare içinde dolu ikon (iOS Ayarlar düzeninin sıcak hâli).
- **Düğmeler**: hap biçimli; dolgulu (ana iş), gri (ikincil), yazı (üçüncül). Çerçeveli düğme yok.
- **Seçim düğmeleri** (`Chip`, `Segmented`): hap biçimli.
- **Durum**: renkli kısa metin, gerekiyorsa önünde nokta (`Badge`). Arka planlı hap yok.
- **Bakım satırı**: solda yuvarlak "yapıldı" düğmesi; basınca pati damgası ve "Aferin" mesajı.
- **Dost kartı**: dostun pastel renginde, büyük yüz ya da fotoğraf, adı ve sıradaki bakım.
- **Boş ekran**: maskot (günlük ekranlarda) ya da gri ikon (hata ekranlarında), bir başlık,
  bir cümle, bir düğme.
- **Görsel**: maskotlar ve kullanıcının kendi dost fotoğrafı dışında çizim ya da stok görsel kullanılmaz.

## İkonlar

Yalnızca **Ionicons** (`components/ds/Icon.tsx`). Pastel kutucuk içinde dolu sürüm, tek başına
kullanıldığında çizgi (`-outline`) sürüm.
Emoji kullanılmaz; ne arayüzde ne bildirimlerde ne paylaşılan metinlerde.

## Dil ve ses

- "Sen" diliyle, kısa, sıcak cümleler. Selamlaşır ("Merhaba Deniz!"), küçük başarıları kutlar
  ("Aferin, yapıldı."). Suçlamayan, korkutmayan. Acil ekranında sakin ve net.
- Önce eylem: "Şimdi ara", "Yol tarifi", "Takvime ekle".
- Bilmediğimizi söyleriz: saati bilinmeyen klinik asla "açık" gösterilmez.
- İlk yardım içeriği tedavi değildir; her zaman "veterinerin söyledikleri önce gelir".
- Hayvanlar için "dostun"; teknik terim yerine gündelik Türkçe.

## Tema

Açık ve koyu tema cihaz ayarını izler (`app.json` → `userInterfaceStyle: automatic`).
Koyu temada zemin sıcak bir kakao-gridir (`#1F1C19`), kartlar bir ton açık (`#2A2622`).
Tam siyah soğuk ve kasvetli duruyordu; bu tonlar gece gözü yormaz ama pastel maskotlarla
sıcak kalır.
