# Büyük Veri Sunumu – Konuşma Metni

Köşeli parantez içindekiler sahne notudur, okunmaz. Aynı metinler PowerPoint notlarında da vardır.

## Giriş (slayt 1–4)

### Slayt 1 · Kapak (30 sn)

Merhaba arkadaşlar. Bugünkü konum büyük veri. Ama klasik bir tanımla başlamayacağım. Önce size bir şey göstereceğim. Sonra o gördüğünüz şeyin finansta nasıl paraya, riske ve karara dönüştüğünü konuşacağız. Telefonlarınız yanınızda olsun, bugün onlara ihtiyacımız var.

### Slayt 2 · Başlamadan: Veri Bankası'na kayıt olun (2 dk)

[QR ekranda kalsın, herkes okutana kadar bekle.] Kameranızı şu QR koda tutun. Açılan sayfa hayali bir bankanın kayıt ekranı: Veri Bankası. Sizden tek bir şey istiyor: bir kullanıcı adı. Gerçek adınız olmak zorunda değil, ne isterseniz yazın ve “Beni tanı” düğmesine basın. Başka hiçbir soru sormayacak. [Yarım dakika bekle.] Şimdi ekranınıza bakın. Siz tek bir kullanıcı adı yazdınız, ama banka sizin hakkınızda on ayrı şey öğrendi: saat kaçta bağlandığınız, telefonunuzun modeli, şarjınız, hatta ne kadar hızlı yazdığınız. Bunlardan size bir segment, bir puan ve bir teklif çıkardı. En altta beş haneli bir kod var. O kodu bir yere not edin, birkaç dakika sonra lazım olacak. Merak etmeyin, hiçbir veriniz bir yere gönderilmedi; her şey telefonunuzda hesaplandı. Ama gerçek bir banka uygulamasında gönderilirdi.

### Slayt 3 · Bu sunum bitene kadar (1 dk)

Ölçeği hissetmeniz için birkaç rakam vereyim. Bu sunum yaklaşık kırk dakika sürecek. Ben konuşmayı bitirene kadar Türkiye'de 1,4 milyon kartlı ödeme yapılmış olacak. Tutarı 1,2 milyar lira. Aynı sürede dünyada 11 milyon terabayt yeni veri üretilecek ve finansal sistemden 37 milyon dolar dolandırıcılıkla çıkmış olacak. Bunların her biri bir kayıt, yani bir veri noktası. Büyük veri dediğimiz şey bu akışın kendisi.

### Slayt 4 · Bugün neyi konuşacağız? (30 sn)

Beş durağımız var. Önce kavramı netleştireceğiz. Sonra finansta nerede kullanıldığına bakacağız. Ardından gerçek hikayeler gelecek: bir başarı, iki çöküş ve birkaç tartışmalı vaka. Sonra riskler ve düzenlemeler. En sonda da birlikte tartışacağız: veri gerçekten yeni petrol mü?

## Kavram ve canlı demo (slayt 5–11)

### Slayt 5 · Büyük veri nedir? (1,5 dk)

Büyük veriyi ilk tanımlayan kişi Doug Laney, yıl 2001. Tanımı şöyle: yüksek hacimli, yüksek hızlı ve yüksek çeşitlilikteki; değer üretmek için yeni işleme biçimleri gerektiren veri. Hocamızın ilk hafta notlarında da büyük veri analitiği, ham verideki desenleri ve ilişkileri bulma süreci olarak geçiyordu. Burada kritik nokta şu: büyük, sadece boyut demek değil. Elinizdeki araçlar yetmediği an veri büyük olur. Tek bir makineye sığmıyorsa, gece çalışan toplu işler yetişmiyorsa ya da veri tabloya girmiyorsa. Az önce telefonunuzdan okunanları düşünün: saat, cihaz, yazma ritmi. Bunların hiçbiri klasik bir hesap tablosuna girmez.

### Slayt 6 · 5V: Büyük veriyi tanımlayan beş özellik (1,5 dk)

