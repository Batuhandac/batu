# Firebase Kurulumu (5 dakika, ücretsiz) 🔥

Topluluk özellikleri — **kullanıcıların klinik eklemesi ve yorum yazması** —
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

## 5. Firestore güvenlik kuralları
Firestore → **Rules** sekmesine yapıştır → **Publish**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Klinikler: herkes okuyabilir, herkes ekleyebilir (alan doğrulamalı)
    match /community_clinics/{id} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() > 1
                    && request.resource.data.lat is number
                    && request.resource.data.lng is number;
      allow update, delete: if false;
    }

    // Yorumlar: herkes okuyabilir, herkes ekleyebilir (1–5 puan)
    match /reviews/{id} {
      allow read: if true;
      allow create: if request.resource.data.rating is number
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5
                    && request.resource.data.clinic_id is string;
      allow update, delete: if false;
    }
  }
}
```

## 6. (Yorumlar için) bileşik index
İlk yorum sorgusunda Firebase konsolu bir index linki verebilir — tıkla,
**Create index** de. Ya da elle: `reviews` koleksiyonu →
`clinic_id` (Ascending) + `created_at` (Descending).

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
