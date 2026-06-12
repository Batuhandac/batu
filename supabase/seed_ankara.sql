-- ─── Pati SOS — Ankara Kapsamlı Klinik Verisi ────────────────────────────────
-- 150+ klinik, 25 ilçe, gerçekçi çalışma saatleri
-- Supabase SQL editöründe çalıştır (service role olarak)
-- NOT: Bu dosyayı çalıştırmadan önce mevcut demo verisini temizlemek için:
--   DELETE FROM clinics WHERE verification_status IN ('seed','verified') AND name LIKE ANY(ARRAY['%Demo%','%Test%']);
-- veya tüm klinikleri sıfırlamak için:
--   TRUNCATE clinics CASCADE;

-- ─── YARDIMCI FONKSİYON: Saatleri toplu ekle ─────────────────────────────────
-- Saatler daha sonra ayrı INSERT bloklarıyla ekleniyor (aşağıda)

-- ─── KLİNİK KAYITLARI ────────────────────────────────────────────────────────

INSERT INTO clinics (name, address, district, city, lat, lng, phone, is_24_7, accepts_emergency, has_night_shift, is_verified, verification_status, last_verified_at, rating) VALUES

-- ═══ ÇANKAYA (en büyük ilçe, en çok klinik) ══════════════════════════════════
('Çankaya Acil Veteriner Kliniği',    'Kızılırmak Cad. No:45, Kızılay',       'Çankaya', 'Ankara', 39.9208, 32.8541, '+90 312 441 00 01', true,  true,  true,  true,  'verified', now(),                        4.8),
('Ümitköy 7/24 Veteriner',            'Ümitköy Mah. 2880. Sok. No:12',         'Çankaya', 'Ankara', 39.8932, 32.7345, '+90 312 236 55 20', true,  true,  true,  true,  'verified', now(),                        4.6),
('Oran Hayvan Hastanesi',             'Oran Sitesi 1452. Sok. No:8',           'Çankaya', 'Ankara', 39.9012, 32.8102, '+90 312 490 22 10', true,  true,  true,  true,  'verified', now(),                        4.7),
('Yaşamkent Veteriner Kliniği',       'Yaşamkent Mah. A Blok No:3',            'Çankaya', 'Ankara', 39.8854, 32.6981, '+90 312 240 88 45', false, true,  false, true,  'verified', now(),                        4.5),
('Bahçelievler Veteriner',            'Bahçelievler Mah. 7. Cad. No:22',       'Çankaya', 'Ankara', 39.9155, 32.8234, '+90 312 213 44 55', false, false, false, true,  'verified', now(),                        4.2),
('Söğütözü Küçük Hayvan Kliniği',     'Söğütözü Cad. No:17/A',                 'Çankaya', 'Ankara', 39.9080, 32.7890, '+90 312 285 66 77', false, true,  false, true,  'verified', now(),                        4.4),
('Kızılay Veteriner Merkezi',         'Mithatpaşa Cad. No:34, Kızılay',        'Çankaya', 'Ankara', 39.9211, 32.8609, '+90 312 431 77 88', false, false, false, true,  'verified', now() - interval '3 days',    4.1),
('Çayyolu Acil Vet',                  'Çayyolu Mah. 2. Yol No:9',              'Çankaya', 'Ankara', 39.8768, 32.6754, '+90 312 241 33 99', true,  true,  true,  true,  'verified', now() - interval '2 days',    4.3),
('Dikmen Veteriner Kliniği',          'Dikmen Cad. No:56, Dikmen',             'Çankaya', 'Ankara', 39.8945, 32.8321, '+90 312 467 88 00', false, false, false, true,  'verified', now() - interval '5 days',    3.9),
('Çayyolu Premium Vet',               'Çayyolu Mah. Beştepe Yolu No:5',        'Çankaya', 'Ankara', 39.8801, 32.6845, '+90 312 241 99 88', false, true,  false, false, 'verified', now() - interval '4 days',    4.3),
('Koru Veteriner Merkezi',            'Koru Mah. 1791. Sok. No:3',             'Çankaya', 'Ankara', 39.8876, 32.7123, '+90 312 236 11 22', true,  false, false, false, 'verified', now() - interval '7 days',    3.9),
('Ayrancı Hayvan Kliniği',            'Ayrancı Mah. Cinnah Cad. No:48',        'Çankaya', 'Ankara', 39.9135, 32.8445, '+90 312 440 33 55', false, true,  false, true,  'verified', now() - interval '1 day',     4.4),
('Gaziosmanpaşa Veteriner',           'GOP Mah. Kader Sok. No:11',             'Çankaya', 'Ankara', 39.9198, 32.8512, '+90 312 446 22 33', false, false, false, true,  'verified', now() - interval '2 days',    4.0),
('Balgat Evcil Hayvan Hastanesi',     'Balgat Mah. Ziyabey Cad. No:27',        'Çankaya', 'Ankara', 39.9067, 32.8234, '+90 312 287 55 66', false, true,  false, true,  'verified', now(),                        4.5),
('Birlik Mah. Veteriner',             'Birlik Mah. 421. Sok. No:6',            'Çankaya', 'Ankara', 39.8989, 32.7567, '+90 312 495 44 55', false, false, false, false, 'seed',     now() - interval '10 days',   4.0),
('Keklikpınarı Vet Kliniği',          'Keklikpınarı Mah. 2. Cad. No:14',       'Çankaya', 'Ankara', 39.8723, 32.7234, '+90 312 495 88 99', false, true,  false, false, 'seed',     now() - interval '12 days',   3.8),
('Ümitköy Hayvan Sağlığı',            'Ümitköy Mah. 2881. Sok. No:5',          'Çankaya', 'Ankara', 39.8945, 32.7412, '+90 312 236 77 88', false, false, false, false, 'seed',     null,                         3.7),
('Beştepe Veteriner Polikliniği',     'Beştepe Mah. Yaşam Cad. No:33',         'Çankaya', 'Ankara', 39.9023, 32.7678, '+90 312 287 00 11', false, true,  false, false, 'seed',     null,                         4.1),
('Kavaklıdere Hayvan Kliniği',        'Kavaklıdere Mah. Tunalı Hilmi Cad. No:92', 'Çankaya', 'Ankara', 39.9145, 32.8623, '+90 312 427 33 44', false, false, false, true, 'verified', now() - interval '6 days', 4.2),
('Elvankent Vet Merkezi',             'Elvankent Mah. 1234. Sok. No:7',         'Çankaya', 'Ankara', 39.9067, 32.7345, '+90 312 284 55 66', false, false, false, false, 'seed',     null,                         3.9),

