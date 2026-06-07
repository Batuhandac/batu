# Pati SOS — Release Kılavuzu

## Ön Koşullar (İnsan Adımları)

1. **EAS Hesabı:** `npx eas-cli login` ile giriş yap
2. **app.json:** `extra.eas.projectId` alanını `npx eas init` ile doldur
3. **iOS:** Apple Developer hesabı, bundle ID `com.patisos.app` kayıtlı
4. **Android:** Google Play Console hesabı, `com.patisos.app` paketi kayıtlı
5. **eas.json:** Doğru `appleId`, `ascAppId`, `appleTeamId` ve `google-play-key.json` yolu
6. **Supabase:** Schema + RPC + seed çalıştırıldı, env dolduruldu
7. **Gerçek Klinik Verisi:** Admin panel üzerinden Ankara klinikleri telefon ile doğrulanmadıkça YAYINA ALMA

---

## Build Komutları

```bash
# iOS production build
eas build -p ios --profile production

# Android production build (AAB)
eas build -p android --profile production

# İkisini birden (paralel)
eas build --platform all --profile production
```

## Submit Komutları

```bash
# App Store'a gönder
eas submit -p ios --latest

# Google Play'e gönder (Internal test track)
eas submit -p android --latest
```

## Mağaza Görselleri Metni

Ekran görüntüsü başlıkları (sırasıyla):
1. "Gece 02:00, petin kötü. İlk açtığın app."
2. "Açık. Acil kabul. Doğrulanmış. Saniyeler içinde."
3. "Maps yalan söyleyebilir. Biz son doğrulama zamanını gösteririz."
4. "Petinin acil kartı tek tuşla kliniğe gider."
5. "Ankara'da ücretsiz. Hazırlıklı ol."

## Yayın Öncesi Kontrol

- [ ] Supabase schema + RPC çalışıyor
- [ ] 20+ gerçek klinik doğrulanmış (admin panel)
- [ ] `nearby_clinics` RPC test edildi, açık klinikler üstte çıkıyor
- [ ] Disclaimer her kritik ekranda mevcut
- [ ] Onboarding disclaimer checkbox zorunlu
- [ ] "Ara" dialer açıyor, "Yol tarifi" interstitial gösteriyor
- [ ] Pet kartı ≤30 saniyede oluşturulabiliyor
- [ ] Çevrimdışı cache + banner çalışıyor
- [ ] PostHog event'leri geliyor
- [ ] ToS / Gizlilik politikası URL'leri ayarlanmış
- [ ] KVKK veri silme yolu çalışıyor

## Kritik NOT

> Uygulama seed verisiyle yayına alınmamalı. Admin panelden en az 10-15 Ankara kliniği gerçek bilgilerle doğrulanmadan App Store / Google Play'e gönderilmemelidir.
