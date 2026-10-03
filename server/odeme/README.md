# Patiport ödeme sunucusu (iyzico ve Paraşüt)

Hekim panelindeki **Tahsilat** ve **Ayarlar** sayfalarının arkasındaki küçük sunucu.
Cloudflare Workers üzerinde ücretsiz çalışır; kredi kartı istemez.

- **Kliniğin kendi iyzico hesabı:** Hekim Ayarlar'da kendi API anahtarlarını girer; sunucu
  anahtarları iyzico'da dener, şifreleyip saklar. Kartla ödemeler doğrudan kliniğin
  hesabına geçer. Bağlamamış klinikte panel kartla ödeme yerine "iyzico hesabını bağla" der.
  Patiport'un deneme hesabı (`IYZICO_API_KEY`) yalnızca eski deneme kayıtları (`iyzico_test`)
  için durur; panel artık bu modda satış açmaz.
- **Paraşüt:** Hekim "Paraşüt'e bağlan" der, Paraşüt'ün kendi sayfasında izin verir (şifresi
  bize gelmez). Nakit ve canlı kart tahsilatlarında e-SMM ya da e-Arşiv kendiliğinden
  kesilir. Deneme ödemelerine belge kesilmez.
- **Şifreli kasa:** Kliniklerin anahtarları ve Paraşüt oturumları AES-256-GCM ile şifrelenip
  `clinic_secrets` koleksiyonunda durur; uygulamadan okunamaz. Şifreleme anahtarı
  (`PAY_ENC_KEY`) yalnızca Cloudflare'de durur, yayın akışı ilk kez rastgele üretir ve
  bir daha değiştirmez. **Bu secret'ı silmeyin:** silinirse bağlı hesaplar açılamaz,
  klinikler yeniden bağlamak zorunda kalır.

Ne yapar:

1. Panel "ödeme sayfası aç" deyince hekimi doğrular, tutarı satış belgesinden okur ve
   iyzico'nun ödeme formunu başlatır. Ödeme sayfasının adresi panele QR olarak gelir.
2. Hasta sahibi QR'ı telefonuyla okutur, iyzico'nun sayfasında kartla öder (3D Secure dahil).
3. iyzico sonucu sunucuya bildirir; sunucu sonucu iyzico'ya kendisi sorar ve satış
   belgesine yazar. Panel sonucu anında gösterir.

Anahtarlar yalnızca Cloudflare'de ve GitHub secret'larında durur; tarayıcıya ve depoya
hiç yazılmaz. Deneme ortamında para sahtedir.

## Kurulum (bir kez, yaklaşık 15 dakika)

Hepsi `Batuhandac/batu` deposunun **Settings → Secrets and variables → Actions → New
repository secret** ekranına eklenir: https://github.com/Batuhandac/batu/settings/secrets/actions/new
(**Name** kutusuna adı, **Secret** kutusuna değeri yaz → **Add secret**). Anahtarları kimseyle (sohbet dahil) paylaşma.

### 1. iyzico deneme hesabı → `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`

1. https://sandbox-merchant.iyzipay.com/auth/register adresinden kaydol. SMS kodu
   deneme ortamında her zaman **123456**.
2. Giriş yap → sol menü **Ayarlar → Firma Ayarları** → sayfanın altındaki **API
   Anahtarları** → **Göster**.
3. "API Anahtarı"nı `IYZICO_API_KEY`, "Güvenlik Anahtarı"nı `IYZICO_SECRET_KEY` olarak ekle.
   İkisi de `sandbox-` ile başlar.

### 2. Firebase hizmet hesabı → `FIREBASE_SERVICE_ACCOUNT`

1. https://console.firebase.google.com/project/pati-sos/settings/serviceaccounts/adminsdk
   (Console İngilizce: dişli → **Project settings → Service accounts**).
2. **Generate new private key** → **Generate key** → bir JSON dosyası iner.
3. Dosyayı metin düzenleyiciyle aç, **tüm içeriğini** `FIREBASE_SERVICE_ACCOUNT` olarak ekle.
   Dosyayı sonra bilgisayarından sil. Bu anahtar veritabanına tam yetkiyle yazabilir.

### 3. Cloudflare → `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

1. https://dash.cloudflare.com/sign-up adresinden ücretsiz hesap aç.
2. Sol menüden **Workers & Pages**'i bir kez aç. workers.dev alt alan adı sorarsa bir ad seç.
   Aynı sayfanın sağında **Account ID** yazar; onu `CLOUDFLARE_ACCOUNT_ID` olarak ekle.
3. Sağ üstte profil → **My Profile → API Tokens → Create Token** → **Edit Cloudflare
   Workers** şablonu → **Use template** → Account Resources'ta kendi hesabını seç →
   **Continue to summary → Create Token**. Çıkan token'ı `CLOUDFLARE_API_TOKEN` olarak ekle.