Laney'nin üç V'sine sonradan iki tane daha eklendi. Hepsini finansla eşleştireyim. Hacim: Türkiye'de 2024'te 18,4 milyar kartlı ödeme yapıldı. Hız: bunların her biri onaylanmadan önce, milisaniyeler içinde dolandırıcılık kontrolünden geçti. Çeşitlilik: sadece işlem tablosu yok; çağrı merkezi kaydı, uygulama kaydı, konum var. Doğruluk: veri yanlışsa karar da yanlış olur; çöp girer, çöp çıkar. Ve değer: bütün bunlar paraya ya da karara dönüşmüyorsa sadece depolama maliyetidir. Peki neden finans? Çünkü finansın analog bir kısmı yok. Fiyat, işlem, kimlik, sözleşme: hepsi zaten veri.

### Slayt 7 · Veri patlaması: 15 yılda 90 kat (1 dk)

Grafiğe bakın. 2010'da dünyada yılda 2 zettabayt veri üretiliyordu. 2025 için tahmin 181 zettabayt. On beş yılda doksan kat. Bir zettabayt bir milyar terabayt eder. Günlük üretim yaklaşık 402 milyon terabayt. Bu verinin büyük kısmını insanlar değil, makineler üretiyor: sensörler, kayıtlar, kameralar. Az önce sizin telefonunuzun yaptığı gibi.

### Slayt 8 · Geleneksel veri yönetimi ile ne değişti? (1 dk)

Peki bankalar için ne değişti? Soldaki sütun eski dünya: düzenli tablolar, tek büyük sunucu, gece çalışan toplu işler. Sorulan soru “geçen ay ne oldu?” Sağdaki sütun yeni dünya: metin, ses, konum; dağıtık sistemler; gerçek zamanlı akış. Sorulan soru “şu an ne olacak ve ne yapmalıyım?” En önemli satır sonuncusu: karar hızı günlerden milisaniyelere indi. Hocamızın ilk hafta anlattığı, bankaların hâlâ kullandığı 1970'lerden kalma sistemler bu geçişi zorlaştırıyor.

### Slayt 9 · Veri nasıl karara dönüşür? Veri değer zinciri (1 dk)

Veri kendiliğinden değer üretmez; bir zincirden geçer. Önce toplanır: POS cihazı, mobil uygulama, çağrı merkezi. Sonra depolanır, işlenir ve analiz edilir. En sonda bir karara dönüşür: kredi onayı, işlemin durdurulması ya da size özel bir teklif. Dikkat edin, değer sadece son adımda ortaya çıkıyor. İlk dört adım tamamen maliyet. O yüzden “biz çok veri topluyoruz” demek tek başına bir strateji değil. Şimdi bu zincirin sizin üzerinizde nasıl çalıştığına bakalım.

### Slayt 10 · Sınıf ekranı: bankanın gözünden bu sınıf (4 dk)

[Tarayıcıya geç, Sınıf ekranı sekmesini aç.] Baştaki kodlarınızı hatırlıyor musunuz? Şimdi sırayla söyleyin, ben yazıyorum. [8–10 kod gir. Her kodda ekrana düşen profili sesli oku.] Bakın, her kodda bir müşteri ekrana düşüyor. Üstteki sayaç, bu ekranı açtığımdan beri Türkiye'de kaç kartlı ödeme yapıldığını gösteriyor. Şimdi sınıfın geneline bakalım. [Ekrandaki özet metni oku.] Burada bir durup düşünelim. Hiçbiriniz tek bir soru cevaplamadınız, ama banka hepinize puan verdi. Pahalı telefonu olana 25 puan ekledi, çünkü telefonu gelir göstergesi saydı. Şarjı azalana puan kesti. iPhone kullananların şarj bilgisi gelmedi, çünkü Apple bunu paylaşmıyor. [Sınıfa sor:] Sizce bu adil mi? Telefonunuzun modeli kredi notunuzu etkilemeli mi? [İki üç cevap al, sonra slayta dön.]

### Slayt 11 · Adınıza ne oldu? Özetleme adım adım (3 dk)