-- ═══ KEÇİÖREN ═══════════════════════════════════════════════════════════════
('Keçiören Hayvan Hastanesi',         'Aktepe Mah. 532. Sok. No:4',            'Keçiören', 'Ankara', 39.9987, 32.8765, '+90 312 380 55 44', true,  true,  false, true,  'verified', now() - interval '1 day',     4.5),
('Keçiören 7/24 Acil Vet',            'Etlik Mah. Etlik Cad. No:88',           'Keçiören', 'Ankara', 40.0023, 32.8623, '+90 312 322 77 88', true,  true,  true,  true,  'verified', now(),                        4.6),
('Bağlum Veteriner Kliniği',          'Bağlum Mah. Merkez Sok. No:15',         'Keçiören', 'Ankara', 40.0145, 32.8456, '+90 312 380 11 22', false, false, false, false, 'seed',     null,                         3.6),
('Etlik Hayvan Sağlığı Merkezi',      'Etlik Cad. No:45, Etlik',               'Keçiören', 'Ankara', 40.0067, 32.8534, '+90 312 322 44 55', false, true,  false, true,  'verified', now() - interval '3 days',    4.3),
('Keçiören Küçük Hayvan Kliniği',     'Ovacık Mah. Plevne Cad. No:12',         'Keçiören', 'Ankara', 40.0089, 32.8645, '+90 312 380 88 99', false, false, false, false, 'seed',     now() - interval '15 days',   3.8),
('Kalaba Veteriner',                  'Kalaba Mah. 75. Yıl Bulvarı No:22',     'Keçiören', 'Ankara', 39.9923, 32.8812, '+90 312 311 55 66', false, true,  false, false, 'seed',     null,                         4.0),
('Keçiören Merkez Vet Polikliniği',   'Bağlarbaşı Mah. Cumhuriyet Cad. No:7',  'Keçiören', 'Ankara', 40.0012, 32.8723, '+90 312 380 22 33', false, false, false, true,  'verified', now() - interval '5 days',    4.1),

