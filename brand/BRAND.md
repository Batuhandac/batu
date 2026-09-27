# Pati SOS — Marka Rehberi

Pati SOS, evcil hayvanı acil durumdaki birinin açtığı uygulamadır. Tasarımın tek
görevi paniği azaltmak: sakin renkler, büyük dokunma alanları, tek net sonraki adım.

## Logo

Konum iğnesinin içinde pati izi ve kalp: *"yakınındaki yardım"* + *"sevdiğin dost"*.

| Dosya | Kullanım |
| --- | --- |
| `logo-mark.svg` | Uygulama içi işaret (`components/ds/Logo.tsx` ile aynı çizim) |
| `logo-lockup.svg` | İşaret + "patisos" yazısı; web, basın, sunum |
| `app-icon.svg` | iOS ikon kaynağı → `assets/icon.png` |
| `adaptive-icon.svg` | Android adaptive ön plan → `assets/adaptive-icon.png` |
| `notification-icon.svg` | Tek renk bildirim ikonu |

- Yazı küçük harfle yazılır: **pati** (teal) + **sos** (mercan).
- İşaretin çevresinde en az iğne genişliğinin %25'i kadar boşluk bırakılır.
- Logo döndürülmez, gölge/efekt eklenmez, renkleri değiştirilmez.

## Renkler

| Rol | Açık tema | Koyu tema | Neden |
| --- | --- | --- | --- |
| Birincil (teal) | `#13695E` | `#3FB8A5` | Güven, sakinlik, veteriner/sağlık çağrışımı |
| Acil (mercan) | `#E8543C` | `#E8543C` | Sevgi + aciliyet; yalnızca acil eylemlerde |
| Bal | `#B7791A` | `#E9A93A` | "Saat bilinmiyor", uyarı, ikincil vurgu |
| Zemin (krem) | `#FBF7F1` | `#0E1413` | Sıcak, klinik beyazı değil; gece göz yormaz |
| Metin | `#1E2A28` | `#F3F0EA` | Saf siyah/beyaz yerine yumuşak kontrast |
| Açık | `#1E8A5A` | `#4CC38A` | Klinik şu an açık |

Tüm değerler `lib/theme/index.ts` içindedir; ekranlarda elle renk kodu yazılmaz.
Mercan rengi az kullanılır: ekranda aynı anda tek bir mercan eylem olmalıdır.

## Tipografi

**Nunito** (400–900). Yuvarlak hatlı, sıcak ama ciddi; Türkçe karakterleri tam
destekler. Ölçek `type` tokenlarındadır (display, title, headline, body, callout,
caption, overline, button). Büyük harf gerektiğinde `trUpper` kullanılır
(`i → İ`, `ı → I`).

## İkonlar

Yalnızca **Ionicons** (`components/ds/Icon.tsx`). Emoji kullanılmaz; ne arayüzde
ne bildirimlerde ne paylaşılan metinlerde.

## Dil ve ses

- "Sen" diliyle, kısa ve sakin cümleler. Suçlamayan, korkutmayan.
- Önce eylem: "Şimdi ara", "Yol tarifi", "Acil veteriner bul".
- Bilmediğimizi söyleriz: saati bilinmeyen klinik asla "açık" gösterilmez.
- İlk yardım içeriği tedavi değildir; her zaman "veterinerin söyledikleri önce gelir".
- Hayvanlar için "dostun"; teknik terim yerine gündelik Türkçe.

## Tema

Açık ve koyu tema cihaz ayarını izler (`app.json` → `userInterfaceStyle: automatic`).
Koyu tema gece acillerinde parlak ekranla göz kamaştırmamak için özenle ayarlanmıştır.