Dikkat ettiyseniz ekranda hiçbirinizin adı yoktu. Sadece iki karakterlik bir parmak izi vardı. Peki adınıza ne oldu? Slayttaki örneği izleyelim. “kahvecanavari” yazdınız. Telefonunuz bunu SHA-256 denen bir fonksiyondan geçirdi ve 64 karakterlik bir özet çıktı. O özetin başından iki karakterlik bir parmak izi alındı: 2W. Adın kendisi silindi. [Tarayıcıda Şifreleme sekmesini aç, bir gönüllünün kullanıcı adını yaz.] Canlı görelim. Ben yazarken soldaki özete bakın. Tek bir harf ekliyorum ve özetin neredeyse tamamı değişiyor. Buna çığ etkisi deniyor. Bu yüzden özetten ada geri dönemezsiniz. Sağ tarafta ise gerçek şifreleme var: aynı ad bir anahtarla şifreleniyor. [“Anahtarla geri aç” düğmesine bas, sonra “Anahtarsız dene”ye bas.] Fark şu: şifreleme anahtarla geri açılır, özet açılmaz. İkinci haftada gördüğümüz blokzincir, blokları birbirine bu özet fonksiyonuyla bağlıyordu. Hukuktaki adı da takma adlı veri. Ama bir uyarım var: iki karakterlik parmak izi sizi bu sınıfta gizler. Yanına telefon modeli ve saat eklenince yeniden tanınabilirsiniz. Anonimlik, veri arttıkça erir.

## Finansta kullanım (slayt 12–19)

### Slayt 12 · Bölüm 2: Finansta büyük veri nerede kullanılıyor? (15 sn)

Kavramı gördük, kendi üzerimizde de denedik. Şimdi bankaların ve piyasaların bunu gerçekte nerede kullandığına bakalım.

### Slayt 13 · Altı temel kullanım alanı (1 dk)

Altı temel alan var. Kredi skorlama, dolandırıcılık tespiti, algoritmik işlem ve alternatif veri, müşteri analitiği, risk ve uyum teknolojileri, bir de sigorta. Sigorta ve bankacılık bu dersin ayrı haftaları olduğu için ben ilk dördüne odaklanacağım. Az önce sınıf ekranında yaptığımız şey aslında bunlardan ikisiydi: bir skorlama ve bir dolandırıcılık bayrağı.

### Slayt 14 · Kredi skorlama: geçmiş mi, gelecek mi? (1,5 dk)

Türkiye'de klasik kredi notu Findeks. Bankalardaki kredi ve kart geçmişinizden hesaplanıyor. On iki yılda on milyona yakın sorguya ulaştı; sorguların yüzde 89'u mobilden. Ama bir zayıf noktası var: geçmişi olmayanı puanlayamıyor. Öğrenciyi, yeni işe başlayanı, kayıt dışı esnafı. Alternatif skorlama burada devreye giriyor. Colendi gibi fintekler kişi başına binden fazla veri noktası kullandığını söylüyor: telefon kullanımı, alışveriş, uygulama davranışı. Az önce sizin başınıza gelenin gerçek hayattaki hali bu. Artısı finansal kapsayıcılık. Eksisi açıklanabilirlik ve ayrımcılık riski. Buna hikayelerde döneceğim.

### Slayt 15 · Dolandırıcılık tespiti: en olgun uygulama (1,5 dk)

Büyük verinin en olgun uygulaması dolandırıcılık tespiti. Nasdaq Verafin raporuna göre 2023'te dünyada dolandırıcılık kaybı 485 milyar dolar. Sistem nasıl çalışıyor? Kartınızı okuttuğunuz anda işlem, sizin geçmişinizle ve ağdaki milyarlarca işlemle karşılaştırılıyor. Model yüz milisaniyeden kısa sürede bir risk puanı üretiyor. Sonuç: onay, ek doğrulama ya da ret. Mastercard kendi sisteminde tespitin yüzde 30 arttığını, yanlış retlerin yüzde 60 azaldığını açıklıyor. Yanlış ret önemli, çünkü dürüst müşterinin kartını reddetmek de bir maliyet. Sınıf ekranında gece bağlananlara düşen bayrak tam bu mantıktı. Bir not: bu oranlar şirketin kendi açıklaması.

### Slayt 16 · Piyasalar: alternatif veri ve sözleşme okuyan makineler (1,5 dk)

