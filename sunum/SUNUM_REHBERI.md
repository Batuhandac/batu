# Büyük Veri Sunumu – Sunucu Rehberi

## Dosyalar
- `Buyuk_Veri_Sunum.pptx` – 22 slayt, yaklaşık 25 dakika. Her slaytın Notlar bölümünde tek cümle ve birkaç ipucu var.
- `Buyuk_Veri_Sunum.pdf` – yedek.
- `Kopya_Kagidi.md` – tek sayfalık kopya kâğıdı: slayt başına bir cümle ve ipuçları.
- `vb.html` – öğrencilerin QR ile açtığı "Veri Bankası" sayfası (tek dosya, kendi başına çalışır).

## Bağlantılar
- Canlı sayfa: https://rawcdn.githack.com/Batuhandac/batu/048fa72214/sunum/vb.html
- Sınıf ekranı (senin açacağın): aynı adres, sonuna `#sunum`
- Kopya kâğıdı (düzenlenebilir doküman): https://claude.ai/artifact/Lw1TB4Dsn2knkVAJbkVuXp

Canlı sayfa bu deponun içindeki `vb.html` dosyasından, githack adlı ücretsiz bir servis üzerinden yayınlanır. Doğrudan tarayıcıda açılır; giriş, hesap ya da uygulama istemez. Slaytlardaki QR kodlar bu adrese gider. Adres belirli bir kayda (commit) sabitlidir: `vb.html` değişirse QR kodların da yeniden üretilmesi gerekir.

Yedek plan: servis o gün çalışmazsa `vb.html` dosyasını Netlify Drop gibi bir yere sürükleyip yeni adresi tahtaya yazabilirsin; sayfa tek dosyadır.

## Canlı sayfa
Öğrenci tarafı bir mobil bankacılık uygulaması gibi görünür.

| Ekran | Kim görür | Ne yapar |
| --- | --- | --- |
| Hoş geldiniz | Öğrenci, slayt 2'deki QR | Tek bir kullanıcı adı ister. Altında kimsenin okumadığı "Aydınlatma Metni" bağlantısı var; tıklanınca nelerin okunduğunu söyler. |
| Başvurunuz değerlendiriliyor | Öğrenci | Dört adım: kimlik (ad özete, sonra müşteri numarasına dönüşür), cihaz, risk analizi, teklifler. Altta sayaç: "sizden istenen 1 bilgi / cihazınızdan alınan N bilgi". |
| Kartım | Öğrenci | Sanal banka kartı (üstünde 5 karakterlik kart numarası), müşteri puanı, segment, "size özel" teklif. |
| Verilerim | Öğrenci, alt menü | Cihazın söylediği her şey ve kart numarasının ne anlattığı. |
| Güvenlik | Öğrenci alt menü; sen slayt 8'de | Yazdıkça SHA-256 özeti canlı değişir. Yanında gerçek şifreleme: anahtarla açılır, anahtarsız açılmaz. |
| Sınıf ekranı | Sen, slayt 7 | Kart numaralarını yazarsın; profiller düşer. Canlı sayaç, numara çözme şeridi, sınıf özeti. |
| Kaynaklar | Slayt 21'deki QR | Tıklanabilir kaynak listesi. |

Sunucu yoktur: her şey tarayıcıda hesaplanır, hiçbir veri gönderilmez. Sayfanın altında bunun bir ders simülasyonu olduğu yazar. Sınıf ekranındaki liste yalnızca senin tarayıcında durur; "Temizle" sıfırlar. "Prova: örnek ekle" rastgele profil ekler.

## Sunumdan önce
1. Slayt 2'deki QR'ı kendi telefonunla okut. Sayfa tarayıcıda banka uygulaması gibi açılmalı.
2. Bir kullanıcı adı yaz, çıkan kart numarasını not et.
3. Projeksiyon bilgisayarında sınıf ekranı adresini aç, "Temizle"ye bas, kart numaranı girip profilin düştüğünü gör, sonra tekrar "Temizle".
4. Kapak slaytına adını yaz.
5. PowerPoint'i Sunucu Görünümü'nde aç; ipuçları yalnızca senin ekranında görünür.

## Akış (yaklaşık 25 dk)
| Slayt | Bölüm | Süre | Canlı kısım |
| --- | --- | --- | --- |
| 1–3 | Giriş | 3 dk | Slayt 2: QR, kullanıcı adı |
| 4–8 | Kavram ve canlı demo | 10 dk | Slayt 7: sınıf ekranı. Slayt 8: şifreleme |
| 9–13 | Finansta kullanım | 4,5 dk | – |
| 14–17 | Hikayeler | 4 dk | Slayt 17: bir sınıf sorusu |
| 18 | Regülasyon | 1 dk | – |
| 19–22 | Tartışma ve kapanış | 4 dk | Slayt 19: sınıf tartışması |

## Değerlendirme kriterlerine karşılık
- Araştırma derinliği (%40): Türkiye, ABD, Avrupa ve dünya istatistikleri; şirket açıklaması olan rakamlar öyle işaretli; kaynak slaytı ve tıklanabilir liste.
- Açıklık ve yapı (%20): altı bölüm, altta bölüm göstergesi, hocanın formatında "Sonuç olarak;" slaytı.
- Sunum becerileri (%20): iki canlı demo, iki sınıf sorusu.
- Görseller (%10): grafik, ikonlu kartlar, QR kodlar, canlı sayfa.
- Özgünlük ve eleştirel düşünme (%10): canlı profilleme deneyi; özet ile şifreleme ayrımı; "veri yeni petrol mü?" karşı argümanları.

## Demodaki puan kuralları (bilerek basit ve şeffaf)
Başlangıç 620. Pahalı telefon +25. Gece saati −30 ve ek doğrulama bayrağı. Şarj %20 altı −20. Yazarken düzeltme −10. Eski sistem ya da veri tasarrufu −10. Bunlar gerçek bir bankanın kuralları değildir; tartışma başlatmak içindir.

## Rakamların tarihi
IDC 181 ZB (2025 tahmini) · BKM 2024 yıllık bülten · TBB Aralık 2025 · KVKK 2025 faaliyet raporu · GDPR 2025 toplamı (DLA Piper) · JPMorgan 2025 bütçesi · Garanti BBVA Mayıs 2026 · İş Bankası 2025. Slayt 3'teki rakamlar yıllık toplamların 25 dakikaya oranlanmasıdır.
