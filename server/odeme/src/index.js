// Patiport ödeme sunucusu (Cloudflare Worker): hekim panelinden kartla tahsilat.
//
// Akış:
//  1. Panel satış belgesini yazar: clinic_pos/{clinicId}/sales/{saleId},
//     status "pending", mode "iyzico_test".
//  2. Panel POST /start çağırır (Authorization: Bearer <Firebase ID token>).
//     Sunucu hekimi doğrular, tutarı belgeden okur (istekten değil), iyzico ödeme
//     formunu başlatır; ödeme sayfası adresini belgeye yazar ve panele döner.
//  3. Hasta sahibi sayfayı telefonunda açıp kartla öder (3D Secure dahil).
//  4. iyzico tarayıcıyı POST /callback'e yollar (form alanı: token). Sunucu sonucu
//     iyzico'dan kendisi sorgular, satış belgesine yazar; panel canlı dinlediği için
//     sonuç anında görünür. Ödeyene sade bir sonuç sayfası gösterilir.
//
// Anahtarlar yalnızca burada (Cloudflare secret) durur, tarayıcıya hiç gitmez.
// Firestore'a hizmet hesabıyla yazılır; bu yazımlar güvenlik kurallarına takılmaz,
// bu yüzden her adımda sahiplik ve tutar burada ayrıca kontrol edilir.
//
// Ortam değişkenleri (wrangler.toml [vars] ve secret'lar):
//   IYZICO_API_KEY, IYZICO_SECRET_KEY   secret; sandbox anahtarları "sandbox-" ile başlar
//   IYZICO_BASE_URL                     https://sandbox-api.iyzipay.com (canlı: https://api.iyzipay.com)
//   FIREBASE_SERVICE_ACCOUNT            secret; Firebase hizmet hesabı JSON'u
//   FIREBASE_PROJECT_ID
//   ALLOWED_ORIGINS                     virgülle ayrılmış panel adresleri (CORS)
//   Yalnızca testte: FIRESTORE_URL, AUTH_URL, DEV_BEARER (emülatöre bağlanmak için),
//                    JWKS_URL (oturum anahtarlarını sahte sunucudan almak için)

const SALES_MODE = 'iyzico_test';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === '/start' && request.method === 'POST') return await start(request, env, url, cors);
      if (url.pathname === '/callback' && request.method === 'POST') return await callback(request, env);
      if (url.pathname === '/health') {
        return json({ ok: true, sandbox: isSandbox(env), configured: Boolean(env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY && env.FIREBASE_SERVICE_ACCOUNT) }, 200, cors);
      }
      return json({ error: 'not_found' }, 404, cors);
    } catch (e) {
      console.error('odeme', e && e.stack ? e.stack : String(e));
      // Ödeyen kişi ham hata değil, sade bir sayfa görsün
      if (url.pathname === '/callback') return page(false, 'Sonuç kaydedilemedi. Ödemeniz alındıysa klinik panelinde görünecektir.');
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};

// ─── /start ──────────────────────────────────────────────────────────────────