Piyasalarda yarış, kimsenin bakmadığı veriyi bulmak üzerine. Fonlar 2025'te alternatif veriye 2,8 milyar dolar harcadı. Ne alıyorlar? Uydu görüntüsünden otopark doluluğunu sayıp bir perakendecinin cirosunu bilançodan önce tahmin ediyorlar. Anonim kart verisinden satışları izliyorlar. Hocamızın ilk hafta anlattığı bilgi hızı hikayesi vardı: yelkenli, telgraf, internet. Bugün o zincirin son halkası uydu. Sağdaki örnek JPMorgan. COIN adlı yazılım, avukatların yılda 360 bin saatini alan kredi sözleşmesi okuma işini saniyelere indirdi. Bankanın yıllık teknoloji bütçesi 18 milyar dolar.

### Slayt 17 · Türkiye: veri, müşteri deneyimine dönüşüyor (1 dk)

Türkiye kullanımda çok önde. Bankalar Birliği'ne göre aktif dijital bankacılık müşterisi 127,7 milyon. Nüfustan fazla, çünkü aynı kişi birden çok bankada sayılıyor. İki örnek vereyim. Garanti BBVA'nın asistanı Ugi on yaşında ve ayda 1,6 milyon kişi kullanıyor. İş Bankası'nın Maxi'si yılda 110 milyona yakın diyalog kuruyor. Bu asistanlarla yapılan her konuşma, modeli eğiten yeni bir veri.

### Slayt 18 · Türkiye'de her ödeme bir veri noktası (1 dk)

Ödeme tarafında tablo şöyle: 2024'te 18,4 milyar kartlı ödeme. Temassız ödemeler 12 milyara yaklaştı. Tutar 15,8 trilyon lira ve yüzde 92 artmış. Ama bunun büyük kısmı enflasyon; o yüzden adede bakmak daha doğru. Saniyede yaklaşık 580 işlem demek bu. Her temassız dokunuş bir yer, bir saat ve bir satıcı bilgisi bırakıyor.

### Slayt 19 · Dört bölge, sekiz rakam (1 dk)

Dört bölgeyi yan yana koyalım. Türkiye'de 127,7 milyon dijital müşteri var; veri koruma kurumu KVKK 2025'te toplam 352 milyon lira ceza kesti. Amerika'da tek bir bankanın teknoloji bütçesi 18 milyar dolar; Equifax ihlalinde 147 milyon kişinin verisi sızdı. Avrupa'da açık bankacılık yaklaşık 64 milyon kullanıcıya ulaştı ve bir yılda 1,2 milyar euro veri koruma cezası kesildi. Bir dipnot: bankacılıkta büyük veri pazarı için raporlar 13 ile 40 milyar dolar arasında rakam veriyor. Tanımlar farklı olduğu için bilerek aralık verdim.

## Hikayeler (slayt 20–26)

### Slayt 20 · Bölüm 3: Başarı ve başarısızlık hikayeleri (15 sn)

Rakamları gördük. Şimdi hikayelere geçelim. Bir başarı, iki çöküş ve üç tartışmalı vaka.

### Slayt 21 · Başarı: MYbank ve “3-1-0” kredisi (1,5 dk)

Başarı hikayemiz Çin'den. MYbank, Alipay'in sahibi Ant Group'un bankası ve küçük esnafa teminatsız kredi veriyor. Modelin adı üç-bir-sıfır. Üç dakikada telefondan başvuru, bir saniyede onay, sıfır insan. Bunu nasıl yapıyor? Esnafın Alipay'deki ödeme akışına, tedarikçilerine, mağaza puanına bakıyor. Yüz binden fazla gösterge. Klasik banka bu esnafa kredi veremiyordu, çünkü teminatı ve bilançosu yoktu. Burada veri, teminatın yerine geçti. Takipteki kredi oranı yüzde bir civarında. Yalnız şunu belirteyim: bu rakamlar şirketin kendi açıklaması, bağımsız bir denetim yok.

### Slayt 22 · Çöküş 1: Knight Capital, 45 dakikada 440 milyon dolar (1,5 dk)

Şimdi madalyonun öbür yüzü. 1 Ağustos 2012. Knight Capital, Amerika'nın en büyük piyasa yapıcılarından biri. O sabah yeni bir yazılım dokuz sunucudan sekizine yükleniyor. Dokuzuncuda yıllar önce kapatılmış eski bir test kodu kalıyor. Piyasa açılıyor ve o tek sunucu 154 hissede milyonlarca hatalı emir göndermeye başlıyor. 45 dakika boyunca kimse durduramıyor. Sonuç: 440 milyon dolar zarar. Şirket aynı yıl satıldı. Buradan çıkan ders: hız arttıkça hata da hızlanır. Algoritma milisaniyede karar veriyorsa, durdurma düğmesi mutlaka bir insanın elinde olmalı.