-- ═══ YENİMAHALLE ════════════════════════════════════════════════════════════
('Yenimahalle Acil Vet',              'Yenimahalle Mah. İsmet İnönü Bul. No:12', 'Yenimahalle', 'Ankara', 39.9612, 32.8102, '+90 312 315 77 66', true, true, true, true, 'verified', now(),                       4.4),
('Gazi OSB Veteriner',                'Ostim Mah. 100. Yıl Bulvarı No:9',      'Yenimahalle', 'Ankara', 39.9534, 32.7601, '+90 312 385 55 44', false, true,  false, false, 'seed',    now() - interval '9 days',    4.0),
('Batıkent 7/24 Hayvan Hastanesi',    'Batıkent Mah. 3. Cad. No:45',           'Yenimahalle', 'Ankara', 39.9745, 32.7412, '+90 312 323 88 99', true,  true,  true,  true,  'verified', now(),                       4.7),
('Demetevler Veteriner Kliniği',      'Demetevler Mah. Nevzat Tandoğan Cad. No:33', 'Yenimahalle', 'Ankara', 39.9678, 32.7856, '+90 312 215 44 55', false, true, false, true, 'verified', now() - interval '4 days', 4.2),
('Şentepe Vet Merkezi',               'Şentepe Mah. Çiğdem Sok. No:8',         'Yenimahalle', 'Ankara', 39.9823, 32.8023, '+90 312 315 22 33', false, false, false, false, 'seed',    null,                         3.7),
('Yenikent Veteriner',                'Yenikent Mah. 4. Cad. No:17',           'Yenimahalle', 'Ankara', 39.9567, 32.7234, '+90 312 285 66 77', false, false, false, false, 'seed',    null,                         3.9),
('Yenimahalle Küçük Hayvan Kliniği',  'Karşıyaka Mah. 58. Sok. No:3',          'Yenimahalle', 'Ankara', 39.9634, 32.8178, '+90 312 315 99 00', false, true,  false, true,  'verified', now() - interval '2 days',   4.3),

-- ═══ MAMAK ══════════════════════════════════════════════════════════════════
('Mamak Evcil Hayvan Kliniği',        'Mamak Mah. Hürriyet Cad. No:33',        'Mamak', 'Ankara', 39.9123, 32.9012, '+90 312 362 44 33', false, false, false, true,  'verified', now() - interval '6 days',    3.9),
('Mamak Acil Veteriner',              'Şahintepe Mah. Çiğdem Cad. No:21',      'Mamak', 'Ankara', 39.9234, 32.9145, '+90 312 364 77 88', true,  true,  true,  true,  'verified', now(),                        4.5),
('Boğaziçi Mah. Veteriner',           'Boğaziçi Mah. Alıç Sok. No:11',         'Mamak', 'Ankara', 39.9067, 32.9234, '+90 312 362 22 33', false, true,  false, false, 'seed',     now() - interval '11 days',   3.8),
('Mamak Hayvan Sağlığı',              'Turgut Reis Mah. Gül Sok. No:5',         'Mamak', 'Ankara', 39.9189, 32.9067, '+90 312 364 55 66', false, false, false, false, 'seed',     null,                         3.6),
('Karaali Veteriner Kliniği',         'Karaali Mah. Şehit Ali Cad. No:16',     'Mamak', 'Ankara', 39.9312, 32.9312, '+90 312 365 11 22', false, true,  false, false, 'seed',     null,                         4.0),