async function start(request, env, url, cors) {
  const idToken = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return json({ error: 'auth' }, 401, cors);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400, cors);
  }
  const clinicId = str(body.clinicId, 1, 200);
  const saleId = str(body.saleId, 1, 100);
  if (!clinicId || !saleId || /[/]/.test(clinicId + saleId)) return json({ error: 'bad_request' }, 400, cors);

  const uid = await verifyIdToken(env, idToken);
  if (!uid) return json({ error: 'auth' }, 401, cors);

  const vet = await getDoc(env, `vets/${uid}`);
  if (!vet || vet.data.clinic_id !== clinicId) return json({ error: 'forbidden' }, 403, cors);

  const salePath = `clinic_pos/${clinicId}/sales/${saleId}`;
  const sale = await getDoc(env, salePath);
  if (!sale) return json({ error: 'not_found' }, 404, cors);
  const s = sale.data;
  if (s.created_by !== uid || s.mode !== SALES_MODE) return json({ error: 'forbidden' }, 403, cors);
  if (s.status !== 'pending') return json({ error: 'not_pending' }, 409, cors);
  if (s.pay_url) return json({ url: s.pay_url }, 200, cors); // aynı satış için ikinci çağrı

  const kurus = Number(s.amount_kurus);
  if (!Number.isInteger(kurus) || kurus < 100) return json({ error: 'bad_amount' }, 400, cors);
  const price = formatPrice(kurus);
  const owner = splitName();

  const req = {
    locale: 'tr',
    conversationId: saleId,
    price,
    basketId: clinicId,
    paymentGroup: 'PRODUCT',
    buyer: {
      id: `patiport-${uid.slice(0, 20)}`,
      name: owner.name,
      surname: owner.surname,
      // Kimlik ve iletişim bilgisi toplamıyoruz; iyzico alanları zorunlu tuttuğu için
      // yer tutucu gönderilir. Canlıya geçerken ödeme sözleşmesine göre yeniden ele alınacak.
      identityNumber: '11111111111',
      email: 'odeme@example.com',
      gsmNumber: '+905000000000',
      registrationAddress: vet.data.clinic_name || 'Veteriner kliniği',
      city: 'Türkiye',
      country: 'Turkey',
      ip: request.headers.get('CF-Connecting-IP') || '85.34.78.112',
    },
    billingAddress: {
      contactName: `${owner.name} ${owner.surname}`,
      city: 'Türkiye',
      country: 'Turkey',
      address: vet.data.clinic_name || 'Veteriner kliniği',
    },
    basketItems: [
      {
        id: saleId,
        name: (s.description || 'Veteriner hizmeti').slice(0, 120),
        category1: 'Veteriner hizmeti',
        itemType: 'VIRTUAL',
        price,
      },
    ],
    callbackUrl: `${url.origin}/callback`,
    currency: 'TRY',
    paidPrice: price,
    enabledInstallments: [1],
  };

  const r = await iyzico(env, '/payment/iyzipos/checkoutform/initialize/auth/ecom', req);
  if (r.status !== 'success' || !r.token || !r.paymentPageUrl) {
    console.error('iyzico initialize', r.errorCode, r.errorMessage);
    return json({ error: 'iyzico', message: r.errorMessage || null }, 502, cors);
  }
  const expiresMs = Date.now() + (Number(r.tokenExpireTime) || 1800) * 1000;
  await commit(env, salePath, { pay_token: r.token, pay_url: r.paymentPageUrl, pay_expires_ms: expiresMs }, [], sale.updateTime);
  return json({ url: r.paymentPageUrl, expires_ms: expiresMs }, 200, cors);
}

// ─── /callback ───────────────────────────────────────────────────────────────

async function callback(request, env) {
  const form = await request.formData().catch(() => null);
  const token = form && typeof form.get('token') === 'string' ? form.get('token') : '';
  if (!token || token.length > 200) return page(false, 'Ödeme bilgisi alınamadı.');

  // Sonucu tarayıcıdan gelen veriye değil, iyzico'ya kendimiz sorarak öğreniriz
  const r = await iyzico(env, '/payment/iyzipos/checkoutform/auth/ecom/detail', { locale: 'tr', token });
  const saleId = str(r.conversationId, 1, 100);
  const clinicId = str(r.basketId, 1, 200);
  if (!saleId || !clinicId) return page(false, 'Ödeme bulunamadı.');

  const salePath = `clinic_pos/${clinicId}/sales/${saleId}`;
  const sale = await getDoc(env, salePath);
  if (!sale || sale.data.pay_token !== token) return page(false, 'Ödeme bulunamadı.');
  const s = sale.data;
  const amountOk = Math.round(Number(r.price) * 100) === Number(s.amount_kurus);
  const ok = r.status === 'success' && r.paymentStatus === 'SUCCESS' && amountOk;

  if (s.status === 'approved') return page(true, 'Ödeme daha önce alınmış.');
  // Hekim iptal etmiş olsa bile para çekildiyse kayıt "alındı" olmalı
  if (s.status !== 'pending' && !ok) return page(false, 'Bu ödeme iptal edilmiş.');

  const fields = ok
    ? {
        status: 'approved',
        resolved_by: 'iyzico',
        card_last4: str(r.lastFourDigits, 4, 4),
        card_brand: str(r.cardAssociation, 1, 40),
        auth_code: str(r.authCode, 1, 40),
        payment_id: str(String(r.paymentId ?? ''), 1, 60),
        fail_reason: null,
      }
    : {
        status: 'declined',
        resolved_by: 'iyzico',
        fail_reason: (str(r.errorMessage, 1, 200) || (amountOk ? 'Ödeme tamamlanmadı' : 'Tutar uyuşmadı')),
      };
  await commit(env, salePath, fields, ['resolved_at'], sale.updateTime);
  return ok
    ? page(true, 'Ödemeniz alındı. Bu sayfayı kapatabilirsiniz.')
    : page(false, fields.fail_reason || 'Ödeme tamamlanmadı.');
}

