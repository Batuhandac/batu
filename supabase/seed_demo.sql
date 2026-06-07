-- 20 demo clinics for Ankara (mixed hours, some 24/7, some emergency)
-- verification_status: 12 with last_verified_at=now(), rest null

insert into clinics (name, address, district, lat, lng, phone, is_24_7, accepts_emergency, has_night_shift, is_verified, verification_status, last_verified_at, rating) values
('Çankaya Acil Veteriner Kliniği', 'Kızılırmak Cad. No:45, Çankaya', 'Çankaya', 39.9208, 32.8541, '+90 312 441 00 01', true, true, true, true, 'verified', now(), 4.8),
('Ümitköy 7/24 Veteriner', 'Ümitköy Mah. 2880 Sok. No:12', 'Çankaya', 39.8932, 32.7345, '+90 312 236 55 20', true, true, true, true, 'verified', now(), 4.6),
('Yaşamkent Veteriner Kliniği', 'Yaşamkent Mah. A Blok No:3', 'Çankaya', 39.8854, 32.6981, '+90 312 240 88 45', false, true, false, true, 'verified', now(), 4.5),
('Oran Hayvan Hastanesi', 'Oran Sitesi 1452 Sok. No:8', 'Çankaya', 39.9012, 32.8102, '+90 312 490 22 10', true, true, true, true, 'verified', now(), 4.7),
('Bahçelievler Veteriner', 'Bahçelievler Mah. 7. Cad. No:22', 'Çankaya', 39.9155, 32.8234, '+90 312 213 44 55', false, false, false, true, 'verified', now(), 4.2),
('Söğütözü Küçük Hayvan Kliniği', 'Söğütözü Cad. No:17/A', 'Çankaya', 39.9080, 32.7890, '+90 312 285 66 77', false, true, false, true, 'verified', now(), 4.4),
('Kızılay Veteriner Merkezi', 'Mithatpaşa Cad. No:34, Kızılay', 'Çankaya', 39.9211, 32.8609, '+90 312 431 77 88', false, false, false, true, 'verified', now() - interval '3 days', 4.1),
('Cayyolu Acil Vet', 'Cayyolu Mah. 2. Yol No:9', 'Çankaya', 39.8768, 32.6754, '+90 312 241 33 99', true, true, true, false, 'verified', now() - interval '2 days', 4.3),
('Dikmen Veteriner Kliniği', 'Dikmen Cad. No:56', 'Çankaya', 39.8945, 32.8321, '+90 312 467 88 00', false, false, false, false, 'seed', now() - interval '5 days', 3.9),
('Keçiören Hayvan Hastanesi', 'Aktepe Mah. 532 Sok. No:4', 'Keçiören', 39.9987, 32.8765, '+90 312 380 55 44', true, true, false, true, 'verified', now() - interval '1 day', 4.5),
('Etimesgut Veteriner', 'Etimesgut Mah. Gazi Bulvarı No:88', 'Etimesgut', 39.9423, 32.6834, '+90 312 244 11 22', false, true, false, false, 'seed', now() - interval '6 days', 4.0),
('Mamak Evcil Hayvan Kliniği', 'Mamak Mah. Hürriyet Cad. No:33', 'Mamak', 39.9123, 32.9012, '+90 312 362 44 33', false, false, false, false, 'seed', now() - interval '8 days', 3.8),
('Yenimahalle Acil Vet', 'Yenimahalle Mah. İsmet İnönü Bul. No:12', 'Yenimahalle', 39.9612, 32.8102, '+90 312 315 77 66', true, true, true, false, 'seed', null, 4.2),
('Sincan Veteriner', 'Sincan Mah. Atatürk Cad. No:7', 'Sincan', 39.9723, 32.5912, '+90 312 269 33 22', false, false, false, false, 'seed', null, 3.7),
('Gölbaşı Hayvan Hastanesi', 'Gölbaşı Mah. Ankara Cad. No:45', 'Gölbaşı', 39.7934, 32.8012, '+90 312 484 22 11', false, true, false, false, 'seed', null, 4.1),
('Çayyolu Premium Vet', 'Çayyolu Mah. Beştepe Yolu No:5', 'Çankaya', 39.8801, 32.6845, '+90 312 241 99 88', false, true, false, false, 'seed', null, 4.3),
('Koru Veteriner Merkezi', 'Koru Mah. 1791 Sok. No:3', 'Çankaya', 39.8876, 32.7123, '+90 312 236 11 22', true, false, false, false, 'seed', null, 3.9),
('Pursaklar Veteriner', 'Merkez Mah. Bağlum Cad. No:18', 'Pursaklar', 40.0312, 32.8934, '+90 312 328 44 55', false, false, false, false, 'seed', null, 3.6),
('Altındağ Hayvan Kliniği', 'Hacettepe Mah. Plevne Cad. No:22', 'Altındağ', 39.9445, 32.8756, '+90 312 310 66 77', false, false, false, false, 'seed', null, 3.8),
('Gazi OSB Veteriner', 'Ostim Mah. 100 Yıl Bulvarı No:9', 'Yenimahalle', 39.9534, 32.7601, '+90 312 385 55 44', false, true, false, false, 'seed', null, 4.0);

-- clinic hours for the 24/7 ones (all days open)
insert into clinic_hours (clinic_id, weekday, open_time, close_time, is_overnight)
select c.id, d.weekday, '00:00'::time, '23:59'::time, false
from clinics c
cross join (select generate_series(0,6) as weekday) d
where c.is_24_7 = true;

-- weekday hours (Mon-Sat 09:00-20:00) for non-24/7 clinics
insert into clinic_hours (clinic_id, weekday, open_time, close_time)
select c.id, d.weekday, '09:00'::time, '20:00'::time
from clinics c
cross join (select generate_series(1,6) as weekday) d
where c.is_24_7 = false;

-- Sunday closed for non-24/7
insert into clinic_hours (clinic_id, weekday, is_closed)
select c.id, 0, true
from clinics c
where c.is_24_7 = false;
