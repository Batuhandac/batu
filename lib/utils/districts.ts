import type { District } from '@/types';

// Konum izni verilmediğinde elle seçim için yaklaşık ilçe/semt merkezleri.
// Liste mesafeye göre sıralandığı için birkaç km sapma sonucu değiştirmez.
export const ANKARA_DISTRICTS: District[] = [
  // Merkez ilçeler ve büyük semtler
  { name: 'Çankaya (Kızılay)', lat: 39.9208, lng: 32.8541 },
  { name: 'Çayyolu', lat: 39.887, lng: 32.69 },
  { name: 'Bahçelievler', lat: 39.921, lng: 32.824 },
  { name: 'Dikmen', lat: 39.892, lng: 32.839 },
  { name: 'Keçiören', lat: 39.981, lng: 32.866 },
  { name: 'Etlik', lat: 39.97, lng: 32.848 },
  { name: 'Yenimahalle', lat: 39.966, lng: 32.811 },
  { name: 'Batıkent', lat: 39.9695, lng: 32.73 },
  { name: 'Etimesgut', lat: 39.9578, lng: 32.6751 },
  { name: 'Eryaman', lat: 39.98, lng: 32.643 },
  { name: 'Mamak', lat: 39.9347, lng: 32.9197 },
  { name: 'Altındağ (Ulus)', lat: 39.9404, lng: 32.8638 },
  { name: 'Sincan', lat: 39.9669, lng: 32.5794 },
  { name: 'Gölbaşı', lat: 39.7886, lng: 32.8065 },
  { name: 'Pursaklar', lat: 40.0373, lng: 32.9009 },
  // Diğer ilçeler
  { name: 'Akyurt', lat: 40.1307, lng: 33.0874 },
  { name: 'Ayaş', lat: 40.0189, lng: 32.3478 },
  { name: 'Bala', lat: 39.5538, lng: 33.1236 },
  { name: 'Beypazarı', lat: 40.1675, lng: 31.9211 },
  { name: 'Çamlıdere', lat: 40.4906, lng: 32.4761 },
  { name: 'Çubuk', lat: 40.2383, lng: 33.0322 },
  { name: 'Elmadağ', lat: 39.9206, lng: 33.2308 },
  { name: 'Evren', lat: 39.0247, lng: 33.8061 },
  { name: 'Güdül', lat: 40.2106, lng: 32.2433 },
  { name: 'Haymana', lat: 39.4318, lng: 32.4964 },
  { name: 'Kahramankazan', lat: 40.2058, lng: 32.6831 },
  { name: 'Kalecik', lat: 40.0975, lng: 33.4086 },
  { name: 'Kızılcahamam', lat: 40.4696, lng: 32.6503 },
  { name: 'Nallıhan', lat: 40.1858, lng: 31.3525 },
  { name: 'Polatlı', lat: 39.5842, lng: 32.1472 },
  { name: 'Şereflikoçhisar', lat: 38.9394, lng: 33.5386 },
];