// ─── iyzico ──────────────────────────────────────────────────────────────────

function isSandbox(env) {
  return (env.IYZICO_BASE_URL || '').includes('sandbox');
}

/** iyzico fiyat biçimi (resmî kütüphaneyle aynı): 1250 → "1250.0", 1250.5 → "1250.5" */
export function formatPrice(kurus) {
  const s = String(parseFloat((kurus / 100).toFixed(2)));
  return s.includes('.') ? s : `${s}.0`;
}

/** IYZWSv2 yetkilendirme başlığı: HMAC-SHA256(rnd + yol + gövde) hex, sonra base64. */
export async function iyzicoAuth(apiKey, secretKey, path, bodyText, rnd) {
  const sig = await hmacHex(secretKey, rnd + path + bodyText);
  return `IYZWSv2 ${btoa(`apiKey:${apiKey}&randomKey:${rnd}&signature:${sig}`)}`;
}

async function iyzico(env, path, body) {
  const bodyText = JSON.stringify(body);
  const rnd = `${Date.now()}${Math.random().toString(8).slice(2, 10)}`;
  const res = await fetch((env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com') + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-iyzi-rnd': rnd,
      Authorization: await iyzicoAuth(env.IYZICO_API_KEY, env.IYZICO_SECRET_KEY, path, bodyText, rnd),
    },
    body: bodyText,
  });
  return res.json().catch(() => ({ status: 'failure', errorMessage: `HTTP ${res.status}` }));
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc(text)));
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Firebase ────────────────────────────────────────────────────────────────

/**
 * Firebase ID token'ını doğrular; geçerliyse kullanıcı kimliğini (uid) döner.
 * İmza Google'ın açık anahtarlarıyla (RS256) burada kontrol edilir; web API anahtarına
 * ihtiyaç yoktur. Yalnızca emülatör testinde (AUTH_URL) Auth emülatörüne sorulur.
 */
export async function verifyIdToken(env, idToken) {
  if (env.AUTH_URL) {
    const res = await fetch(`${env.AUTH_URL}/v1/accounts:lookup?key=emulator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const d = res.ok ? await res.json().catch(() => null) : null;
    const u = d && d.users && d.users[0];
    return u && typeof u.localId === 'string' ? u.localId : null;
  }
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  let header, claims;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
  const now = Math.floor(Date.now() / 1000);
  const project = env.FIREBASE_PROJECT_ID;
  if (claims.aud !== project || claims.iss !== `https://securetoken.google.com/${project}`) return null;
  if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128) return null;
  if (!(claims.exp > now) || !(claims.iat <= now + 300) || !(claims.auth_time <= now + 300)) return null;
  const jwk = (await googleKeys(env)).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlDecode(parts[2]), enc(`${parts[0]}.${parts[1]}`));
  return valid ? claims.sub : null;
}

