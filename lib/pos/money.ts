// Tutarlar kuruş (tam sayı) olarak saklanır; ekranda "₺1.250,00".

/** "850", "850,5", "1.250,00", "1250.00", "₺ 99" → kuruş. Geçersiz ya da sıfırsa null. */
export function parseTL(input: string): number | null {
  let s = input.replace(/[₺\s]|TL/gi, '').trim();
  if (!s) return null;
  // Hem nokta hem virgül varsa: son gelen ondalık ayırıcıdır
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    const dec = lastComma > lastDot ? ',' : '.';
    const thou = dec === ',' ? '.' : ',';
    s = s.split(thou).join('').replace(dec, '.');
  } else if (lastComma > -1) {
    s = s.replace(',', '.');
  } else if (lastDot > -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.split('.').join(''); // "1.250" = bin iki yüz elli
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const kurus = Math.round(Number(s) * 100);
  return kurus > 0 && Number.isSafeInteger(kurus) ? kurus : null;
}

/** 125000 → "₺1.250,00" */
export function formatTL(kurus: number): string {
  const neg = kurus < 0;
  const abs = Math.abs(Math.round(kurus));
  const lira = Math.floor(abs / 100);
  const k = String(abs % 100).padStart(2, '0');
  const withDots = String(lira).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}₺${withDots},${k}`;
}
