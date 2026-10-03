// Ortak yardımcılar: kodlama, doğrulama, yanıtlar.

export function enc(s) {
  return new TextEncoder().encode(s);
}

export function b64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function unb64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
export function b64url(bytes) {
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlDecode(s) {
  return unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
}
export function randomId(bytes = 24) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function str(v, min, max) {
  return typeof v === 'string' && v.length >= min && v.length <= max ? v : null;
}

/** Türkiye saatine göre bugünün tarihi (YYYY-AA-GG); Türkiye 2016'dan beri sabit UTC+3. */
export function istanbulDate(ms = Date.now()) {
  return new Date(ms + 3 * 3600e3).toISOString().slice(0, 10);
}

export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
  if (allowedOrigins(env).includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

export function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Yönlendirme yalnızca izinli panel adreslerine yapılır (açık yönlendirme olmasın). */
export function safeReturnUrl(env, url) {
  if (typeof url !== 'string' || url.length > 500) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  return allowedOrigins(env).includes(u.origin) ? u.toString() : null;
}

export function json(obj, status, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Telefonda ya da tarayıcıda görünen sade sonuç sayfası. */
export function page(ok, message, title) {
  const color = ok ? '#23845e' : '#b3261e';
  const head = title || (ok ? 'Ödeme alındı' : 'Ödeme tamamlanmadı');
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(head)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f3ef;color:#1c1b19;font:500 17px/1.5 system-ui,-apple-system,sans-serif;padding:24px;box-sizing:border-box}
@media (prefers-color-scheme:dark){body{background:#1f1c19;color:#f7f2eb}}main{max-width:360px;text-align:center}
.i{width:64px;height:64px;border-radius:50%;background:${color};display:grid;place-items:center;margin:0 auto 18px}
h1{font-size:24px;margin:0 0 8px}p{margin:0;opacity:.8}small{display:block;margin-top:24px;opacity:.6}</style></head>
<body><main><div class="i"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ok ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M7 7l10 10M17 7L7 17"/>'}</svg></div>
<h1>${esc(head)}</h1><p>${esc(message)}</p><small>Patiport</small></main></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export function redirect(url) {
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } });
}

/** Cloudflare'de yanıttan sonra çalıştırır; testte (ctx yok) beklenir. */
export async function defer(ctx, promise) {
  const p = promise.catch((e) => console.error('arka plan', e && e.stack ? e.stack : String(e)));
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p);
  else await p;
}