let cachedKeys = null; // { keys, exp }
async function googleKeys(env) {
  if (cachedKeys && cachedKeys.exp > Date.now()) return cachedKeys.keys;
  const res = await fetch(env.JWKS_URL || 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  const d = await res.json();
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('Cache-Control') || '')?.[1] || 3600);
  cachedKeys = { keys: Array.isArray(d.keys) ? d.keys : [], exp: Date.now() + Math.min(maxAge, 6 * 3600) * 1000 };
  return cachedKeys.keys;
}

let cachedToken = null; // { token, exp }

/** Hizmet hesabıyla Google OAuth erişim belirteci (Firestore için), ~1 saat önbellekte. */
async function accessToken(env) {
  if (env.DEV_BEARER) return env.DEV_BEARER;
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt(
    { alg: 'RS256', typ: 'JWT' },
    { iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 },
    sa.private_key
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  const d = await res.json();
  if (!d.access_token) throw new Error(`oauth: ${d.error || res.status}`);
  cachedToken = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

export async function signJwt(header, claims, pem) {
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const input = `${b64url(enc(JSON.stringify(header)))}.${b64url(enc(JSON.stringify(claims)))}`;
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc(input)));
  return `${input}.${b64url(sig)}`;
}

function docsBase(env) {
  const base = env.FIRESTORE_URL || 'https://firestore.googleapis.com';
  return `${base}/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

async function getDoc(env, path) {
  const res = await fetch(`${docsBase(env)}/${path.split('/').map(encodeURIComponent).join('/')}`, { headers: { Authorization: `Bearer ${await accessToken(env)}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore get ${res.status}`);
  const d = await res.json();
  return { data: decodeFields(d.fields || {}), updateTime: d.updateTime };
}

/**
 * Belgeyi günceller. updateTime ön koşulu: okuduğumuzdan beri değişmişse yazmaz
 * (aynı ödeme için iki geri dönüş gelirse ikincisi boşa düşer).
 */
async function commit(env, path, fields, serverTimeFields, updateTime) {
  const name = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  const write = {
    update: { name, fields: encodeFields(fields) },
    updateMask: { fieldPaths: Object.keys(fields) },
    updateTransforms: serverTimeFields.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' })),
    currentDocument: updateTime ? { updateTime } : { exists: true },
  };
  const res = await fetch(`${docsBase(env)}:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken(env)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: [write] }),
  });
  if (!res.ok) throw new Error(`firestore commit ${res.status} ${await res.text()}`);
}

function decodeValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  return null;
}
function decodeFields(f) {
  return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, decodeValue(v)]));
}
function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  throw new Error('encode');
}
function encodeFields(o) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, encodeValue(v)]));
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function enc(s) {
  return new TextEncoder().encode(s);
}
function b64urlDecode(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function str(v, min, max) {
  return typeof v === 'string' && v.length >= min && v.length <= max ? v : null;
}
/** Ödeme sayfasındaki ad soyad; bilgi toplamadığımız için sabit. */
function splitName() {
  return { name: 'Hasta', surname: 'Sahibi' };
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600', Vary: 'Origin' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(obj, status, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

/** Ödeyenin telefonunda görünen sade sonuç sayfası. */
function page(ok, message) {
  const color = ok ? '#23845e' : '#b3261e';
  const title = ok ? 'Ödeme alındı' : 'Ödeme tamamlanmadı';
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f3ef;color:#1c1b19;font:500 17px/1.5 system-ui,-apple-system,sans-serif;padding:24px;box-sizing:border-box}
@media (prefers-color-scheme:dark){body{background:#1f1c19;color:#f7f2eb}}main{max-width:360px;text-align:center}
.i{width:64px;height:64px;border-radius:50%;background:${color};display:grid;place-items:center;margin:0 auto 18px}
h1{font-size:24px;margin:0 0 8px}p{margin:0;opacity:.8}small{display:block;margin-top:24px;opacity:.6}</style></head>
<body><main><div class="i"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ok ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M7 7l10 10M17 7L7 17"/>'}</svg></div>
<h1>${title}</h1><p>${esc(message)}</p><small>Patiport</small></main></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
