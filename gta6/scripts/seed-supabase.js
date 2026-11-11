#!/usr/bin/env node
/* Upserts content/seed.ts into Supabase. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Load the TS seed through a tiny transpile step so we keep a single source of truth.
require('@babel/register')({
  presets: ['babel-preset-expo'],
  extensions: ['.ts', '.tsx', '.js'],
  only: [path.join(__dirname, '..', 'content')],
});
const seed = require('../content/seed');

const supabase = createClient(url, key);
const l = (x) => x ?? null;

async function run() {
  const up = async (table, rows) => {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`${table}: ${rows.length} rows`);
  };
  await up('cheats', seed.SEED_CHEATS.map((c) => ({
    id: c.id, slug: c.slug, title: c.title, category: c.category, effect: c.effect, codes: c.codes,
    status: c.status, notes: l(c.notes), source: l(c.source), verified_at: l(c.verifiedAt), updated_at: c.updatedAt,
  })));
  await up('missions', seed.SEED_MISSIONS.map((m) => ({
    id: m.id, slug: m.slug, order_no: m.order, title: m.title, chapter: m.chapter, protagonist: m.protagonist,
    summary: m.summary, gold_requirements: m.goldRequirements, skip_tips: m.skipTips, tips: m.tips,
    status: m.status, updated_at: m.updatedAt,
  })));
  await up('guides', seed.SEED_GUIDES.map((g) => ({
    id: g.id, slug: g.slug, title: g.title, category: g.category, summary: g.summary, body: g.body,
    status: g.status, updated_at: g.updatedAt,
  })));
  await up('locations', seed.SEED_LOCATIONS.map((x) => ({
    id: x.id, slug: x.slug, name: x.name, type: x.type, x: x.x, y: x.y, description: x.description,
    status: x.status, updated_at: x.updatedAt,
  })));
  await up('updates', seed.SEED_UPDATES.map((u) => ({
    id: u.id, kind: u.kind, title: u.title, body: u.body, href: l(u.href), created_at: u.createdAt,
  })));
}

run().catch((e) => { console.error(e.message); process.exit(1); });
