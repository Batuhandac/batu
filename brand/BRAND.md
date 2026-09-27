# Pati SOS — Marka Rehberi

Pati SOS, evcil hayvanı olan birinin hem her gün hem de acil anında açtığı uygulamadır.
Tasarımın görevi dikkat çekmek değil, işi kolaylaştırmak: telefonun kendi
uygulamaları gibi sade, tanıdık ve sakin. Gerekçeler ve kaynaklar: `docs/ARASTIRMA.md`.

## İlkeler

1. **Az renk.** Nötr gri zemin, beyaz gruplar, tek marka rengi. Renk yalnızca anlam taşıdığında.
2. **Sistem yazı tipi.** iOS'ta SF Pro, Android'de Roboto. Kullanıcının büyük yazı ayarına uyar.
3. **Süs yok.** Gölge, çerçeve, gradyan, ikon dairesi, hap etiket, parıltılı çizim kullanılmaz.
4. **Her ekranda tek ana iş.** Dolgulu düğme ekranda bir tane olur; diğerleri gri ya da yazı.
5. **Somut metin.** "Dostunun yanındayız" gibi genel sloganlar yerine ne yaptığını söyleyen cümleler.

## Logo

Konum iğnesinin içinde pati: *yakınındaki veteriner*. Tek renk.

| Dosya | Kullanım |
| --- | --- |
| `logo-mark.svg` | Uygulama içi işaret (`components/ds/Logo.tsx` ile aynı çizim) |
| `logo-lockup.svg` | İşaret ve "Pati SOS" yazısı; web, basın, sosyal medya |
| `app-icon.svg` | iOS ikon kaynağı → `assets/icon.png` |
| `adaptive-icon.svg` | Android adaptive ön plan → `assets/adaptive-icon.png` |
| `splash.svg` | Açılış ekranı → `assets/splash.png` |
| `notification-icon.svg` | Tek renk bildirim ikonu |

- Yazı: **Pati SOS**, sistem yazı tipinde kalın, tek renk.
- İşaretin çevresinde en az iğne genişliğinin %25'i kadar boşluk bırakılır.
- Logo döndürülmez; gölge ya da efekt eklenmez; renkleri değiştirilmez.

## Renkler

| Rol | Açık tema | Koyu tema | Ne zaman |
| --- | --- | --- | --- |
| Marka (çam yeşili) | `#1F6B52` | `#52B891` | Bağlantılar, ana düğme, seçili sekme, "açık" durumu |
| Acil (kırmızı) | `#D92D20` | `#E5483B` | Yalnızca acil eylem, alerji/ilaç uyarısı ve silme |
| Uyarı (kehribar) | `#A15C07` | `#F5A524` | "Bugün", "yarın", "saat bilinmiyor" |
| Zemin | `#F2F2F7` | `#000000` | Ekran arka planı |
| Yüzey | `#FFFFFF` | `#1C1C1E` | Kartlar ve liste grupları |
| Metin | `#111214` | `#F5F5F7` | Ana metin |
| İkincil metin | `#5E5E63` | `#AEAEB2` | Açıklamalar |

Tüm değerler `lib/theme/index.ts` içindedir; ekranlarda elle renk kodu yazılmaz.

## Tipografi

Sistem yazı tipi; ölçüler iOS metin stillerinden alınır:
`display` 34, `title` 28, `headline` 20, `body` 17, `callout` 16, `caption` 13.
Grup başlıkları (`overline`) küçük harfle yazılır, Text bileşeni Türkçe kurala göre
büyütür (`trUpper`: `i → İ`, `ı → I`).

## Bileşenler

- **Liste grupları** (`Group`, `ListRow`): beyaz, 12 px köşe, ince ayırıcı ikondan sonra başlar.
- **Düğmeler**: dolgulu (ana iş), gri (ikincil), yazı (üçüncül). Çerçeveli düğme yok.
- **Durum**: renkli kısa metin, gerekiyorsa önünde nokta (`Badge`). Arka planlı hap yok.
- **Bakım satırı**: solda yuvarlak "yapıldı" düğmesi (iOS Anımsatıcılar gibi).
- **Boş ekran**: tek gri ikon, bir başlık, bir cümle, bir düğme.
- **Görsel**: kullanıcının kendi dost fotoğrafı dışında çizim ya da stok görsel kullanılmaz.

## İkonlar

Yalnızca **Ionicons** (`components/ds/Icon.tsx`), çoğunlukla çizgi (`-outline`) sürümü.
Emoji kullanılmaz; ne arayüzde ne bildirimlerde ne paylaşılan metinlerde.

## Dil ve ses

- "Sen" diliyle, kısa ve sakin cümleler. Suçlamayan, korkutmayan.
- Önce eylem: "Şimdi ara", "Yol tarifi", "Takvime ekle".
- Bilmediğimizi söyleriz: saati bilinmeyen klinik asla "açık" gösterilmez.
- İlk yardım içeriği tedavi değildir; her zaman "veterinerin söyledikleri önce gelir".
- Hayvanlar için "dostun"; teknik terim yerine gündelik Türkçe.

## Tema

Açık ve koyu tema cihaz ayarını izler (`app.json` → `userInterfaceStyle: automatic`).
Koyu temada zemin tam siyahtır; gece acillerinde ekran göz kamaştırmaz.