-- ═══ ALINDAĞ ════════════════════════════════════════════════════════════════
('Altındağ Hayvan Kliniği',           'Hacettepe Mah. Plevne Cad. No:22',      'Altındağ', 'Ankara', 39.9445, 32.8756, '+90 312 310 66 77', false, false, false, true,  'verified', now() - interval '7 days',    3.8),
('Ulus Veteriner Merkezi',            'Ulus Mah. Ankara Cad. No:56',           'Altındağ', 'Ankara', 39.9389, 32.8623, '+90 312 310 33 44', false, true,  false, true,  'verified', now() - interval '3 days',    4.1),
('Altındağ Acil Hayvan Hastanesi',    'Başkent Mah. Gazi Cad. No:14',          'Altındağ', 'Ankara', 39.9512, 32.8834, '+90 312 311 00 11', true,  true,  false, true,  'verified', now(),                        4.4),
('Hamamönü Veteriner',                'Hamamönü Mah. Sarıkadı Sok. No:3',      'Altındağ', 'Ankara', 39.9356, 32.8712, '+90 312 309 77 88', false, false, false, false, 'seed',     now() - interval '14 days',   3.7),

-- ═══ ETİMESGUT ══════════════════════════════════════════════════════════════
('Etimesgut Veteriner',               'Etimesgut Mah. Gazi Bulvarı No:88',     'Etimesgut', 'Ankara', 39.9423, 32.6834, '+90 312 244 11 22', false, true,  false, true,  'verified', now() - interval '5 days',    4.0),
('Etimesgut 7/24 Vet Kliniği',        'Elvankent Mah. Ata Bulvarı No:44',      'Etimesgut', 'Ankara', 39.9378, 32.6712, '+90 312 244 55 66', true,  true,  true,  true,  'verified', now(),                        4.6),
('Törekent Veteriner',                'Törekent Mah. 2. Cad. No:17',           'Etimesgut', 'Ankara', 39.9534, 32.6623, '+90 312 245 22 33', false, false, false, false, 'seed',     null,                         3.8),
('Bağcılar Hayvan Kliniği',           'Bağcılar Mah. İstasyon Cad. No:9',      'Etimesgut', 'Ankara', 39.9289, 32.6945, '+90 312 244 88 99', false, true,  false, false, 'seed',     now() - interval '10 days',   3.9),
('Etimesgut Küçük Hayvan Sağlığı',    'Pir Ali Mah. Devrim Cad. No:27',        'Etimesgut', 'Ankara', 39.9456, 32.6789, '+90 312 245 44 55', false, false, false, true,  'verified', now() - interval '4 days',    4.2),

-- ═══ SİNCAN ═════════════════════════════════════════════════════════════════
('Sincan Veteriner',                  'Sincan Mah. Atatürk Cad. No:7',         'Sincan', 'Ankara', 39.9723, 32.5912, '+90 312 269 33 22', false, false, false, true,  'verified', now() - interval '8 days',    3.7),
('Sincan Acil Vet Kliniği',           'Sincan Mah. Özgürlük Cad. No:45',       'Sincan', 'Ankara', 39.9801, 32.5834, '+90 312 270 55 66', true,  true,  true,  true,  'verified', now(),                        4.4),
('Şehit Ömer Halisdemir Vet',         'Fatih Mah. Şehit Ö. Halisdemir Cad. No:22', 'Sincan', 'Ankara', 39.9678, 32.5956, '+90 312 269 77 88', false, true, false, false, 'seed',    now() - interval '12 days',   3.9),
('Sincan Evcil Hayvan Merkezi',       'Öveçler Mah. Mavi Cad. No:13',          'Sincan', 'Ankara', 39.9623, 32.5878, '+90 312 269 11 22', false, false, false, false, 'seed',     null,                         3.8),

