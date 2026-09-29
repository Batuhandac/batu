# Patiport ödeme sunucusu (iyzico, deneme ortamı)

Hekim panelindeki **Tahsilat → Telefondan kartla (iyzico)** seçeneğinin arkasındaki
küçük sunucu. Cloudflare Workers üzerinde ücretsiz çalışır; kredi kartı istemez.

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

## Canlıya geçiş (şimdilik değil)

- Kliniğin (ya da Patiport'un pazar yeri olarak) iyzico ile sözleşmesi gerekir.
- `wrangler.toml` içinde `IYZICO_BASE_URL = "https://api.iyzipay.com"`, secret'lara canlı anahtarlar.
- Ödeme sayfasındaki alıcı bilgileri (ad, kimlik no, e-posta) şu an yer tutucu; canlıda
  sözleşmeye ve mali müşavir görüşüne göre ele alınmalı. e-SMM ayrı bir adım.
- Satış modu `iyzico_test` yerine canlı bir mod ve kurallarda karşılığı eklenmeli.

## Geliştirme

- Kod: `src/index.js` (bağımlılık yok). Uçlar: `POST /start`, `POST /callback`, `GET /health`.
- Satış belgesi: `clinic_pos/{clinicId}/sales/{saleId}`; kurallar `firestore.rules`.
- Hekim oturumu (Firebase ID token) Google'ın açık anahtarlarıyla sunucuda doğrulanır.
- Testte `FIRESTORE_URL`, `AUTH_URL`, `DEV_BEARER` ve `JWKS_URL` ile emülatöre ve sahte anahtarlara bağlanır.
