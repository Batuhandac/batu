// Firebase: hekim oturumunun doğrulanması ve Firestore'a hizmet hesabıyla erişim.
// Hizmet hesabı yazımları güvenlik kurallarına takılmaz; sahiplik kontrolü çağıran
// uçlarda yapılır.
import { enc, b64url, b64urlDecode } from './util.js';

/**
 * Firebase ID token'ını doğrular; geçerliyse kullanıcı kimliğini (uid) döner.
 * İmza Google'ın açık anahtarlarıyla (RS256) burada kontrol edilir. Yalnızca emülatör
 * testinde (AUTH_URL) Auth emülatörüne sorulur.
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
function docName(env, path) {
  return `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
}

export async function getDoc(env, path) {
  const res = await fetch(`${docsBase(env)}/${path.split('/').map(encodeURIComponent).join('/')}`, { headers: { Authorization: `Bearer ${await accessToken(env)}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore get ${res.status}`);
  const d = await res.json();
  return { data: decodeFields(d.fields || {}), updateTime: d.updateTime };
}

export class PreconditionFailed extends Error {}

async function commit(env, writes) {
  const res = await fetch(`${docsBase(env)}:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken(env)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes }),
  });
  if (res.ok) return;
  const text = await res.text();
  // Ön koşul tutmadı: belge değişmiş, zaten var ya da yok
  if (res.status === 409 || /FAILED_PRECONDITION|ALREADY_EXISTS|NOT_FOUND/.test(text)) throw new PreconditionFailed(text.slice(0, 200));
  throw new Error(`firestore commit ${res.status} ${text.slice(0, 300)}`);
}

/**
 * Belgedeki yalnızca verilen alanları günceller (belge yoksa oluşturur).
 * precondition: { updateTime } okuduğumuzdan beri değişmişse yazmaz; { exists: true }
 * belge yoksa yazmaz. Değeri undefined olan alan silinir.
 */
export async function updateDoc(env, path, fields, opts = {}) {
  await commit(env, [updateWrite(env, path, fields, opts)]);
}

/** Yeni belge oluşturur; zaten varsa PreconditionFailed. */
export async function createDoc(env, path, fields, opts = {}) {
  await commit(env, [createWrite(env, path, fields, opts)]);
}

/** Birden çok yazımı tek seferde yapar: ya hepsi yazılır ya hiçbiri. */
export async function commitAll(env, writes) {
  await commit(env, writes);
}

export function updateWrite(env, path, fields, { serverTime = [], precondition = null } = {}) {
  const present = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  const write = {
    update: { name: docName(env, path), fields: encodeFields(present) },
    updateMask: { fieldPaths: Object.keys(fields).map(fieldPath) },
    updateTransforms: serverTime.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' })),
  };
  if (precondition) write.currentDocument = precondition;
  return write;
}

export function createWrite(env, path, fields, { serverTime = [] } = {}) {
  return {
    update: { name: docName(env, path), fields: encodeFields(fields) },
    updateTransforms: serverTime.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' })),
    currentDocument: { exists: false },
  };
}

export async function deleteDoc(env, path) {
  await commit(env, [{ delete: docName(env, path) }]);
}

function fieldPath(k) {
  return /^[A-Za-z_][A-Za-z_0-9]*$/.test(k) ? k : `\`${k.replace(/[`\\]/g, (c) => `\\${c}`)}\``;
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
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  throw new Error('encode');
}
function encodeFields(o) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, encodeValue(v)]));
}
