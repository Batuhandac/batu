# Firebase Kurulumu (5 dakika, ücretsiz) 🔥

Topluluk özellikleri — **klinik ekleme, yorum/fotoğraf, hatalı bilgi bildirimi ve veteriner hekim başvuruları** —
için ücretsiz bir Firebase (Firestore) projesi gerekiyor. Kurulum yapılmazsa
uygulama yine çalışır; sadece bu iki özellik gizli kalır (yerel veri tam çalışır).

## 1. Proje oluştur
1. https://console.firebase.google.com → **"Add project"**
2. İsim: `pati-sos` → devam → Google Analytics'i kapatabilirsin → **Create**

## 2. Firestore'u aç
1. Sol menü → **Build → Firestore Database** → **Create database**
2. **Production mode** seç → konum: `eur3 (europe-west)` → **Enable**

## 3. Web app config'i al
1. Proje ayarları (⚙️ Project settings) → **General** sekmesi
2. Aşağıda **"Your apps"** → **Web** simgesine (`</>`) tıkla
3. Takma ad: `pati-sos-web` → **Register app**
4. Görünen `firebaseConfig` değerlerini kopyala:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "pati-sos.firebaseapp.com",
     projectId: "pati-sos",
     storageBucket: "pati-sos.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234:web:abcd..."
   };
   ```

## 4. Config'i uygulamaya ekle
`app.json` dosyasında `extra.firebase` alanını doldur:
```json
"firebase": {
  "apiKey": "AIza...",
  "authDomain": "pati-sos.firebaseapp.com",
  "projectId": "pati-sos",
  "storageBucket": "pati-sos.appspot.com",
  "messagingSenderId": "1234567890",
  "appId": "1:1234:web:abcd..."
}
```
> Not: Bu değerler gizli değildir (istemci tarafı anahtarlar). Güvenlik
> Firestore kurallarıyla sağlanır (aşağıda).

## 5. Güvenlik kuralları (ZORUNLU)
Kurallar repoda hazır; yapıştırman yeterli:

1. **Firestore → Rules** sekmesi → `firestore.rules` dosyasının **tamamını** yapıştır → **Publish**
2. **Storage → Rules** sekmesi → `storage.rules` dosyasının tamamını yapıştır → **Publish**
   (Storage açık değilse önce **Build → Storage → Get started**.)

Kurallar olmadan: klinik başvuruları, hatalı bilgi bildirimleri, "açık mı?"
teyitleri, fotoğraflar ve onaylı klinik profilleri **çalışmaz** (Firebase
varsayılan olarak her şeyi reddeder).

Kısaca ne sağlar:
- Kullanıcı eklediği klinik `pending` olarak kaydedilir, sen onaylayana kadar görünmez.
- `clinic_profiles` (klinik onaylı bilgiler) yalnızca Console'dan yazılabilir.
- Başvurular ve bildirimler kişisel veri içerir; uygulamadan okunamaz, sadece Console'da görürsün.

## 6. (Yorumlar ve fotoğraflar için) bileşik index
İlk sorguda Firebase konsolu bir index linki verebilir — tıkla, **Create index** de.
Ya da elle:
- `reviews`: `clinic_id` (Ascending) + `created_at` (Descending)
- `clinic_photos`: `clinic_id` (Ascending) + `created_at` (Descending)

Başvuru/onay süreci için: `YONETICI_REHBERI.md`.

## 7. Bitti ✅
Değişikliği push et — yeni build'de "Klinik Ekle" ve "Yorumlar" otomatik aktif olur.

---

### Alternatif: EAS Secret olarak (config'i repoda tutmamak için)
`app.json` yerine EAS environment variable kullanabilirsin:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```
Kod her iki kaynağı da okur (`lib/firebase.ts`).