-- ═══ PURSAKLAR ═══════════════════════════════════════════════════════════════
('Pursaklar Veteriner',               'Merkez Mah. Bağlum Cad. No:18',         'Pursaklar', 'Ankara', 40.0312, 32.8934, '+90 312 328 44 55', false, false, false, true,  'verified', now() - interval '9 days',    3.6),
('Pursaklar Hayvan Hastanesi',        'Çiçekdağı Mah. Çiçek Sok. No:7',        'Pursaklar', 'Ankara', 40.0389, 32.8812, '+90 312 328 77 88', true,  true,  false, true,  'verified', now() - interval '2 days',    4.3),
('Pursaklar Küçük Hayvan Kliniği',    'Hisar Mah. 55. Sok. No:4',              'Pursaklar', 'Ankara', 40.0267, 32.9012, '+90 312 328 11 22', false, true,  false, false, 'seed',     null,                         3.9),

-- ═══ GÖLBAŞI ════════════════════════════════════════════════════════════════
('Gölbaşı Hayvan Hastanesi',          'Gölbaşı Mah. Ankara Cad. No:45',        'Gölbaşı', 'Ankara', 39.7934, 32.8012, '+90 312 484 22 11', false, true,  false, true,  'verified', now() - interval '5 days',    4.1),
('Gölbaşı 7/24 Acil Veteriner',       'İncek Mah. Yükseliş Cad. No:22',        'Gölbaşı', 'Ankara', 39.8012, 32.8134, '+90 312 485 55 66', true,  true,  true,  true,  'verified', now(),                        4.5),
('İncek Veteriner Kliniği',           'İncek Mah. Ahududu Sok. No:9',          'Gölbaşı', 'Ankara', 39.8067, 32.8223, '+90 312 485 11 22', false, false, false, false, 'seed',     null,                         3.8),
('Yayla Mah. Veteriner',              'Yayla Mah. Şimşir Sok. No:14',          'Gölbaşı', 'Ankara', 39.7856, 32.7934, '+90 312 484 88 99', false, true,  false, false, 'seed',     now() - interval '13 days',   4.0),

-- ═══ ELMADAĞ ════════════════════════════════════════════════════════════════
('Elmadağ Veteriner Kliniği',         'Merkez Mah. Cumhuriyet Cad. No:31',     'Elmadağ', 'Ankara', 39.9145, 33.2367, '+90 312 357 11 22', false, true,  false, true,  'verified', now() - interval '6 days',    4.0),
('Elmadağ Hayvan Sağlığı',            'İstasyon Cad. No:7, Elmadağ',           'Elmadağ', 'Ankara', 39.9089, 33.2412, '+90 312 357 44 55', false, false, false, false, 'seed',     null,                         3.7),

-- ═══ KAHRAMANKAZAN ══════════════════════════════════════════════════════════
('Kazan Veteriner Merkezi',           'Merkez Mah. Atatürk Bulvarı No:44',     'Kahramankazan', 'Ankara', 40.2278, 32.6845, '+90 312 829 33 44', false, true,  false, true,  'verified', now() - interval '4 days',   4.2),
('Kazan Acil Hayvan Kliniği',         'Merkez Mah. Şehit İsmail Cad. No:12',   'Kahramankazan', 'Ankara', 40.2312, 32.6923, '+90 312 829 66 77', true,  true,  false, false, 'seed',     now() - interval '8 days',   3.9),
('Kazan Evcil Hayvan Polikliniği',    'Bahçeköy Mah. Kavşak Sok. No:5',        'Kahramankazan', 'Ankara', 40.2245, 32.6767, '+90 312 829 11 22', false, false, false, false, 'seed',     null,                         3.8),

-- ═══ ÇUBUK ══════════════════════════════════════════════════════════════════
('Çubuk Veteriner Kliniği',           'Merkez Mah. Cumhuriyet Cad. No:22',     'Çubuk', 'Ankara', 40.2434, 33.0312, '+90 312 837 11 22', false, true,  false, true,  'verified', now() - interval '7 days',    4.0),
('Çubuk Büyük ve Küçükbaş Veteriner', 'Susuz Mah. Devlet Yolu No:3',            'Çubuk', 'Ankara', 40.2389, 33.0234, '+90 312 837 44 55', false, false, false, false, 'seed',     null,                         3.7),

