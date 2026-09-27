# Kullanıcı ve tasarım araştırması (Eylül 2026)

Bu not, "uygulama yapay zekâ yapmış gibi görünüyor, karışık" geri bildiriminden sonra
yapılan kısa masa başı araştırmanın özetidir. Amaç: pet sahiplerinin gerçekte ne
istediğini ve nasıl bir arayüzü tercih ettiğini kaynağıyla görmek, sonra tasarım
kararlarını buna bağlamak. Rakamlar yalnızca kaynağında geçtiği gibi aktarıldı.

## 1. Pet sahipleri ne istiyor?

| Bulgu | Kaynak |
| --- | --- |
| Pet sahiplerinin %88'i aşı ve randevu hatırlatması almayı önemli buluyor; %42'si hiç hatırlatma almadığını söylüyor. | [PetDesk, 2025 Pet Parent Research Report](https://petdesk.com/pet-parent-research-report) |
| Yarıdan fazlası randevu almakta zorlanıyor (büyükşehirde %63): boş saat yok, telefonda bekleme, klinik kapalıyken ulaşamama. | Aynı rapor |
| Klinik seçerken önem verilenler: dijital iletişim, hatırlatmalar, sağlık kayıtlarına telefondan erişim. | Aynı rapor |
| Rakip bakım uygulamalarının neredeyse hepsi kaydı aileyle ya da veterinerle paylaşmayı sunuyor (kod, QR ya da bulut). | [Pet Health+](https://apps.apple.com/us/app/pet-health-vaccine-tracker/id6737129774), [Vet Record](https://vetrecord.app/), [PokiPaw](https://pokipaw.com/), [Wagly](https://play.google.com/store/apps/details?id=com.mexar.wagly&hl=en), [Medika](https://apps.apple.com/app/id1553778157) |
| Türkiye'de Pet Takip, her aşı için üç hatırlatma kuruyor (7 gün önce, 1 gün önce, gününde 09:00) ve kendini "her şey app'i değil" diye tanımlıyor. | [pettakip.app](https://pettakip.app/) |
| Türkiye'de bakım takibi yapan başka uygulamalar da var: CanDostum, Petinoks, Petcare. | [CanDostum](https://play.google.com/store/apps/details?id=com.turanpetracker.petrackerapp&hl=tr), [Petinoks](https://petinoks.app/), [Petcare](https://apps.apple.com/us/app/petcare-evcil-hayvan-bak%C4%B1m/id6758898555) |
| Pet alışveriş sitelerinde en sık şikâyetlerden biri: fazla seçenek, reklam ve görsel kalabalık (Petco'nun bir numaralı sorunu). | [MeasuringU, Pet Benchmark 2025](https://measuringu.com/pet-benchmark-2025/) |

**Çıkarım**

- Hatırlatma, istenen ama çoğu zaman eksik kalan şey. Bizde vardı; bir gün önce
  ikinci bir hatırlatma eklendi (sabah 10:00'daki hatırlatmaya ek olarak önceki akşam 20:00).
- Bakım takibi Türkiye'de kalabalık bir alan. Bizi ayıran taraf acil anda en yakın
  açık kliniği bulmak, acil sağlık kartı ve hekimlerin yanıtladığı soru-cevap.
  Bakım takvimi, uygulamanın her gün açılmasını sağlayan kısım olarak kalıyor.
- Ailecek paylaşım, rakiplerde standart. Bizde şimdilik yalnızca acil kart
  WhatsApp'tan paylaşılabiliyor. Bulut eşitleme bir sonraki adım olarak not edildi.
- Kalabalık en çok şikâyet edilen şey. Her ekranda tek bir ana iş olmalı.

## 2. "Yapay zekâ yapmış gibi" görünmesinin nedenleri

Tasarım yazılarında yapay zekânın ürettiği arayüzlerin ortak işaretleri şöyle sayılıyor
([925 Studios](https://www.925studios.co/blog/ai-slop-design-tells),
[SmoothUI](https://smoothui.dev/blog/ai-design-slop),
[DEV: The Purple Gradient Problem](https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65)):

- Varsayılan, "güvenli" yazı tipi ve renk seçimleri, anlamı olmayan geçişler (gradient).
- Aynı yuvarlak kartların, her birinde küçük bir ikonla tekrarlanması.
- Her yerde birbirinin yerine geçebilen ince çizgili ikonlar, ikon daireleri ve hap (pill) etiketler.
- Fazla pürüzsüz, "plastik" illüstrasyonlar ve süs parıltıları.
- Ürüne özgü olmayan, genel geçer metinler ("Dostunun yanındayız").
- Çözüm yazıların hepsinde aynı: kısıt koymak. Az renk, tek yazı tipi ve ürünün
  gerçek işinden gelen kararlar.

Bizdeki karşılıkları: yuvarlak ve kalın Nunito yazı tipi; turkuaz, mercan, bal ve
krem renklerinin hepsinin aynı anda kullanılması; her kartta gölge, çerçeve ve ikon
dairesi; parıltılı SVG çizimler; neredeyse her bilginin renkli bir hap içinde durması.

## 3. Nasıl bir tasarım?

Apple, sistem yazı tipinin okunaklı ve nötr olduğunu, büyük yazı ve kalın yazı gibi
erişilebilirlik ayarlarına kendiliğinden uyduğunu söylüyor
([HIG: Typography](https://developers.apple.com/design/human-interface-guidelines/foundations/typography/)).
Panik anında ya da gece 03:00'te açılan bir uygulamada, telefonun kendi
uygulamalarına benzemek güven veriyor ve öğrenme yükünü azaltıyor.

**Kararlar**

| Konu | Önce | Sonra |
| --- | --- | --- |
| Yazı tipi | Nunito (yüklenen font) | Sistem yazı tipi (iOS'ta SF Pro, Android'de Roboto). |
| Renk | Turkuaz, mercan, bal, krem | Nötr gri zemin, beyaz yüzey. Tek marka rengi (çam yeşili). Kırmızı yalnızca acil durum ve silme için. Turuncu yalnızca "zamanı geçti / bugün" uyarısı için. |
| Kartlar | Çerçeve, gölge, 20–28 px köşe | Gölgesiz, çerçevesiz beyaz gruplar, 12 px köşe, ince ayırıcılar (iOS "inset grouped" düzeni). |
| İkonlar | Renkli daire içinde ikon | Daire yok. Satır başında sade ikon, yalnızca gerektiği yerde. |
| Etiketler | Her bilgi renkli hapta | Düz renkli metin. Durumlar için küçük bir nokta. |
| Görseller | Parıltılı SVG çizimler | Kaldırıldı. Boş ekranlarda tek ikon ve iki satır metin. |
| Karşılama | Üç slayt | Tek ekran: ne işe yaradığı üç satırda, sonra giriş. |
| Ana sayfa | Karşılama sloganı, doğum günü kartı, yatay pet kartları, topluluk önizlemesi | Selam, duyuru kaydırıcısı, dostlar listesi (doğum günü satırın içinde), yaklaşan bakım, en yakın açık klinik, en altta acil. |
| Logo | Pin, pati, mercan kalp, iki renkli "patisos" | Pin ve pati, tek renk. "Pati SOS" yazısı sistem yazı tipinde. |

## 4. Sonraki adımlar (bu PR'ın dışında)

1. Ailecek paylaşım: davet koduyla ikinci bir telefonun aynı dostları görmesi (Firestore eşitleme).
2. Klinikle eşleşme: hekimin girdiği aşının sahibin takviminde onaylı görünmesi.
3. Beş pet sahibiyle 20 dakikalık kullanılabilirlik testi. Görevler: "en yakın açık kliniği ara",
   "karma aşıyı takvime ekle", "acil kartı eşine gönder". Her görevde süre ve takıldıkları yer not edilir.