### Slayt 23 · Çöküş 2: Zillow, modele fazla güvenince (1,5 dk)

İkinci çöküş daha ince. Zillow, Amerika'nın en büyük emlak sitesi ve çok iyi bir fiyat tahmin modeli var. Piyasadaki evlerde hata payı yüzde 1,9. Şirket şöyle düşündü: madem fiyatı bu kadar iyi biliyoruz, evleri kendimiz alıp satalım. Sorun şu: bu iş piyasada olmayan evlerle yapılır ve orada hata payı yüzde 6,9'a çıkıyor. Bir evden beklenen kâr ise yüzde 5 civarı. Yani model ortalamada zarar ettiriyor. 2021'de piyasa da dönünce tek çeyrekte 381 milyon dolar zarar ettiler ve çalışanların dörtte birini işten çıkardılar. Ders: daha fazla veri, daha iyi karar demek değil. İyi bir model, yanlış iş modeliyle felakete dönüşebilir.

### Slayt 24 · Tartışmalı: Apple Card ve “kara kutu” (1,5 dk)

Bu vaka, kredi skorlamada söz verdiğim konu. 2019'da bir yazılımcı şunu tweetledi: eşimle aynı gelire sahibiz, onun kredi notu daha iyi, ama Apple Card bana yirmi kat yüksek limit verdi. Apple'ın kurucu ortağı Wozniak da aynısı bize de oldu dedi. Kamuoyu algoritmaya cinsiyetçi dedi ve New York'un finans düzenleyicisi soruşturma açtı. İki yıl sonra sonuç çıktı. 400 bin başvuru incelendi ve cinsiyet ayrımcılığı kanıtı bulunamadı; model cinsiyeti hiç kullanmıyordu. Ama rapor bankayı başka bir şeyle eleştirdi: kimse müşteriye o limitin neden verildiğini açıklayamıyordu. Buna kara kutu problemi diyoruz. Sizin profilinizde puanın nedenini gösteren bir günlük vardı. Apple Card'da yoktu.

### Slayt 25 · Veri ihlali: Equifax ve Yemeksepeti (1,5 dk)

Çok veri toplamanın bir bedeli daha var: hedef haline gelirsiniz. Equifax, Amerika'nın üç kredi bürosundan biri. 2017'de yamalanmamış bir sunucu yüzünden 147 milyon kişinin verisi sızdı. Düzenleyicilerle 700 milyon dolara varan bir uzlaşma yaptı. Türkiye'de 2021'de Yemeksepeti'nden 21,5 milyon kullanıcının adresi, telefonu ve şifresi çalındı. Kesilen ceza 1,9 milyon lira. Kişi başına hesaplayınca Equifax'ta yaklaşık 9 dolar, Yemeksepeti'nde 9 kuruş. [Sınıfa sor:] Sizce 9 kuruş, bir şirketi veri güvenliğine yatırım yapmaya ikna eder mi? [Bir iki cevap al.]

### Slayt 26 · Etik sınır: Target, yasal ama rahatsız edici (1,5 dk)

Son hikaye finans dışından ama en öğreticisi. Amerikalı perakendeci Target, alışveriş verisinden bir hamilelik skoru geliştirdi. Kokusuz losyon, vitamin takviyesi gibi 25 ürünün alım düzenine bakıyordu. Bir gün bir baba mağazaya gidip bağırdı: liseye giden kızıma neden bebek kuponu gönderiyorsunuz? Birkaç gün sonra özür diledi, çünkü kızı gerçekten hamileydi. Target modeli kapatmadı. Bebek kuponlarının arasına alakasız ürünler koyup gizledi. Şirket sözcüsünün cümlesi slaytta: yasalara uysanız bile insanları rahatsız edecek şeyler yapabilirsiniz. [Sınıfa sor:] Bankanız hesap hareketlerinizden boşanacağınızı ya da işsiz kalacağınızı tahmin edebilir. Etmeli mi?

## Risk ve regülasyon (slayt 27–30)

### Slayt 27 · Bölüm 4: Riskler, etik ve regülasyon (15 sn)