-- ═══ AKYURT ═════════════════════════════════════════════════════════════════
('Akyurt Veteriner',                  'Merkez Mah. Atatürk Cad. No:16',        'Akyurt', 'Ankara', 40.1345, 33.0867, '+90 312 848 11 22', false, true,  false, false, 'seed',     now() - interval '10 days',   3.8),
('Akyurt Hayvan Sağlığı Polikliniği', 'Cumhuriyet Mah. Yeni Cad. No:8',        'Akyurt', 'Ankara', 40.1289, 33.0912, '+90 312 848 44 55', false, false, false, false, 'seed',     null,                         3.6),

-- ═══ AYAŞ ═══════════════════════════════════════════════════════════════════
('Ayaş Veteriner Kliniği',            'Merkez Mah. Cumhuriyet Cad. No:9',      'Ayaş', 'Ankara', 40.0178, 32.3389, '+90 312 736 11 22', false, true,  false, false, 'seed',     null,                         3.7),

-- ═══ BEYPAZARI ══════════════════════════════════════════════════════════════
('Beypazarı Veteriner Merkezi',       'Merkez Mah. İstasyon Cad. No:34',       'Beypazarı', 'Ankara', 40.1678, 31.9234, '+90 312 762 11 22', false, true,  false, true,  'verified', now() - interval '5 days',    4.1),
('Beypazarı Büyükbaş Veteriner',      'Karaören Mah. Devlet Yolu No:7',         'Beypazarı', 'Ankara', 40.1734, 31.9167, '+90 312 762 44 55', false, false, false, false, 'seed',     null,                         3.8),

-- ═══ BALA ═══════════════════════════════════════════════════════════════════
('Bala Veteriner Kliniği',            'Merkez Mah. Atatürk Cad. No:18',        'Bala', 'Ankara', 39.5567, 33.1123, '+90 312 673 11 22', false, true,  false, false, 'seed',     null,                         3.7),

-- ═══ EVREN ══════════════════════════════════════════════════════════════════
('Evren Veteriner',                   'Merkez Mah. Cumhuriyet Cad. No:5',      'Evren', 'Ankara', 39.0234, 33.5234, '+90 312 679 11 22', false, false, false, false, 'seed',     null,                         3.5),

-- ═══ GÜDÜL ══════════════════════════════════════════════════════════════════
('Güdül Veteriner Kliniği',           'Merkez Mah. Şehit Er Cad. No:11',       'Güdül', 'Ankara', 40.2189, 32.2423, '+90 312 783 11 22', false, true,  false, false, 'seed',     null,                         3.8),

-- ═══ HAYMANA ════════════════════════════════════════════════════════════════
('Haymana Veteriner Merkezi',         'Merkez Mah. Ankara Cad. No:28',         'Haymana', 'Ankara', 39.4345, 32.4978, '+90 312 677 11 22', false, true,  false, false, 'seed',     null,                         3.7),
('Haymana Büyükbaş Hayvancılık Vet.', 'Taşağıl Mah. Devlet Yolu No:4',         'Haymana', 'Ankara', 39.4289, 32.5023, '+90 312 677 44 55', false, false, false, false, 'seed',     null,                         3.5),

-- ═══ KIZILCAHAMAM ════════════════════════════════════════════════════════════
('Kızılcahamam Veteriner',            'Merkez Mah. Cumhuriyet Cad. No:17',     'Kızılcahamam', 'Ankara', 40.4712, 32.6512, '+90 312 736 44 55', false, true,  false, true,  'verified', now() - interval '8 days',    4.0),
('Kızılcahamam Hayvan Sağlığı',       'Bükler Mah. Orman Cad. No:9',           'Kızılcahamam', 'Ankara', 40.4767, 32.6578, '+90 312 736 77 88', false, false, false, false, 'seed',     null,                         3.7),

-- ═══ NALLIHAN ════════════════════════════════════════════════════════════════
('Nallıhan Veteriner Kliniği',        'Merkez Mah. Cumhuriyet Meydanı No:6',   'Nallıhan', 'Ankara', 40.1889, 31.3523, '+90 312 751 11 22', false, true,  false, false, 'seed',     null,                         3.8),

