#!/usr/bin/env node
/*
 * Rebuilds content/data/leonida-locations.json from the community GTADB catalogue.
 * Source (public domain / CC BY 4.0, rolux, Yanis, Dupzor & contributors):
 *   https://map.gtadb.org/data/6/landmarks.json  (canonical; blocks non-browser clients)
 *   https://raw.githubusercontent.com/jahid611/gta6map/main/src/data/generated/locations.json (normalised mirror)
 * Usage: node scripts/import-leonida.js [path-to-locations.json]
 */
const fs = require('fs');
const path = require('path');

async function load(arg) {
  if (arg) return JSON.parse(fs.readFileSync(arg, 'utf8'));
  const res = await fetch('https://raw.githubusercontent.com/jahid611/gta6map/main/src/data/generated/locations.json');
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
}

(async () => {
  const items = (await load(process.argv[2])).filter((i) => i.kind === 'landmark');
  const xs = items.map((i) => i.x); const ys = items.map((i) => i.y);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const side = Math.max(maxx - minx, maxy - miny);
  const x0 = (minx + maxx) / 2 - side / 2; const y0 = (miny + maxy) / 2 - side / 2;
  const locations = [];
  for (const i of items) {
    const flags = i.flags || [];
    if (flags.includes('may-not-exist') || flags.includes('fictional')) continue;
    const status = i.nameStatus === 'confirmed' ? 'verified' : i.nameStatus === 'unconfirmed' ? 'rumor' : 'unverified';
    locations.push({
      id: i.legacyId, slug: i.slug, name: i.name, area: i.area, category: i.categorySlug,
      x: +(((i.x - x0) / side) * 100).toFixed(2), y: +((100 - ((i.y - y0) / side) * 100)).toFixed(2),
      gx: i.x, gy: i.y, status, named: i.nameStatus === 'confirmed', desc: i.description || null,
    });
  }
  const byArea = {};
  for (const l of locations) (byArea[l.area] ||= []).push(l);
  const areas = Object.entries(byArea).filter(([, v]) => v.length >= 8).map(([name, v]) => ({
    name, x: +(v.reduce((a, b) => a + b.x, 0) / v.length).toFixed(2), y: +(v.reduce((a, b) => a + b.y, 0) / v.length).toFixed(2), count: v.length,
  })).sort((a, b) => b.count - a.count);
  const meta = {
    source: 'GTADB / map.gtadb.org via jahid611/gta6map src/data/generated/locations.json',
    license: 'GTADB data: public domain / CC BY 4.0 (attribution: rolux, Yanis, Dupzor & contributors)',
    fetchedAt: new Date().toISOString().slice(0, 10), bounds: { x0, y0, side }, count: locations.length, named: locations.filter((l) => l.named).length,
  };
  const out = path.join(__dirname, '..', 'content', 'data', 'leonida-locations.json');
  fs.writeFileSync(out, JSON.stringify({ meta, areas, locations }));
  console.log(`wrote ${out}: ${meta.count} locations (${meta.named} named), ${areas.length} areas`);
})().catch((e) => { console.error(e.message); process.exit(1); });
