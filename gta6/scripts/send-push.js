#!/usr/bin/env node
/*
 * Sends a push to every registered token via Expo's push API, localized per token.
 * Usage: node scripts/send-push.js --tr "Ölümsüzlük doğrulandı" --en "Invincibility verified" --href /cheat/invincibility
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
const { createClient } = require('@supabase/supabase-js');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const tr = get('--tr'); const en = get('--en'); const href = get('--href');
if (!tr || !en) { console.error('Usage: --tr "..." --en "..." [--href /cheat/slug]'); process.exit(1); }

const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

async function run() {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('push_tokens').select('token, lang');
  if (error) throw new Error(error.message);
  const messages = (data ?? []).map((r) => ({
    to: r.token,
    sound: 'default',
    title: 'Leonida Codes',
    body: r.lang === 'tr' ? tr : en,
    data: href ? { href } : {},
  }));
  console.log(`Sending to ${messages.length} tokens`);
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(chunk),
    });
    const json = await res.json();
    const bad = (json.data ?? []).filter((t) => t.status !== 'ok');
    if (bad.length) console.warn(`chunk ${i / 100}: ${bad.length} failed`, bad.slice(0, 3));
  }
  console.log('Done');
}

run().catch((e) => { console.error(e.message); process.exit(1); });