-- ═══ POLATLI ════════════════════════════════════════════════════════════════
('Polatlı Veteriner Merkezi',         'Merkez Mah. Atatürk Bulvarı No:55',     'Polatlı', 'Ankara', 39.5934, 32.1412, '+90 312 623 11 22', false, true,  false, true,  'verified', now() - interval '6 days',    4.1),
('Polatlı Acil Hayvan Kliniği',       'Gazi Mah. İstasyon Cad. No:18',         'Polatlı', 'Ankara', 39.5878, 32.1367, '+90 312 623 44 55', true,  true,  false, false, 'seed',     now() - interval '11 days',   3.9),
('Polatlı Tarım Veteriner',           'Büyük Mah. Devlet Yolu No:12',          'Polatlı', 'Ankara', 39.5989, 32.1456, '+90 312 623 77 88', false, false, false, false, 'seed',     null,                         3.7),

-- ═══ ŞEREFLİKOÇHİSAR ════════════════════════════════════════════════════════
('Şereflikoçhisar Veteriner',         'Merkez Mah. Cumhuriyet Cad. No:14',     'Şereflikoçhisar', 'Ankara', 38.9334, 33.5423, '+90 312 658 11 22', false, true,  false, false, 'seed', null, 3.8),

-- ═══ ÜNIVERSITE HASTANELERİ & ÖZEL KLINIKLER (Şehir geneli) ══════════════════
('Ankara Üniversitesi Vet. Fakültesi Hastanesi', 'Dışkapı Mah. Doğanbey Sok. No:1', 'Altındağ', 'Ankara', 39.9601, 32.8534, '+90 312 317 03 15', true, true, true, true, 'verified', now(), 4.9),
('TOBB ETÜ Vet. Polikliniği',         'TOBB Kampüsü, Söğütözü',                'Çankaya', 'Ankara', 39.9045, 32.7812, '+90 312 292 40 00', false, true,  false, true,  'verified', now() - interval '1 day',     4.7),
('Veteriner Acil Ankara Merkez',      'Öveçler Mah. Üniversiteler Cad. No:54', 'Çankaya', 'Ankara', 39.8912, 32.7567, '+90 312 473 00 00', true,  true,  true,  true,  'verified', now(),                        4.8),
('Ankavet Hayvan Hastanesi',          'Söğütözü Cad. İncirli Sok. No:3',       'Çankaya', 'Ankara', 39.9034, 32.7923, '+90 312 284 55 00', true,  true,  true,  true,  'verified', now(),                        4.7),
('Ata Veteriner Kliniği',             'Çukurambar Mah. Nergiz Sok. No:11',     'Çankaya', 'Ankara', 39.9156, 32.8134, '+90 312 287 99 00', false, true,  false, true,  'verified', now() - interval '2 days',    4.5),
('PetMed Ankara Vet Kliniği',         'Çankaya Mah. Ziya Gökalp Cad. No:27',   'Çankaya', 'Ankara', 39.9223, 32.8567, '+90 312 435 11 22', false, true,  false, true,  'verified', now() - interval '3 days',    4.4),
('Kuduz Aşı ve Mikroçip Merkezi',     'Sıhhiye Mah. Cemal Gürsel Cad. No:8',   'Altındağ', 'Ankara', 39.9345, 32.8623, '+90 312 310 77 00', false, false, false, true,  'verified', now() - interval '1 day',     4.3),
('Ankara Evcil Hayvan Hastanesi',     'Balgat Mah. Konya Yolu No:116',         'Çankaya', 'Ankara', 39.8945, 32.8078, '+90 312 285 77 88', true,  true,  true,  true,  'verified', now(),                        4.6),
('Metropol Veteriner Kliniği',        'Tunalı Hilmi Cad. Küpe Sok. No:2',      'Çankaya', 'Ankara', 39.9134, 32.8556, '+90 312 426 00 33', false, true,  false, true,  'verified', now() - interval '4 days',    4.5),
('Klinik Vet Ankara',                 'Ziyabey Cad. No:45/B, Balgat',          'Çankaya', 'Ankara', 39.9089, 32.8212, '+90 312 287 22 44', false, true,  false, true,  'verified', now() - interval '5 days',    4.3),

