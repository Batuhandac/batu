#!/usr/bin/env node
/* Generates placeholder PNG icons (no external deps). Replace with real art before store submission. */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const BG = [11, 15, 26, 255], PINK = [255, 92, 168, 255], TEAL = [46, 230, 214, 255];
// Two bars (a stylised "VI"): a V made of two diagonals and an I bar.
const paint = (inset) => (u, v) => {
  const x = (u - inset) / (1 - 2 * inset), y = (v - inset) / (1 - 2 * inset);
  if (x < 0 || x > 1 || y < 0 || y > 1) return BG;
  const inV = y > 0.22 && y < 0.78 && (Math.abs(x - (0.18 + (y - 0.22) * 0.45)) < 0.055 || Math.abs(x - (0.68 - (y - 0.22) * 0.45)) < 0.055) && x < 0.62;
  const inI = y > 0.22 && y < 0.78 && Math.abs(x - 0.78) < 0.055;
  if (inV) return PINK;
  if (inI) return TEAL;
  return BG;
};
const out = path.join(__dirname, '..', 'assets');
fs.writeFileSync(path.join(out, 'icon.png'), png(1024, paint(0)));
fs.writeFileSync(path.join(out, 'adaptive-icon.png'), png(1024, paint(0.18)));
fs.writeFileSync(path.join(out, 'splash.png'), png(1024, paint(0.3)));
fs.writeFileSync(path.join(out, 'favicon.png'), png(64, paint(0)));
console.log('icons written to', out);