### 4. Yayınla

1. https://console.firebase.google.com/project/pati-sos/firestore/rules (Firestore
   Database → **Rules**): depodaki güncel `firestore.rules` içeriğini yapıştır → **Publish**.
2. GitHub → batu → **Actions → Site → GitHub Pages → Run workflow**. "Ödeme sunucusunu
   yayınla" adımı yeşil olunca panelde iyzico seçeneği görünür.

## Deneme

1. Panelde bir hasta kartı aç → **Tahsilat** → **Telefondan kartla (iyzico)** → tutar → **ödeme sayfası aç**.
2. QR'ı telefonun kamerasıyla okut (ya da "Bu cihazda aç").
3. iyzico sayfasında deneme kartı: **5528 7900 0000 0008**, son kullanma **12/30**, CVC **123**.
   SMS şifresi sorulursa **123456**.
4. Hasta kartında "Ödeme alındı (iyzico deneme)" ve makbuz taslağı çıkar. İşlemi iyzico
   deneme panelinde de görürsün.

Reddedilen ödeme için **4129 1111 1111 1111** ("Do not honour"), yetersiz bakiye için
**4111 1111 1111 1129**. Tam liste: https://docs.iyzico.com/ek-bilgiler/test-kartlari

## Paraşüt'ü açmak (bir kez, yönetici)

Paraşüt API'sini kullanmak için Patiport'un bir uygulama kimliği olmalı; Paraşüt bunu
başvuru üzerine verir.

1. **destek@parasut.com** adresine e-posta: "Patiport adlı veteriner kliniği yazılımımız
   için API erişimi (client_id ve client_secret) istiyoruz. Kullanıcılarımız kendi Paraşüt
   hesaplarıyla authorization code akışıyla bağlanacak. Yönlendirme adresi:
   `https://patiport-odeme.patiport-2e6f12.workers.dev/connect/parasut/callback`"
2. Gelen değerleri batu deposuna secret olarak ekle: `PARASUT_CLIENT_ID`,
   `PARASUT_CLIENT_SECRET`.
3. Actions → **Site → GitHub Pages → Run workflow**. Panelde Ayarlar → Paraşüt kartındaki
   "Yakında" kalkar, "Paraşüt'e bağlan" düğmesi çıkar.

## Hekim için: kendi iyzico hesabını bağlamak

1. iyzico üye işyeri paneli → **Ayarlar → Firma Ayarları → API Anahtarları**.
2. Patiport paneli → **Ayarlar → Kartla ödeme: iyzico** → iki anahtarı yapıştır → **Bağla ve dene**.
3. "Bağlı · Canlı" görünür; bundan sonra hasta kartındaki **Kartla** seçeneği kliniğin
   hesabını kullanır. "sandbox-" ile başlayan anahtarlar deneme ortamında çalışır.

## Canlıya geçişte dikkat

- Canlı ödemeler kliniğin kendi iyzico sözleşmesiyle olur (Patiport'un deneme hesabı yalnızca
  deneme içindir; `IYZICO_BASE_URL` sandbox kalmalı).
- Ödeme sayfasındaki ve e-belgedeki alıcı bilgileri nihai tüketici yer tutucularıdır (kimlik no
  11111111111); hekim kendi mali müşaviriyle belge türünü ve KDV oranını Ayarlar'da belirler.

## Geliştirme

- Kod: `src/` (bağımlılık yok): `index.js` uçlar, `iyzico.js`, `parasut.js`, `vault.js`
  (şifreli kasa), `plan.js` (erken erişim ve kurucu klinik), `firebase.js`, `util.js`.
- Uçlar: `POST /start`, `POST /callback`, `POST /check`, `POST /connect/iyzico`,
  `POST /disconnect`, `POST /connect/parasut/begin`, `GET /connect/parasut/callback`,
  `POST /edoc/issue`, `POST /edoc/pdf`, `POST /plan`, `GET /health`.
- Paket: `POST /plan` kliniğin paketini döner, ilk kez soruluyorsa `clinic_plans/{clinicId}`
  belgesini oluşturur. Erken erişimde (31 Mart 2027 dahil) ilk 50 klinik kurucu klinik
  sırası alır; sayaç (`plan_meta/founders`) ve paket tek yazımda, ön koşulla güncellenir.
- Satış belgesi: `clinic_pos/{clinicId}/sales/{saleId}`; kurallar `firestore.rules`.
- Hekim oturumu (Firebase ID token) Google'ın açık anahtarlarıyla sunucuda doğrulanır.
- Testte `FIRESTORE_URL`, `AUTH_URL`, `DEV_BEARER` ve `JWKS_URL` ile emülatöre ve sahte anahtarlara bağlanır.
