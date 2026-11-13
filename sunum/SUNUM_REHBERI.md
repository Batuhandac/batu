# Büyük Veri Sunumu – Sunucu Rehberi

**Dosyalar**
- `Buyuk_Veri_Sunum.pptx` – 32 slayt, her slaytta konuşma notu var (PowerPoint'te Notlar bölümü).
- `Buyuk_Veri_Sunum.pdf` – yedek.
- `veri-bankasi.html` – öğrencilerin QR ile açtığı interaktif sayfanın kaynağı.

**İnteraktif sayfa:** https://claude.ai/artifact/4niWXLc9xP1hMPXKJRD73G
Sekmeler: `#profil` (öğrenci akışı, varsayılan), `#sunum` (sınıf ekranı, sen açarsın), `#vaka` (sen olsan?), `#kaynak` (tartışma soruları + kaynaklar).

## Canlı demo nasıl çalışır (soru yok)
- **Öğrenci (telefon):** yalnızca bir kullanıcı adı yazar, "Beni tanı" der. Ekranda "analiz ediliyor" akışı: ad SHA-256 ile şifrelenir, silinir, 2 karakterlik parmak izi kalır. Sonra tarayıcının sormadan verdiği sinyaller listelenir: saat, telefon modeli ve işletim sistemi, ekran/RAM, şarj seviyesi (Android ve Chrome verir; iPhone, Safari, Firefox vermez), bağlantı tipi, dil ve saat dilimi, karanlık mod, yazma hızı ve düzeltme sayısı, canvas cihaz parmak izi. Bunlardan segment (Premium Profil, Gece Kuşu, Şarjı Biten, Masa Başı...), 300–900 puan, risk bayrağı, "size özel teklif" ve "puanınız neden böyle" günlüğü çıkar. Mesaj: "Siz 1 şey yazdınız, biz 10 şey öğrendik." En altta 5 haneli **kod** (ör. `K7AVX`).
- **Sen (projeksiyon):** slayt 9'da tarayıcıya geç, `#sunum` sekmesini aç. Öğrenciler kodlarını söyler, sen yazarsın. Her kodla profil düşer; ortalama puan, pahalı telefon oranı, düşük şarj sayısı, gece bağlananlar, karanlık mod oranı, segment dağılımı ve "kim neden puan kaybetti" metni canlı güncellenir. Kodda isim yok: sadece sinyaller + parmak izi (sözde anonimleştirme, KVKK bağlantısı).
- Sunucu yok: her şey tarayıcıda hesaplanır, hiçbir veri gönderilmez. Sınıf ekranındaki liste senin tarayıcında saklanır; "Temizle" ile sıfırlanır. "Prova: örnek ekle" rastgele profil ekler, prova sonrası temizle.
- Model bilerek basit ve şeffaf: pahalı telefon +25 (gelir vekili), gece saati −30 ve bayrak, şarj %20 altı −20, eski sistem/veri tasarrufu −10, yazarken düzeltme −10. Tartışma bunun üzerinden: kimse soru cevaplamadı, herkes puanlandı. Adil mi?

## Sunumdan önce (zorunlu)
1. Sayfayı **Paylaş → Link ile herkes görebilsin** yap. Şu an sadece sen açabiliyorsun; öğrenciler QR okutunca giriş ekranı görür.
2. Kendi telefonunla slayt 2'deki QR'ı okut, bir profil çıkar; kodu laptopta `#sunum` ekranına gir, düştüğünü gör.
3. Kapak slaytına adını ekle (slayt 1, "Öğrenci sunumu" satırı).
4. Moodle'a .pptx'i yükle.

## Akış ve süre (yaklaşık 35–40 dk + tartışma)
| Slayt | Bölüm | Süre | Not |
|---|---|---|---|
| 1–3 | Giriş, Veri Bankası kaydı (QR), yol haritası | 4 dk | Kayıt 1–2 dk; "kodunuzu saklayın" de |
| 4–8 | Kavram: tanım, 5V, veri patlaması, geleneksel vs büyük, değer zinciri | 7 dk | Hocanın 1. hafta notuna atıf var (slayt 4) |
| 9 | Sınıf ekranı: kodları topla, canlı profil | 5 dk | Tarayıcıya geç; 8–10 kod yeter |
| 10–17 | Finansta kullanım: kredi, dolandırıcılık, alternatif veri, Türkiye, BKM grafiği, dünya panoraması | 9 dk | |
| 18–24 | Hikayeler: MYbank, Knight, Zillow, Apple Card (+QR vaka), Equifax/Yemeksepeti, Target | 9 dk | Slayt 22'de QR: 3 vakada karar verdirt |
| 25–28 | Riskler, regülasyon, gelecek | 5 dk | |
| 29–32 | "Veri yeni petrol mü?", sonuç, kaynaklar, teşekkür | 5 dk | Slayt 29 sınıf tartışması |

## Değerlendirme kriterlerine karşılık
- Araştırma derinliği (%40): 20+ kaynak, Türkiye/ABD/Avrupa/Dünya istatistikleri (slayt 17), şirket verisi olanlar "şirket açıklaması" diye işaretli.
- Açıklık ve yapı (%20): 5 bölüm, bölüm ayırıcılar, özet slaytı hocanın "Sonuç olarak;" formatında.
- Sunum becerileri (%20): 3 interaktif durak + 3 sınıf tartışması.
- Görseller (%10): 2 yerel grafik, ikonlu kartlar, zaman çizelgeleri, QR.
- Özgünlük / eleştirel düşünme (%10): slayt 29 "veri yeni petrol mü?" karşı argümanlar; slayt 23 ceza orantısı tartışması.

## Sorulabilecek sorular ve kısa cevaplar
- "127,7 milyon Türkiye nüfusundan fazla?" → TBB verisi tekilleştirilmemiş; aynı kişi birden fazla bankada sayılıyor. Slayt notunda var.
- "Pazar büyüklüğü neden 13–40 milyar $ aralığı?" → Raporlar kapsamı farklı tanımlıyor (bankacılık vs BFSI, yazılım vs toplam harcama). Bilerek aralık verildi.
- "MYbank rakamları güvenilir mi?" → Şirketin kendi açıklaması, bağımsız denetim yok; slaytta belirtiliyor.
- "Apple Card'da ayrımcılık yoksa sorun ne?" → Açıklanabilirlik: NYDFS, kararların müşteriye açıklanamamasını eleştirdi.

## Rakamların tarihi
IDC 181 ZB (2025 tahmini) · BKM 2024 yıllık bülten · TBB Aralık 2025 · KVKK 2025 faaliyet raporu · DLA Piper GDPR 2025 toplamı · Neudata 2025 · JPMorgan 2025 bütçesi · Garanti BBVA Mayıs 2026 (Ugi 10. yıl) · İş Bankası 2025.
