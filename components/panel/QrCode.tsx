// Ödeme sayfası adresini hasta sahibinin telefon kamerasıyla açmak için QR kod.
// Yalnızca qrcode paketinin çekirdek kodlayıcısı kullanılır (saf JS, Node modülü
// istemez); çizim react-native-svg ile, hem web'de hem uygulamada çalışır.
import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type QrCore = { create: (text: string, opts?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }) => { modules: { size: number; data: ArrayLike<number> } } };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QR = require('qrcode/lib/core/qrcode') as QrCore;

/** Koyu modülleri tek bir SVG yoluna çevirir (her modül 1x1 kare). */
export function qrPath(text: string): { size: number; d: string } {
  const { size, data } = QR.create(text, { errorCorrectionLevel: 'M' }).modules;
  let d = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (data[r * size + c]) d += `M${c} ${r}h1v1h-1z`;
  }
  return { size, d };
}

export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const { size: n, d } = useMemo(() => qrPath(value), [value]);
  const quiet = 4; // okunabilmesi için kenarda boş alan (modül)
  // Tema ne olursa olsun beyaz zemin üstüne siyah: kameralar en iyi böyle okur
  return (
    <Svg width={size} height={size} viewBox={`${-quiet} ${-quiet} ${n + quiet * 2} ${n + quiet * 2}`} accessibilityLabel="Ödeme sayfası QR kodu">
      <Rect x={-quiet} y={-quiet} width={n + quiet * 2} height={n + quiet * 2} fill="#ffffff" />
      <Path d={d} fill="#111111" />
    </Svg>
  );
}