Bu hikayelerin ortak noktası risk. Şimdi onları toparlayıp düzenleyicilerin cevabına bakalım.

### Slayt 28 · Altı risk, altı hikaye (1 dk)

Her hikaye bir riske karşılık geliyor. Algoritmik önyargı ve kara kutu: Apple Card. Gizlilik ve rıza: Target. Model riski: Zillow. Siber güvenlik: Equifax ve Yemeksepeti. Operasyonel risk: Knight Capital. Dikkat ederseniz bunların hiçbiri saf bir teknoloji hatası değil. Hepsi, verinin ve modelin nasıl yönetildiğiyle ilgili.

### Slayt 29 · Düzenleyiciler ne yapıyor? Türkiye, AB, ABD (1,5 dk)

Düzenleyiciler üç farklı yol izliyor. Türkiye'de 2016'dan beri KVKK var. 2025'te 328 ihlal bildirimi aldı ve 352 milyon lira ceza kesti. Ayrıca bankaların ana sistemlerini yurt içinde tutma zorunluluğu var. Avrupa en sert olanı. GDPR ile bir yılda 1,2 milyar euro ceza kesildi. Yeni Yapay Zekâ Yasası da kredi skorlamayı yüksek riskli sayıyor: modeli açıklamak ve insan gözetimi zorunlu. Amerika'da ise tek bir yasa yok, sektör sektör düzenleme var. Karşılaştırınca bir şey dikkat çekiyor: Türkiye'nin bir yıllık toplam cezası, Avrupa'da tek bir şirkete kesilen cezanın çok altında.

### Slayt 30 · Sırada ne var? (1 dk)

Önümüzdeki dönemde dört eğilim görüyorum. Bir: üretken yapay zekâ. Ugi ve Maxi gibi asistanlar sayesinde veriye sohbet ederek erişiliyor. İki: açık finans. Veri bankanın değil müşterinin olacak; sigortaya ve yatırıma genişleyecek. Üç: her şey gerçek zamanlı hale geliyor; anlık ödeme, anlık skorlama. Dört: gizliliği koruyan analitik. Bankalar veriyi paylaşmadan model eğitmenin yollarını arıyor. Bugün gördüğünüz özetleme bunun en basit örneğiydi.

## Tartışma ve kapanış (slayt 31–34)

### Slayt 31 · Eleştirel bakış: veri gerçekten “yeni petrol” mü? (3 dk)

Kapatmadan önce bir iddiayı birlikte tartalım. Herkes veri yeni petrol diyor. Doğru tarafları var: ham haliyle değersiz, işlenince değerli. Büyük yatırım istiyor. Az sayıda büyük oyuncuda toplanıyor. Ama bence üç yerde yanlış. Petrol tükenir; veri kullandıkça çoğalır. Petrolün sahibi bellidir; verinin sahibi banka mı, müşteri mi, hâlâ tartışıyoruz. Ve daha fazla petrol daha fazla enerji demektir, ama daha fazla veri daha iyi karar demek değil. Zillow'un elinde milyonlarca evin verisi vardı ve yine de battı. [Sınıfa sor:] Sizce Zillow'da eksik olan veri miydi, yoksa muhakeme mi? [Tartışmayı iki üç dakika yönet.]

### Slayt 32 · Sonuç olarak; (1 dk)

Toparlarsam. Büyük veri bir boyut değil, bir eşik: eldeki araçlar yetmediğinde başlıyor. Finans bunun en verimli alanı, çünkü finansın kendisi zaten veri. Değer veriyi toplarken değil, karar verirken üretiliyor. Türkiye kullanımda dünyanın önünde. Başarı hikayeleri verinin teminatın yerine geçebildiğini, çöküşler ise modelin insanın yerine geçemediğini gösterdi. Son cümlem şu: büyük veri, iyi soru sorana değer üretir.

### Slayt 33 · Kaynaklar (15 sn)

Kullandığım kaynaklar burada. Tam liste ve bağlantılar QR koddaki sayfada; her rakamın tarihi ve kaynağı orada yazıyor.

### Slayt 34 · Teşekkürler (30 sn)

Dinlediğiniz için teşekkür ederim. Sorularınızı alabilirim. Şifreleme laboratuvarını denemek isteyenler için sayfa açık kalacak.
