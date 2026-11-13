# Büyük Veri Sunumu – Sunucu Rehberi

## Dosyalar
- `Buyuk_Veri_Sunum.pptx` – 34 slayt. Her slaytın Notlar bölümünde konuşma metni var. Slaytlar arası yumuşak geçiş ve altta bölüm göstergesi içerir.
- `Buyuk_Veri_Sunum.pdf` – yedek.
- `Konusma_Metni.md` – her slayt için konuşma metni (çevrimdışı kopya).
- `veri-bankasi.html` – öğrencilerin QR ile açtığı canlı sayfanın kaynağı.

## Bağlantılar
- Canlı sayfa (Veri Bankası): https://claude.ai/artifact/4niWXLc9xP1hMPXKJRD73G
- Konuşma metni dokümanı (düzenlenebilir): https://claude.ai/artifact/Lw1TB4Dsn2knkVAJbkVuXp

## Canlı sayfanın sekmeleri
| Sekme | Kim açar | Ne yapar |
| --- | --- | --- |
| Profilim | Öğrenci, slayt 2'deki QR | Kullanıcı adı yazar; soru yok. Tarayıcının sessizce verdiği sinyallerden segment, puan, teklif ve 5 haneli kod çıkar. "Ne yerine ne yazıldı" tablosu gösterir. |
| Sınıf ekranı | Sen, slayt 10 | Kodları yazarsın; profiller düşer. Canlı sayaç, kod çözme şeridi, sınıf özeti. |
| Şifreleme | Sen, slayt 11 (isteyen öğrenci de) | Yazdıkça SHA-256 özeti canlı değişir (çığ etkisi). Yanında gerçek şifreleme: anahtarla geri açılır, anahtarsız açılmaz. |
| Kaynaklar | Slayt 33'teki QR | Tıklanabilir kaynak listesi. |

Sunucu yoktur: her şey tarayıcıda hesaplanır, hiçbir veri gönderilmez. Sınıf ekranındaki liste yalnızca senin tarayıcında durur; "Temizle" sıfırlar. "Prova: örnek ekle" rastgele profil ekler.

## Sunumdan önce
1. Canlı sayfayı Paylaş menüsünden "link ile herkes" yap. Yapmazsan öğrenciler giriş ekranı görür.
2. Projeksiyon bilgisayarında tarayıcıda sayfayı aç, "Sınıf ekranı"na geç, "Temizle"ye bas.
3. Kendi telefonunla slayt 2'deki QR'ı okut, çıkan kodu sınıf ekranına gir.
4. Kapak slaytına adını yaz.
5. PowerPoint'i Sunucu Görünümü'nde aç; notlar yalnızca senin ekranında görünür.

## Akış (yaklaşık 45 dk)
| Slayt | Bölüm | Süre | Canlı kısım |
| --- | --- | --- | --- |
| 1–4 | Giriş | 5 dk | Slayt 2: QR, kullanıcı adı |
| 5–11 | Kavram ve canlı demo | 13 dk | Slayt 10: sınıf ekranı. Slayt 11: şifreleme laboratuvarı |
| 12–19 | Finansta kullanım | 9 dk | – |
| 20–26 | Hikayeler | 9 dk | Slayt 25 ve 26: birer sınıf sorusu |
| 27–30 | Risk ve regülasyon | 4 dk | – |
| 31–34 | Tartışma ve kapanış | 5 dk | Slayt 31: sınıf tartışması |

## Değerlendirme kriterlerine karşılık
- Araştırma derinliği (%40): 20'den fazla kaynak; Türkiye, ABD, Avrupa ve dünya istatistikleri; şirket açıklaması olan rakamlar öyle işaretli.
- Açıklık ve yapı (%20): beş bölüm, bölüm göstergesi, hocanın formatında "Sonuç olarak;" slaytı.
- Sunum becerileri (%20): iki canlı demo, üç sınıf sorusu.
- Görseller (%10): iki grafik, ikonlu kartlar, zaman çizelgesi, QR kodlar.
- Özgünlük ve eleştirel düşünme (%10): canlı profilleme deneyi; özet ile şifreleme ayrımı; "veri yeni petrol mü?" karşı argümanları.

## Demodaki puan kuralları (bilerek basit ve şeffaf)
Başlangıç 620. Pahalı telefon +25. Gece saati −30 ve ek doğrulama bayrağı. Şarj %20 altı −20. Yazarken düzeltme −10. Eski sistem ya da veri tasarrufu −10. Bunlar gerçek bir bankanın kuralları değildir; tartışma başlatmak içindir.

## Rakamların tarihi
IDC 181 ZB (2025 tahmini) · BKM 2024 yıllık bülten · TBB Aralık 2025 · KVKK 2025 faaliyet raporu · GDPR 2025 toplamı (DLA Piper) · Neudata 2025 · JPMorgan 2025 bütçesi · Garanti BBVA Mayıs 2026 · İş Bankası 2025. Slayt 3'teki rakamlar yıllık toplamların 40 dakikaya oranlanmasıdır.