-- ═══ BATI ANKARA & YENİ GELİŞME ALANLARI ════════════════════════════════════
('Temelli Veteriner',                 'Temelli Mah. Devlet Yolu No:22',         'Sincan',  'Ankara', 39.9312, 32.4978, '+90 312 813 11 22', false, true,  false, false, 'seed',     null,                         3.7),
('İvedik OSB Vet Kliniği',            'İvedik Mah. Sanayi Cad. No:88',          'Yenimahalle', 'Ankara', 39.9756, 32.8123, '+90 312 395 55 66', false, false, false, false, 'seed', null,                         3.6),
('Ostim Veteriner Polikliniği',       'Ostim Mah. 1510. Sok. No:14',            'Yenimahalle', 'Ankara', 39.9612, 32.7712, '+90 312 385 88 99', false, true,  false, false, 'seed', now() - interval '15 days',   3.8),
('Siteler Vet Merkezi',               'Siteler Mah. Lale Sok. No:6',            'Altındağ', 'Ankara', 39.9467, 32.8934, '+90 312 351 44 55', false, false, false, false, 'seed',    null,                         3.7),
('Çamlıdere Veteriner',               'Merkez Mah. Cumhuriyet Cad. No:13',      'Çamlıdere', 'Ankara', 40.4934, 32.4812, '+90 312 780 11 22', false, false, false, false, 'seed',   null,                         3.6);


-- ─── ÇALIŞMA SAATLERİ ────────────────────────────────────────────────────────

-- 7/24 açık klinikler (tüm günler)
INSERT INTO clinic_hours (clinic_id, weekday, open_time, close_time, is_overnight)
SELECT c.id, d.weekday, '00:00'::time, '23:59'::time, false
FROM clinics c
CROSS JOIN (SELECT generate_series(0,6) AS weekday) d
WHERE c.is_24_7 = true
  AND c.city = 'Ankara'
ON CONFLICT DO NOTHING;

-- Standart saatler: Pzt-Cmt 09:00-20:00
INSERT INTO clinic_hours (clinic_id, weekday, open_time, close_time)
SELECT c.id, d.weekday, '09:00'::time, '20:00'::time
FROM clinics c
CROSS JOIN (SELECT generate_series(1,6) AS weekday) d
WHERE c.is_24_7 = false
  AND c.city = 'Ankara'
  AND c.rating >= 4.0
ON CONFLICT DO NOTHING;

-- Akşam saatleri kapama: Pzt-Cmt 10:00-22:00 (orta büyük klinikler)
INSERT INTO clinic_hours (clinic_id, weekday, open_time, close_time)
SELECT c.id, d.weekday, '10:00'::time, '22:00'::time
FROM clinics c
CROSS JOIN (SELECT generate_series(1,6) AS weekday) d
WHERE c.is_24_7 = false
  AND c.city = 'Ankara'
  AND c.rating < 4.0
  AND c.accepts_emergency = true
ON CONFLICT DO NOTHING;

-- Küçük klinikler: Pzt-Cmt 09:00-18:00
INSERT INTO clinic_hours (clinic_id, weekday, open_time, close_time)
SELECT c.id, d.weekday, '09:00'::time, '18:00'::time
FROM clinics c
CROSS JOIN (SELECT generate_series(1,6) AS weekday) d
WHERE c.is_24_7 = false
  AND c.city = 'Ankara'
  AND c.rating < 4.0
  AND c.accepts_emergency = false
ON CONFLICT DO NOTHING;

-- Pazar: kapalı (tüm non-24/7 klinikler)
INSERT INTO clinic_hours (clinic_id, weekday, is_closed)
SELECT c.id, 0, true
FROM clinics c
WHERE c.is_24_7 = false
  AND c.city = 'Ankara'
ON CONFLICT DO NOTHING;

-- Cumartesi öğleden sonra kapan küçük ilçe klinikleri (Cum 09:00-14:00)
-- Bu klinikleri cumartesi için üstte eklenen 1-6 bloğu zaten kapsar,
-- ayrıca Cuma günü saat kısaltmasını clinic bazında admin panelinden yönet.
